# 🎯 Simulation Interactive SD-WAN — Équilibrage de Charge WAN

Bienvenue dans cette **simulation visuelle et interactive** du concept d’équilibrage de charge dans un réseau SD-WAN (Software Defined WAN), orientée sur la répartition du trafic entre plusieurs liens WAN hétérogènes (MPLS, Fibre, 4G, Internet…).

---

## 🚀 Aperçu

Cette application web vous permet de :
- **Visualiser dynamiquement un réseau SD-WAN** (succursales, CPE, liens WAN)
- **Personnaliser** le nombre de succursales, d’hôtes, de liens, et tous leurs paramètres
- **Lancer une simulation animée** d’envoi de paquets entre sites, avec animation visible des paquets et des liens utilisés
- **Choisir l’algorithme d’équilibrage** (Round Robin ou Round Robin pondéré)
- **Obtenir des statistiques en temps réel** (nombre de paquets par lien, ratios, graphiques)
- **Comparer la répartition réelle vs théorique** selon vos pondérations

**Tout fonctionne dans un simple navigateur** : aucun backend, aucune dépendance lourde, tout est dans `index.html` (ou 3 fichiers si vous préférez séparer).

---

## 🧑‍🏫 Pédagogie : Équilibrage WAN SD-WAN vs Équilibrage Classique

- En SD-WAN, on équilibre le **trafic réseau sortant** de toute une entreprise sur différents liens physiques (WAN), pas entre des serveurs applicatifs.
- L’enjeu : exploiter au mieux la capacité de chaque lien (différents coûts, performances, fiabilité), éviter la congestion, garantir la continuité.
- Ici, **chaque paquet peut partir sur un lien WAN différent**, selon un algorithme d’équilibrage.
- **Round Robin pondéré** permet d’utiliser plus certains liens (ex : la Fibre, plus rapide, a un « poids » supérieur).
- **Ce n’est pas du load balancing de serveurs web** (où on répartit les requêtes entre plusieurs serveurs), mais bien de l’optimisation physique du routage SD-WAN.

---

## 🕹️ Fonctionnalités

### 1. **Paramétrage complet**
- Nombre de succursales (2 à 4)
- Nombre d’hôtes (2 à 5 par site)
- Nombre et type de liens WAN (MPLS, Fibre, 4G, Internet…)
- Pour chaque lien : couleur, bande passante, latence, perte, poids (pour l’algorithme pondéré)
- Algorithme d’équilibrage : Round Robin ou Round Robin pondéré
- Vitesse d’envoi des paquets, nombre total de paquets

### 2. **Visualisation réseau animée**
- Schéma SVG dynamique : chaque site, ses PC, son CPE, les liens WAN colorés
- Animation du trajet de chaque paquet entre les sites, via les liens WAN : les paquets « voyagent » visuellement sur les liens, qui s’illuminent

### 3. **Statistiques en temps réel**
- Nombre de paquets passés sur chaque lien
- Ratio réel vs ratio théorique des poids
- Graphiques camembert et barres
- Message de validation si l’équilibrage respecte les pondérations

### 4. **Explication pédagogique intégrée**
- Fenêtre d’aide sur la différence SD-WAN/Load Balancer classique

---

## 📦 Installation & Utilisation

Aucune installation !  
**Ouvrez simplement `index.html` dans votre navigateur préféré** (Chrome, Firefox, Edge…).

1. Choisissez vos paramètres (succursales, hôtes, liens, poids…)
2. Cliquez sur « Démarrer »
3. Observez les paquets s’animer et les liens WAN s’illuminer selon l’équilibrage choisi
4. Arrêtez la simulation pour voir les statistiques détaillées

---

## 💡 Personnalisation

- Vous pouvez modifier le code dans `index.html` :
    - Changer les couleurs, ajouter des types de liens
    - Modifier la logique d’équilibrage (dans le JS)
    - Adapter le style (utilise Tailwind CSS CDN)
- Tout est commenté et conçu pour être pédagogique et facile à adapter.

---

## 🧑‍💻 Structure du dépôt

```
index.html      # Tout-en-un : interface, logique, visualisation, stats
README.md       # Ce document
```
*(Vous pouvez aussi scinder en `index.html`, `style.css`, `script.js` si vous préférez.)*

---

## 🏆 Pour aller plus loin

- Tentez différentes pondérations pour voir l’impact sur la répartition réelle !
- Comparez Round Robin simple et pondéré.
- Faites varier la latence ou la perte sur les liens pour illustrer un SD-WAN intelligent.
- Intégrez de nouveaux algorithmes (policy-based, etc.) pour des TP avancés.

---

## 📝 Licence

Projet pédagogique, libre d’utilisation et de modification.

---

## 👨‍🎓 Auteur

*Simulation et design : theTigerFox — 2025*

---

**Bonne simulation et bonne découverte du SD-WAN !**