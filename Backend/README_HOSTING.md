Backend hosting notes

- Start: npm install && npm start
- Uses PORT env var (default 3001).
- Configure:
  MONGODB_URI=
  SESSION_SECRET=
  FRONTEND_URL=
  SERVER_URL=
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_CALLBACK_URL= (optional; defaults to SERVER_URL + /api/auth/google/callback)
  CORS_ORIGINS= (comma-separated extra origins)

