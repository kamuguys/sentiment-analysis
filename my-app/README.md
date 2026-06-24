# Zambian SME Sentiment Insights

A mobile-first React + Vite dashboard for Zambian SMEs showing sentiment metrics, aspect breakdowns, language analytics, and model performance.

## Features

- Responsive SaaS-style dashboard layout
- KPI cards with sparklines
- Sentiment trend and aspect analysis charts
- Early warning alerts and AI insight summaries
- Language analytics and model performance sections
- Firebase initialization ready for Auth/Firestore/Storage
- Mock AfriBERTa service for sentiment and aspect predictions

## Getting started

```bash
cd my-app
npm install --legacy-peer-deps
npm run dev
```

Then open the local URL shown in the terminal.

## Available scripts

- `npm run dev` - start the development server
- `npm run build` - build production assets
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint
- `npm run format` - format files with Prettier

## Notes

- The dashboard uses TailwindCSS for styling.
- Firebase config is loaded from env variables in `src/services/firebase.js`.
- The app includes placeholder feature pages for navigation items outside the dashboard.
