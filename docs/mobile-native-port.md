# Portage Native Mobile Kendronics

Le site web reste la reference produit et design. L'application mobile doit etre une implementation native qui consomme les memes API, pas une WebView.

## Principe

- Web : Next.js, Tailwind, composants HTML.
- Mobile : Expo React Native, composants natifs, stockage securise, navigation mobile.
- Backend commun : API Render, PostgreSQL, stockage S3/R2, memes utilisateurs et memes donnees.

## Pourquoi on ne copie pas directement les fichiers du site

Les fichiers du site utilisent des primitives web : `div`, `a`, CSS, Tailwind, `window`, `localStorage`, router Next et comportements navigateur. React Native utilise `View`, `Text`, `Pressable`, `Image`, `FlatList`, `SecureStore` et une navigation mobile.

Le portage fiable consiste a partager :

- les contrats API ;
- les types de donnees ;
- les workflows produit ;
- les assets et regles de design ;
- les validations metier cote API.

Puis chaque ecran est reconstruit en composants natifs.

## Parite cible

- Compte : login, inscription, profil prive, profil public, edition, verification.
- Explorer : reels, forks, suivis, detail projet, auteurs, badges, follow, likes, favoris, commentaires, vues.
- Projet : creation post gratuit, creation projet payant, brouillon technique, upload media/fichiers, publication, modification, suppression, masquage.
- Marketplace : paiement, licences, fichiers proteges, telechargement.
- Devis et commandes : configuration PCB, panier, suivi, livraison, notifications.

## Etat actuel

- Base Expo native.
- Session securisee.
- Connexion reelle.
- Explorer reel.
- Like reel.
- Profil connecte a l'utilisateur reel.
- Navigation mobile de base.

## Prochaine phase

Porter Explorer complet avec detail projet, profil auteur, follow, favoris, commentaires, vues et medias video natifs.
