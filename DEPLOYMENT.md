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
7. Pour modifier l'adresse de contact affichee sur le site, ajoute:
   - `NEXT_PUBLIC_OFFICIAL_CONTACT_EMAIL=contact.kendronics@gmail.com`
8. Si l'API est deployee plus tard, ajoute cette variable dans Vercel:
   - `NEXT_PUBLIC_API_BASE_URL=https://url-de-ton-api`

## API

Le site peut etre heberge gratuitement sur Vercel, mais l'API NestJS dans `apps/api` doit etre hebergee separement si tu veux des donnees serveur persistantes, des emails, paiements, admin, etc.

Variables utiles pour l'API:

- `DATABASE_URL=postgresql://...`
- `JWT_SECRET` valeur longue et aleatoire
- `JWT_ACCESS_TOKEN_TTL_SECONDS=900`
- `ADMIN_EMAILS=contact.kendronics@gmail.com`
- `FRONTEND_ORIGIN=https://url-de-ton-site-vercel`
- `PORT` fourni par l'hebergeur
- `OFFICIAL_CONTACT_EMAIL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI=https://url-publique-de-ton-api/api/auth/oauth/google/callback`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` optionnel pour Cloudflare R2 ou autre stockage compatible S3
- `PREFERRED_PCB_SUPPLIER=pcbway`
- `PCBWAY_API_KEY` cle API fournie par PCBWay
- `PCBWAY_BALANCE_ENDPOINT=https://api-partner.pcbway.com/api/Account/QueryBalance`
- `PCBWAY_QUOTE_ENDPOINT=https://api-partner.pcbway.com/api/Pcb/PcbQuotation`
- `PCBWAY_ORDER_ENDPOINT=https://api-partner.pcbway.com/api/Pcb/PlaceOrder`
- `REQUIRE_LIVE_SUPPLIER_PRICING=true`

Commandes utiles:

- `npm run db:generate` genere le client Prisma.
- `npm run db:migrate` applique les migrations en developpement avec `apps/api/.env`.
- `npm run db:deploy` applique les migrations en staging/production.

### Deploiement API recommande

1. Cree une base PostgreSQL cloud, par exemple Neon ou Supabase.
2. Copie son URL de connexion dans `DATABASE_URL`.
3. Cree un service web Node.js pour l'API, par exemple avec Render.
4. Utilise `render.yaml` si tu choisis Render.
5. L'URL de sante de l'API sera `/api/health`.
6. Quand l'API est publique, ajoute dans Vercel:
   - `NEXT_PUBLIC_API_BASE_URL=https://url-publique-de-ton-api`
   - `NEXT_PUBLIC_OFFICIAL_CONTACT_EMAIL=contact.kendronics@gmail.com`
7. Redeploie le site web Vercel.

### Checklist production avant ouverture grand public

- L'API Render repond sur `/api/health`.
- `NEXT_PUBLIC_API_BASE_URL` dans Vercel pointe vers l'URL publique Render.
- `NEXT_PUBLIC_OFFICIAL_CONTACT_EMAIL` dans Vercel correspond a l'adresse publique Kendronics.
- `NEXT_PUBLIC_GOOGLE_OAUTH_URL` dans Vercel pointe vers `https://url-publique-de-ton-api/api/auth/oauth/google/start`.
- `FRONTEND_ORIGIN` dans Render vaut `https://kendronics.vercel.app`.
- Les variables Google OAuth sont definies dans Render et l'URI de callback correspond exactement a Google Cloud.
- `JWT_SECRET` est une valeur longue et unique, pas la valeur exemple.
- `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` sont en mode live quand tu acceptes de vrais paiements.
- Le webhook Stripe pointe vers `https://url-publique-de-ton-api/api/payments/webhooks/stripe`.
- SMTP est configure avec un mot de passe d'application ou un fournisseur email transactionnel.
- Le bucket prive S3/R2 est cree et les variables `S3_*` sont renseignees.
- PCBWay est configure dans Render avec `PREFERRED_PCB_SUPPLIER=pcbway`, `PCBWAY_API_KEY`, `PCBWAY_BALANCE_ENDPOINT`, `PCBWAY_QUOTE_ENDPOINT`, `PCBWAY_ORDER_ENDPOINT` et `REQUIRE_LIVE_SUPPLIER_PRICING=true`.
- Le parcours complet est teste: inscription, connexion, upload Gerber, devis, commande, paiement, suivi, ticket support.

## Developpement local avec PostgreSQL

1. Installe Docker Desktop ou PostgreSQL localement.
2. Copie `apps/api/.env.example` vers `apps/api/.env`.
3. Si Docker est installe, lance `docker compose up -d postgres`.
4. Lance `npm run db:migrate`.
5. Lance `npm run api:dev`.

Si Docker n'est pas installe, installe PostgreSQL localement ou cree une base cloud PostgreSQL, puis remplace `DATABASE_URL` dans `apps/api/.env`.
