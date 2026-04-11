# Star Ops Item Finder

Star Citizen helper for people in the verse to find what you need.

## Cleaner game-style UI mockup

This repository now includes a static HTML/CSS mockup for a cleaner game-style item finder interface, plus a small Node backend for serving the mockup and app data.

### Open locally

- `npm start` runs the backend at `http://127.0.0.1:3000`
- The backend serves the existing static frontend and JSON API endpoints

### Run tests

- `npm test` runs the HTML/CSS regression checks.
- `npm run test:coverage` runs the same suite with Node's built-in coverage output.

### App data

- `data/app-data.json` contains the structured app content and UI data for the current mockup.

### Backend API

- `GET /api/health` returns the backend health status
- `GET /api/app-data` returns the app JSON used by the mockup
