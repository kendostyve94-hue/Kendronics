# Kendronics Mobile

Application mobile Expo branchee sur la meme API que le site Kendronics.

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

## Publication iPhone

- Test rapide : Expo Go.
- Test prive : Apple TestFlight avec un compte Apple Developer.
- Publication publique : App Store Connect apres configuration icones, captures, politique de confidentialite et build iOS.
