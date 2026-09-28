// Tiré de « Projet d'acquisition d'un camion de livraison réfrigéré », 2026-05-08.
export default {
  ordre: 1,
  titre: 'Un camion réfrigéré',
  accroche: 'Pour rapporter chaque jour la viande, les produits laitiers, les fruits et les légumes que nos partenaires nous réservent.',
  pourquoi: [
    'Chaque jour, nous allons chercher des dons chez des épiceries, des producteurs et d’autres organismes. Sans camion réfrigéré, une partie des denrées fraîches nous échappe : la viande et les produits laitiers ne se transportent pas sans froid, et chaque tournée reste limitée en volume.',
    'Un camion cube réfrigéré d’occasion, de 12 à 16 pieds, changerait cela pour de bon. Ce n’est pas une dépense courante : c’est un outil qui servira des années, à chaque tournée.',
  ],
  statut: 'a-financer',
  illustration: 'camion',
  budget: [
    { postes: [
      { poste: 'Camion cube réfrigéré d’occasion, 12 à 16 pieds', note: 'Taxes, mise en route et lettrage compris', montant: 65000 },
    ] },
  ],
  // Ce qui est déjà acquis.
  financement: [
    { source: 'Le Centre Espoir, à même ses fonds propres', montant: 15000 },
  ],
  // 'commandite' : le partenaire voit son logo sur le camion (pas de reçu).
  reconnaissance: 'commandite',
  offre: 'Le coût peut se partager entre plusieurs entreprises. Chacune voit son logo sur le côté du camion, qui circule chaque jour dans la région.',
  partenaires: [],
};
