// Petits outils partagés par les fiches de projet. Un fichier dont le nom
// commence par « _ » n'est pas un projet : le chargeur l'ignore.

// TPS 5 % + TVQ 9,975 %.
export const TAXES = 0.14975;
export const avecTaxes = (montant) => Math.round(montant * (1 + TAXES) * 100) / 100;
