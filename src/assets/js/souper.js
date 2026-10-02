/* Le bouton qui ferme l'annonce du Souper Saveurs d'Afrique (src/partials/annonce.html).
   Le souvenir de la fermeture reste dans le navigateur du visiteur; rien n'est envoyé.
   Sans JavaScript, le bouton reste caché et l'annonce s'affiche simplement. */
(function () {
  'use strict';
  var bar = document.querySelector('.ce-souper-bar');
  var close = bar && bar.querySelector('.ce-souper-bar-close');
  if (!close) return;
  close.hidden = false;
  close.addEventListener('click', function () {
    try { localStorage.setItem('ce-souper-2026', 'done'); } catch (e) {}
    document.documentElement.classList.add('sans-souper');
  });
})();
