# Audit technique — 25 octobre 2026

## Périmètre
Lecture du dépôt, dépendances, compilation, types, lint et tests unitaires.
Aucune clé ni base Supabase réelle disponible : aucune migration exécutée sur
votre infrastructure et aucun test de commande réelle ou de connexion réelle.
Ce dépôt est une boutique mono-équipe, **pas un SaaS multi-locataire** : si plusieurs
commerçants doivent isoler leurs données, un modèle tenant_id et des politiques
RLS par organisation sont encore nécessaires.

## Corrections livrées
- Commande publique : suppression de l'INSERT suivi d'un SELECT interdit par RLS.
  RPC SQL limitée, coordonnées validées, référence UUID et prix calculés en base.
- Suppression de l'accès administrateur pour tout simple compte authentifié :
  liste explicite `admin_users`, RLS et contrôle à la connexion / dans le middleware.
- Redirections d'authentification : conservation des cookies rafraîchis.
- Numéros ivoiriens : conservation du zéro national dans les liens WhatsApp,
  validation des formats locaux et internationaux, second numéro compris.
- Packs : refus des quantités sans palier (auparavant un pack supérieur pouvait
  recevoir le prix du pack inférieur), validation des quantités et montants dans
  l'éditeur ; garde contre un produit sans tarifs sur sa page publique.
- Tableau de bord : lecture paginée avant agrégation, suppression de la limite
  silencieuse de 500 commandes et de la limite PostgREST pour les marges/dépenses.
- Mises à jour de commandes sans rollback de toute la liste, erreurs visibles,
  boutons désactivés pendant la mise à jour et synchronisation des dates livrées.
- Dépenses : montants entiers positifs, confirmation de suppression, erreurs réseau.
- Échecs de lecture : ne plus afficher des zéros / faux produits inexistants ;
  écran d'erreur avec relance. Échecs d'envoi : boutons débloqués dans finally.
- Fichier formulaire à la racine redirigé vers l'implémentation réellement utilisée.
- Configuration : `.env.example`, `.gitignore`, lint non interactif et tests.
- Dépendances corrigées ; migration API Next.js (cookies et params asynchrones).

## Vérifications automatisées
`npm test` : téléphones, packs, livraisons, marge brute et validation des paliers.
`npm run lint`, `npm run typecheck`, `npm run build`, `npm audit`.
Ces vérifications ne prouvent pas que tous les bugs ont disparu.

## À faire avant production
1. Sauvegarder la base et tester la migration SQL sur un projet de recette.
2. Ajouter le compte administrateur à `admin_users` (voir README).
3. Vérifier : un visiteur ne lit aucune commande/dépense ; un compte non admin
   ne peut ni lire ni modifier ces tables ; seul l'admin peut gérer les produits.
4. Passer une commande anonyme, vérifier la référence et le tarif stockés ; tenter
   un produit inactif, une quantité inexistante et un téléphone invalide.
5. Tester connexion, déconnexion, changement de statut, relance et temps réel avec
   deux fenêtres ; activer la publication `supabase_realtime` pour `orders`.
6. Tester les parcours sur mobile, les images et le numéro WhatsApp réel.

## Risques / limites restant à traiter
- Pas de CAPTCHA ni de limitation de débit persistante pour la RPC publique :
  ajouter une protection anti-spam avant d'exposer la boutique à fort trafic.
- Stock indicatif (initial moins livraisons), pas de réservation atomique : la
  boutique ne garantit pas l'absence de survente. Le badge « En stock » reste
  déclaratif, comme les délais et garanties affichés ; les valider commercialement.
- Les coûts des produits sont relus au tarif actuel : modifier le coût de revient
  modifie les marges historiques. Il faut des coûts figés à la commande/livraison
  et une migration comptable des anciens enregistrements pour un historique fiable.
- Les dépenses « livraison » sont soustraites en plus du coût livreur prévu par
  produit : ne saisir ici que les suppléments, sinon double comptage. Les achats
  de stock sont exclus du résultat car les pièces livrées sont déjà comptabilisées.
- Pagination exhaustive : agrégations encore côté application ; préférer des RPC
  d'agrégation et une liste paginée pour de très gros volumes.
- Le catalogue public expose encore les colonnes coût/stock du produit : séparer
  les données internes dans une table privée si elles sont confidentielles.
- Validation admin principalement applicative ; renforcer les contraintes SQL
  produits après vérification/nettoyage des données existantes.
