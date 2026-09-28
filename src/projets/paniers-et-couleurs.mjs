// Tiré de « Proposition de projet familial », 2026-07-07. 10,000 $ sur deux ans.
// Nommer la famille : accord de David, 2026-09-28.
import { avecTaxes } from './_outils.mjs';

const enseigne = avecTaxes(970);
const lettrage = avecTaxes(227.99);

export default {
  ordre: 10,
  titre: 'Garnir les paniers et afficher nos couleurs',
  accroche: 'Des pâtes alimentaires pour les paniers, une enseigne sur notre bâtiment et le lettrage de notre camion, sur deux ans.',
  pourquoi: [
    'Les pâtes alimentaires nous sont rarement offertes, et elles partent toujours trop vite de nos étagères. Et jusqu’ici, rien sur notre bâtiment ni sur notre camion n’indiquait notre présence dans le quartier.',
    'La Famille Ravenda a choisi de financer les deux : la plus grande part va aux denrées, le reste nous rend visibles.',
  ],
  statut: 'en-cours',
  budget: [
    { titre: 'Première année', postes: [
      { poste: 'Nouvelle enseigne sur le bâtiment', note: '$970.00 + taxes', montant: enseigne, etat: 'en-attente' },
      { poste: 'Pâtes alimentaires', note: 'Le reste de la première année', montant: 5000 - enseigne, etat: 'commande' },
    ] },
    { titre: 'Deuxième année', postes: [
      { poste: 'Lettrage du camion de livraison', note: '$227.99 + taxes', montant: lettrage, etat: 'a-venir' },
      { poste: 'Pâtes alimentaires', note: 'Le reste de la deuxième année', montant: 5000 - lettrage, etat: 'a-venir' },
    ] },
  ],
  financement: [
    { source: 'Famille Ravenda', montant: 10000 },
  ],
  reconnaissance: 'don',
  partenaires: [{ nom: 'Famille Ravenda' }],
};
