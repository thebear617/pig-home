import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const membershipDataPath = fileURLToPath(new URL('./src/data/membership-data.ts', import.meta.url));

function membershipRenewalDevSync() {
  return {
    name: 'membership-renewal-dev-sync',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = new URL(request.url || '/', 'http://localhost');
        if (!requestUrl.pathname.endsWith('/__dev/membership-renewal')) {
          next();
          return;
        }
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.setHeader('Allow', 'POST');
          response.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        request.on('data', chunk => {
          body += chunk;
          if (body.length > 4096) request.destroy();
        });
        request.on('end', () => {
          try {
            const payload = JSON.parse(body);
            const name = typeof payload.name === 'string' ? payload.name : '';
            const expireDate = typeof payload.expireDate === 'string' ? payload.expireDate : '';
            const willRenew = payload.willRenew === true;
            if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(expireDate)) throw new Error('Invalid membership record');

            const source = fs.readFileSync(membershipDataPath, 'utf8');
            const lines = source.split('\n');
            const lineIndex = lines.findIndex(line => line.includes(`name: '${name}'`) && line.includes(`expireDate: '${expireDate}'`));
            if (lineIndex < 0) throw new Error('Membership record not found');
            if (!/willRenew:\s*(?:true|false)/.test(lines[lineIndex])) throw new Error('Membership record has no willRenew field');
            lines[lineIndex] = lines[lineIndex].replace(/willRenew:\s*(?:true|false)/, `willRenew: ${willRenew}`);
            fs.writeFileSync(membershipDataPath, lines.join('\n'), 'utf8');

            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(JSON.stringify({ ok: true, name, expireDate, willRenew }));
          } catch (error) {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to update membership data' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: process.env.SITE_BASE || '/',
  vite: {
    plugins: [membershipRenewalDevSync()],
    server: { strictPort: true },
  },
  build: {
    format: 'directory',
  },
});
