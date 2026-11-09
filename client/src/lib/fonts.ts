export function loadFonts() {
  if (document.querySelector("[data-clinic-fonts]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.clinicFonts = "true";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(link);
}
