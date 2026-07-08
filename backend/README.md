# SME Backend

This backend is a lightweight Express server for business management and Meta Graph API proxying.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Meta credentials.

4. Start the backend:
   ```bash
   npm run dev
   ```

## Available routes

- `GET /businesses?ownerId=...`
- `GET /businesses/:id`
- `POST /businesses`
- `PUT /businesses/:id`
- `DELETE /businesses/:id`
- `GET /meta/page-posts`
- `GET /meta/instagram-account`
