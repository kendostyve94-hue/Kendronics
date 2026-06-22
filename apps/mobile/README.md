# Kendronics Mobile

Application mobile Expo qui embarque le site Kendronics public dans une WebView native.

Cette approche garde une seule source produit : le site web. Les corrections de design, profil, Explorer, projets, panier et devis sont visibles dans l'application sans reconstruire deux interfaces separees.

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

Par defaut, l'application ouvre le site production :

```text
https://kendronics.com
```

Pour utiliser une autre URL :

```bash
EXPO_PUBLIC_SITE_URL=https://votre-site.example.com npm run start
```

## Fonctionnalites phase 1

- Charge le vrai site Kendronics mobile.
- Utilise les memes comptes, sessions, projets, medias, commandes et profils que le web.
- Garde les liens externes hors WebView en les ouvrant dans le navigateur du telephone.
- Supporte le pull-to-refresh et les medias inline.

## Publication iPhone

- Test rapide : Expo Go.
- Test prive : Apple TestFlight avec un compte Apple Developer.
- Publication publique : App Store Connect apres configuration icones, captures, politique de confidentialite et build iOS.
