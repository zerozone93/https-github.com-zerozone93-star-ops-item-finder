# ⭐ Star Ops Item Finder

A comprehensive web application for finding and exploring Star Citizen resources, weapons, armor, crafting recipes, and mining guides.

## 🚀 Live App

Deployed at: `https://<your-username>.github.io/https-github.com-zerozone93-star-ops-item-finder/`

## ✨ Features

- **Resources** — Browse all minable resources with rarity, type filters, and location data
- **Mining Guide** — Step-by-step guides for FPS, ROC, and Ship mining methods
- **Crafting** — Recipe viewer with ingredient lists and blueprint information
- **Combat** — Weapons and armor database with stats and obtain methods
- **Item Detail** — Deep-linked detail pages for every item
- **Global Search** — Search across all item types from the navbar

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** for fast builds
- **React Router v6** for client-side routing
- Dark sci-fi themed CSS (no external UI frameworks)

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗂️ Project Structure

```
src/
├── components/    # Reusable UI components
├── context/       # React context (data provider)
├── pages/         # Route-level page components
├── types/         # TypeScript interfaces
└── utils/         # Helper functions and hooks
public/
└── star-citizen-data.json   # Game data (patch 3.23 sample)
.github/workflows/
└── deploy.yml     # GitHub Pages auto-deploy
```

## 📋 Data

Game data is stored in `public/star-citizen-data.json`. The current data covers:
- 10 resources (Quantanium, Bexalite, Taranite, etc.)
- 10 locations (Stanton system)
- 3 mining methods
- 6 tools
- 4 vehicles
- 5 recipes + 4 blueprints
- 7 weapons
- 6 armor pieces
- 7 vendors + 9 loot sources

> **Note:** Data is sample/illustrative. Values may not reflect exact current in-game numbers.

## 🚀 Deployment

The app auto-deploys to GitHub Pages via GitHub Actions on every push to `main`.

To enable GitHub Pages:
1. Go to **Settings → Pages**
2. Set source to **GitHub Actions**

## 📄 License

MIT
