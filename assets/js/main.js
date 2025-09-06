// Mobile menu only (no theme toggles anywhere)
const btn = document.getElementById('menuBtn');
const nav = document.getElementById('siteNav');
btn?.addEventListener('click', ()=>{
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});