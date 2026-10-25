# Moïva — boutique et suivi des commandes

Boutique en ligne légère pour la vente par WhatsApp à Abidjan : une page de vente
publique où le client commande sans compte, et un tableau de bord privé pour suivre
les commandes, les dépenses et les marges réelles.

Next.js 14 · Supabase · Tailwind CSS

---

## Ce que ça fait

**Page de vente** (`/p/<produit>`) — carrousel de photos à défilement automatique,
badges de réassurance, paliers de prix avec livraison offerte au-delà d'une quantité,
formulaire avec les communes d'Abidjan. La commande part directement en base ; le
client reçoit un numéro de commande.

**Tableau de bord** (`/admin`, protégé)
- **Commandes** — arrivée en temps réel, statuts (nouvelle / confirmée / livrée /
  annulée), lien WhatsApp pré-rempli par client, marquage des relances, stock restant.
- **Produits** — plusieurs produits, chacun avec ses paliers de prix, son coût de
  revient, ses photos et son stock.
- **Dépenses** — publicité, stock, livraison, autre.
- **Marges** — encaissé, marge brute, résultat net après publicité, coût d'acquisition
  par commande, taux d'annulation, et le détail par produit.

---

## Installation

### 1. Créer le projet Supabase

Sur [supabase.com](https://supabase.com), créez un projet, puis ouvrez
**SQL Editor → New query**, collez tout le contenu de `supabase/schema.sql` et
cliquez sur **Run**. Cela crée les tables, les règles de sécurité et un produit
d'exemple.

### 2. Créer votre compte administrateur

Dans Supabase, **Authentication → Users → Add user**. Renseignez votre email et un
mot de passe, et cochez **Auto Confirm User**. C'est ce compte qui ouvrira `/admin`.

> Désactivez les inscriptions publiques dans **Authentication → Providers → Email**
> (option *Enable sign ups*), sinon n'importe qui pourrait créer un compte et lire
> vos commandes.

### 3. Activer le temps réel sur les commandes

**Database → Replication → `supabase_realtime`**, et activez la table `orders`.
Sans cela, les nouvelles commandes n'apparaissent qu'après rechargement de la page.

### 4. Configurer et lancer

```bash
cp .env.example .env.local
# puis renseignez les valeurs (Supabase > Settings > API)

npm install
npm run dev
```

Ouvrez http://localhost:3000.

---

## Variables d'environnement

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `NEXT_PUBLIC_WHATSAPP` | Votre numéro, format `225XXXXXXXXXX` |

La clé `anon` est publique par nature : la sécurité repose sur les règles RLS du
schéma, pas sur le secret de cette clé. **Ne mettez jamais la clé `service_role`
dans ce projet.**

---

## Déploiement

### Vercel

```bash
git init && git add . && git commit -m "Boutique Moïva"
git remote add origin git@github.com:<vous>/moiva-shop.git
git push -u origin main
```

Puis sur Vercel : **Add New → Project**, importez le dépôt, ajoutez les trois
variables d'environnement, et déployez.

### Netlify

Même dépôt, build command `npm run build`, et installez le plugin
`@netlify/plugin-nextjs` (proposé automatiquement lors de l'import).

---

## Ce qui reste à faire vous-même

- **Les photos.** Les images se renseignent par adresse web dans **Produits**.
  Hébergez-les où vous voulez (Supabase Storage, Cloudinary, votre serveur).
  Remplacez les visuels générés par de vraies photos dès réception du stock.
- **Le stock.** Le stock restant se calcule à partir du stock initial moins les
  pièces livrées. Mettez à jour le stock initial à chaque réapprovisionnement.
- **Les sauvegardes.** Supabase sauvegarde automatiquement sur les offres payantes.
  Sur l'offre gratuite, exportez vos commandes régulièrement.

---

## Structure

```
supabase/schema.sql        Tables, sécurité, produit d'exemple
src/middleware.ts          Protection de /admin
src/lib/                   Types, calculs de prix et de marge, clients Supabase
src/components/            Carrousel, formulaire, commandes, produits, dépenses
src/app/p/[slug]/          Page de vente publique
src/app/admin/             Tableau de bord
```
