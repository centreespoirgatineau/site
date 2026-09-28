// Tiré de « Projet d'acquisition d'un camion de livraison réfrigéré », 2026-05-08.
export default {
  ordre: 1,
  court: 'Un camion réfrigéré',
  titre: 'Un camion réfrigéré',
  accroche: 'Pour rapporter chaque jour la viande, les produits laitiers, les fruits et les légumes que nos partenaires nous réservent.',
  pourquoi: [
    'Chaque jour, nous allons chercher des dons chez des épiceries, des producteurs et d’autres organismes. Sans camion réfrigéré, une partie des denrées fraîches nous échappe : la viande et les produits laitiers ne voyagent pas sans froid, et chaque tournée reste limitée en volume.',
    'Un camion cube réfrigéré d’occasion, de 12 à 16 pieds, change cela pour de bon : plus de denrées fraîches dans chaque panier, tous les jours. Ce n’est pas une dépense courante, c’est un outil qui servira des années.',
  ],
  statut: 'a-financer',
  illustration: 'camion',
  bouton: 'Devenir partenaire',
  sujet: 'Partenaire du camion réfrigéré',
  budget: [
    { postes: [
      { poste: 'Camion cube réfrigéré d’occasion, 12 à 16 pieds', note: 'Taxes, mise en route et lettrage compris', montant: 65000 },
    ] },
  ],
  // Ce qui est déjà acquis.
  financement: [
    { source: 'Le Centre Espoir', montant: 15000 },
  ],
  // Les paliers de commandite. PROPOSITION À CONFIRMER PAR DAVID (2026-09-28) :
  // un partenaire principal et six partenaires couvrent exactement ce qui reste,
  // 20,000 + 6 × 5,000 = 50,000. Le test vérifie que la somme tombe juste.
  offres: [
    { id: 'principal', nom: 'Partenaire principal', montant: 20000, places: 1, avantages: [
      'Votre logo en grand à l’arrière du camion',
      'Et en tête, sur les deux côtés',
      'Sur cette page et dans notre rapport annuel',
    ] },
    { id: 'partenaire', nom: 'Partenaire', montant: 5000, places: 6, avantages: [
      'Votre logo sur les deux côtés du camion',
      'Sur cette page et dans notre rapport annuel',
    ] },
  ],
  // { nom: 'Entreprise', palier: 'partenaire', logo: 'entreprise.svg' }
  partenaires: [],
};
