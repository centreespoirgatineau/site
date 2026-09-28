// Tiré de « Proposition de projet familial », 2026-07-07. $10,000 sur deux ans.
// Nommer la famille : accord de David, 2026-09-28.
import { avecTaxes } from './_outils.mjs';

const enseigne = avecTaxes(970);
const lettrage = avecTaxes(227.99);

export default {
  ordre: 10,
  court: 'Des paniers et une enseigne',
  titre: 'Garnir les paniers et afficher nos couleurs',
  accroche: 'Des pâtes alimentaires pour les paniers, une enseigne sur notre bâtiment et le lettrage de notre camion.',
  pourquoi: [
    'Les pâtes alimentaires nous sont rarement offertes, et elles partent toujours trop vite de nos étagères. Et jusqu’ici, rien sur notre bâtiment ni sur notre camion n’indiquait notre présence dans le quartier.',
    'La Famille Ravenda a choisi de financer les deux : la plus grande part va aux denrées, le reste nous rend visibles.',
  ],
  statut: 'en-cours',
  duree: 'sur deux ans',
  budget: [
    { titre: 'Première année', postes: [
      { poste: 'Nouvelle enseigne sur le bâtiment', note: '$970.00 + taxes', montant: enseigne, etat: 'en-attente', categorie: 'visibilite' },
      { poste: 'Pâtes alimentaires', note: 'Le reste de la première année', montant: 5000 - enseigne, etat: 'commande', categorie: 'denrees' },
    ] },
    { titre: 'Deuxième année', postes: [
      { poste: 'Lettrage du camion de livraison', note: '$227.99 + taxes', montant: lettrage, etat: 'a-venir', categorie: 'visibilite' },
      { poste: 'Pâtes alimentaires', note: 'Le reste de la deuxième année', montant: 5000 - lettrage, etat: 'a-venir', categorie: 'denrees' },
    ] },
  ],
  financement: [
    { source: 'la Famille Ravenda', montant: 10000 },
  ],
  partenaires: [{ nom: 'Famille Ravenda' }],
};
