# FoodMap Region Style Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the styled region-directory buttons and hidden region panels after the FoodMap `area/location` to `region` field migration.

**Architecture:** Keep the current `FoodMap.astro` markup and interaction logic unchanged. Align the existing FoodMap CSS selectors in `src/styles/global.css` with the current `foodmap-region-*` class names, including desktop, mobile, active, and hidden states.

**Tech Stack:** Astro 7, TypeScript, CSS, npm build scripts.

## Global Constraints

- Do not modify food-place content, schema, search logic, or map logic.
- Preserve the unrelated working-tree change in `src/data/utility-records.ts`.
- Keep the existing desktop vertical directory and mobile horizontal scrolling behavior.
- Run `npm run build` and `git diff --check` before reporting completion.

---

### Task 1: Align FoodMap region selectors

**Files:**
- Modify: `src/styles/global.css:5581-5712` and `src/styles/global.css:6151-6168`
- Test: source selector consistency check and Astro build output

**Interfaces:**
- Consumes: current `FoodMap.astro` classes `.foodmap-region-list`, `.foodmap-region-button`, and `.foodmap-region-content`.
- Produces: styled region buttons with the existing desktop/mobile visual behavior and correct hidden-panel behavior.

- [ ] **Step 1: Run the failing selector consistency check**

Run:

```bash
node -e "const fs=require('fs'); const css=fs.readFileSync('src/styles/global.css','utf8'); for (const cls of ['foodmap-region-list','foodmap-region-button','foodmap-region-content']) { if (!css.includes('.'+cls)) throw new Error('missing CSS selector: '+cls); }"
```

Expected: FAIL because the current stylesheet still defines only the old `foodmap-area-*` and `foodmap-location-*` selectors.

- [ ] **Step 2: Replace stale region-directory selectors with current names**

In `src/styles/global.css`, rename the selectors in the FoodMap directory block as follows while preserving every declaration:

- `.foodmap-area-list` → `.foodmap-region-list`
- `.foodmap-area-button` → `.foodmap-region-button`
- `.foodmap-area-button:hover` → `.foodmap-region-button:hover`
- `.foodmap-area-button.active` → `.foodmap-region-button.active`
- `.foodmap-area-button span:first-child` → `.foodmap-region-button span:first-child`
- `.foodmap-area-button b` → `.foodmap-region-button b`
- `.foodmap-area-button small` → `.foodmap-region-button small`
- `.foodmap-area-button > span:last-child` → `.foodmap-region-button > span:last-child`
- `.foodmap-region-content[hidden]` must replace `.foodmap-area-content[hidden]` in the hidden-state selector list.

Update the mobile rules in the same way so `.foodmap-region-list`, `.foodmap-region-button`, and `.foodmap-region-button.active` retain the current horizontal-scrolling layout. Leave unrelated legacy selectors elsewhere in the stylesheet untouched unless they are part of this FoodMap block.

- [ ] **Step 3: Run the selector consistency check again**

Run the same Node command from Step 1.

Expected: PASS with no output.

- [ ] **Step 4: Build and inspect the generated page**

Run:

```bash
npm run build
git diff --check
rg -o 'foodmap-region-(list|button|content)' dist/food-map/index.html | sort | uniq -c
```

Expected: Astro exits 0, `git diff --check` exits 0, and the generated page contains the current region class names. The build may report pre-existing warnings; report them separately if present.

- [ ] **Step 5: Review the scoped diff**

Run:

```bash
git diff --cached --name-status
git diff -- src/styles/global.css
git status --short
```

Expected: only `src/styles/global.css` is an unstaged task change; the unrelated `src/data/utility-records.ts` modification remains untouched, and the already committed design/plan docs remain separate.
