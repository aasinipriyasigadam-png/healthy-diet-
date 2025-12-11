// Small script to open/close mobile nav and enable smooth focus handling
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');

  if (btn && nav) {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      // use aria-hidden on nav for simple show/hide
      nav.setAttribute('aria-hidden', String(expanded));
    });

    // ensure nav accessible state matches initial
    nav.setAttribute('aria-hidden', nav.getAttribute('aria-hidden') || 'true');
  }

  // Smooth scroll for hash links (if desired)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        target.setAttribute('tabindex','-1');
        target.focus();
      }
    });
  });
});
