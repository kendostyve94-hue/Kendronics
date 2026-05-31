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
- `PHONE_VERIFY_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `TWILIO_VERIFY_CHANNEL=sms`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` optionnel pour Cloudflare R2 ou autre stockage compatible S3
- `PREFERRED_PCB_SUPPLIER=pcbway`
- `PCBWAY_API_KEY` cle API fournie par le fournisseur partenaire
- `PCBWAY_BALANCE_ENDPOINT=https://api-partner.pcbway.com/api/Account/QueryBalance`
- `PCBWAY_QUOTE_ENDPOINT=https://api-partner.pcbway.com/api/Pcb/PcbQuotation`
- `PCBWAY_ORDER_ENDPOINT=https://api-partner.pcbway.com/api/Pcb/PlaceOrder`
- `REQUIRE_LIVE_SUPPLIER_PRICING=true`
- `MONDAY_REQUIRED=true`
- `MONDAY_API_KEY`
- `MONDAY_BOARD_COMMANDES_ID`
- `MONDAY_BOARD_CHIFFRE_AFFAIRE_LIVE_ID`
- `MONDAY_BOARD_EN_PRODUCTION_ID`
- `MONDAY_BOARD_LOGISTICS_INTERNATIONAL_ID`
- `MONDAY_BOARD_LOGISTIQUE_LOCALE_ID`
- `MONDAY_BOARD_SUPPORT_CLIENTS_ID`
- `MONDAY_COLUMN_TITLE_MAP_COMMANDES` recommande pour remplir les colonnes automatiquement par titre visible
- `MONDAY_COLUMN_TITLE_MAP_CHIFFRE_AFFAIRE_LIVE` recommande pour remplir les colonnes automatiquement par titre visible
- `MONDAY_COLUMN_TITLE_MAP_EN_PRODUCTION` recommande pour remplir les colonnes automatiquement par titre visible
- `MONDAY_COLUMN_TITLE_MAP_LOGISTICS_INTERNATIONAL` recommande pour remplir les colonnes automatiquement par titre visible
- `MONDAY_COLUMN_TITLE_MAP_LOGISTIQUE_LOCALE` recommande pour remplir les colonnes automatiquement par titre visible
- `MONDAY_COLUMN_TITLE_MAP_SUPPORT_CLIENTS` recommande pour remplir les colonnes automatiquement par titre visible

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
- Twilio Verify est configure avec `PHONE_VERIFY_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` et `TWILIO_VERIFY_CHANNEL=sms`.
- Le bucket prive S3/R2 est cree et les variables `S3_*` sont renseignees.
- Le fournisseur partenaire est configure dans Render avec `PREFERRED_PCB_SUPPLIER=pcbway`, `PCBWAY_API_KEY`, `PCBWAY_BALANCE_ENDPOINT`, `PCBWAY_QUOTE_ENDPOINT`, `PCBWAY_ORDER_ENDPOINT` et `REQUIRE_LIVE_SUPPLIER_PRICING=true`.
- Monday est configure avec un token API et les IDs des boards `COMMANDES`, `CHIFFRE D'AFFAIRE LIVE` et `EN PRODUCTION`; `MONDAY_REQUIRED=true` doit rester actif en production pour bloquer un faux mode.
- Le parcours complet est teste: inscription, connexion, upload Gerber, devis, commande, paiement, suivi, ticket support.

### Configuration Twilio Verify

1. Dans Twilio Console, cree ou ouvre ton compte Twilio.
2. Active un sender compatible SMS pour les pays cibles.
3. Dans Verify, cree un service Kendronics.
4. Copie:
   - Account SID vers `TWILIO_ACCOUNT_SID`
   - Auth Token vers `TWILIO_AUTH_TOKEN`
   - Verify Service SID vers `TWILIO_VERIFY_SERVICE_SID`
5. Mets `PHONE_VERIFY_PROVIDER=twilio` et `TWILIO_VERIFY_CHANNEL=sms`.
6. En production, ne jamais mettre `PHONE_VERIFY_PROVIDER=dev`; l'API bloque deja ce mode.
7. Teste avec un vrai numero au format international, par exemple `+237...`.

### Configuration Monday.com

1. Dans Monday, cree les boards operationnels:
   - `COMMANDES`
   - `CHIFFRE D'AFFAIRE LIVE`
   - `EN PRODUCTION`
2. Cree un token API Monday avec acces aux boards.
3. Recupere l'ID de chaque board depuis l'URL Monday ou via l'API.
4. Configure dans l'hebergeur API:
   - `MONDAY_REQUIRED=true`
   - `MONDAY_API_KEY=...`
   - `MONDAY_BOARD_COMMANDES_ID=...`
   - `MONDAY_BOARD_CHIFFRE_AFFAIRE_LIVE_ID=...`
   - `MONDAY_BOARD_EN_PRODUCTION_ID=...`
   - `MONDAY_BOARD_LOGISTICS_INTERNATIONAL_ID=...`
   - `MONDAY_BOARD_LOGISTIQUE_LOCALE_ID=...`
   - `MONDAY_BOARD_SUPPORT_CLIENTS_ID=...`
   - `MONDAY_COLUMN_TITLE_MAP_COMMANDES={"orderNumber":"Id commande","customerName":"Nom Client"}`
   - `MONDAY_COLUMN_TITLE_MAP_CHIFFRE_AFFAIRE_LIVE={"orderNumber":"ID Commande","paymentStatus":"PaymentStatus"}`
   - `MONDAY_COLUMN_TITLE_MAP_EN_PRODUCTION={"internalReference":"Élément","productionStatus":"Statut Production"}`
5. Laisse `MONDAY_SYNC_DISABLED` absent ou a `false`.
6. Apres une commande ou un paiement, verifie que les lignes `MondaySyncLog` passent de `pending`/`retry` a `processed`.
7. Les valeurs de `MONDAY_COLUMN_TITLE_MAP_*` utilisent les titres visibles des colonnes Monday. Si tu preferes les IDs techniques, utilise `MONDAY_COLUMN_MAP_*`.

## Developpement local avec PostgreSQL

1. Installe Docker Desktop ou PostgreSQL localement.
2. Copie `apps/api/.env.example` vers `apps/api/.env`.
3. Si Docker est installe, lance `docker compose up -d postgres`.
4. Lance `npm run db:migrate`.
5. Lance `npm run api:dev`.

Si Docker n'est pas installe, installe PostgreSQL localement ou cree une base cloud PostgreSQL, puis remplace `DATABASE_URL` dans `apps/api/.env`.
