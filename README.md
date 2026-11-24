# NewMy — PWA de suivi musculation

Première version fonctionnelle, en HTML/CSS/JavaScript vanilla.

## Lancer l'application
- Ouvre `index.html` dans un navigateur pour tester l'interface.
- Pour tester l'installation PWA et le mode hors ligne, publie le dossier sur un hébergement HTTPS (par exemple GitHub Pages ou Netlify), ou lance un serveur local.
- Sur mobile, ouvre l'URL hébergée dans le navigateur puis utilise « Ajouter à l'écran d'accueil » / « Installer ».

## Fonctions
- Programmes A et B préremplis.
- Saisie du poids et des répétitions par série, validation des séries, ajout de séries.
- Préremplissage du poids à partir de la dernière charge enregistrée pour cet exercice.
- Historique, détail et suppression des séances.
- Suivi de la charge maximale par exercice.
- Objectif hebdomadaire modifiable (1 à 7 séances).
- Export et import JSON.
- Stockage local dans le navigateur, service worker pour le mode hors ligne.

## Important
Les données sont conservées uniquement dans le navigateur et sur l'appareil utilisés. Elles ne sont pas synchronisées entre plusieurs appareils. Exporte régulièrement une sauvegarde JSON. Effacer les données du navigateur peut supprimer les séances enregistrées.

Le volume affiché est une estimation calculée en additionnant `poids × répétitions` pour chaque série validée. Les charges des machines peuvent varier d'une machine à l'autre.
