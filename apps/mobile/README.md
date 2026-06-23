# Kendronics Mobile

Application mobile Expo native branchee sur la meme API que le site Kendronics.

Objectif produit : porter le site complet en application native, sans WebView, avec les memes comptes, projets, medias, commandes, profils, likes, favoris, commentaires, follow, devis et panier.

Important : les fichiers Next.js du site ne peuvent pas etre colles tels quels dans React Native, parce que le site utilise le DOM web, CSS/Tailwind, composants HTML et router Next. Le portage propre consiste a garder les memes donnees/API et a reconstruire les ecrans en composants natifs.

## Tester sur iPhone avec Expo Go

1. Installer Expo Go depuis l'App Store.
2. Installer les dependances dans ce dossier :

```bash
npm install
```

3. Lancer l'application :

```bash
npm run start
```

4. Scanner le QR code avec l'appareil photo de l'iPhone ou Expo Go.

Par defaut, l'application utilise l'API production :

```text
https://kendronics-api.onrender.com
```

Pour utiliser une autre API :

```bash
EXPO_PUBLIC_API_BASE_URL=https://votre-api.example.com npm run start
```

## Fonctionnalites phase 1

- Connexion avec le compte Kendronics existant.
- Session stockee dans le trousseau securise du telephone.
- Explorer branche sur les projets publics reels.
- Likes branches sur l'API existante pour les utilisateurs connectes.
- Profil connecte a `/api/users/me`.
- Navigation basse mobile : Accueil, Panier, Devis, Explorer, Compte.

## Portage complet

Ordre de portage prevu pour atteindre la parite avec le site :

1. Authentification, session, profil prive et profil public.
2. Explorer complet : reels, forks, suivis, detail projet, likes, favoris, commentaires, follow.
3. Creation et modification de projets : posts gratuits, projets payants, upload image/video/fichiers.
4. Panier, devis PCB, suivi de commande, paiement et notifications.
5. Parametres compte, verification, support, parrainage et pages legales.

## Publication iPhone

- Test rapide : Expo Go.
- Test prive : Apple TestFlight avec un compte Apple Developer.
- Publication publique : App Store Connect apres configuration icones, captures, politique de confidentialite et build iOS.
