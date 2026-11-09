export function loadFonts() {
  if(document.querySelector('[data-clinic-fonts]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.dataset.clinicFonts='true';
  link.href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Roboto:wght@300;400;500&family=Montserrat:wght@400;500;600&display=swap';
  document.head.appendChild(link);
}
