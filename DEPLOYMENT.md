# Deploiement gratuit du site web

## Option conseillee: Vercel

Le site `apps/web` est une application Next.js. Vercel est donc l'option la plus simple pour l'heberger gratuitement sur un projet personnel.

1. Cree un compte sur https://vercel.com.
2. Mets ce dossier dans un depot GitHub.
3. Dans Vercel, clique sur **Add New Project** puis importe le depot.
4. Garde la racine du projet comme dossier du projet.
5. Vercel lira `vercel.json` et utilisera:
   - Install Command: `npm ci`
   - Build Command: `npm run web:build`
   - Output Directory: `apps/web/.next`
6. Pour le site web seul, tu peux deployer sans variable d'environnement.
7. Si l'API est deployee plus tard, ajoute cette variable dans Vercel:
   - `NEXT_PUBLIC_API_BASE_URL=https://url-de-ton-api`

## API

Le site peut etre heberge gratuitement sur Vercel, mais l'API NestJS dans `apps/api` doit etre hebergee separement si tu veux des donnees serveur persistantes, des emails, paiements, admin, etc.

Variables utiles pour l'API:

- `FRONTEND_ORIGIN=https://url-de-ton-site-vercel`
- `PORT` fourni par l'hebergeur
- `OFFICIAL_CONTACT_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
