const toggle = document.getElementById('sidebarToggle');
const backdrop = document.getElementById('sidebarBackdrop');
const close = document.getElementById('sidebarClose');

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  document.body.style.overflow = '';
}

function openSidebar() {
  document.body.classList.add('sidebar-open');
  document.body.style.overflow = 'hidden';
}

toggle?.addEventListener('click', openSidebar);
backdrop?.addEventListener('click', closeSidebar);
close?.addEventListener('click', closeSidebar);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSidebar();
});

document.querySelectorAll<HTMLAnchorElement>('.sidebar-item').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 720) closeSidebar();
  });
});
