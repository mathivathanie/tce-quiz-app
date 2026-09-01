

## Step 1: Install Dependencies

### Backend Setup
```bash
cd Backend
npm install
```

### Frontend Setup
```bash
cd Frontend
npm install
```

---

## Step 2: Create Environment Files

### Backend Configuration
Create a `.env` file in the `Backend/` directory with these variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Session & Security
SESSION_SECRET=your_secret_key_here_make_it_long_and_random

# URLs
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Optional: Additional CORS origins (comma-separated)
# CORS_ORIGINS=https://example.com,https://another.com

# Server Port (optional, default is 3001)
PORT=3001
```

### Frontend Configuration
Create a `.env` file in the `Frontend/` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

---

## Step 3: Run the Application

### Option A: Run Both in Separate Terminals (Recommended)

**Terminal 1 - Backend (Port 3001):**
```bash
cd Backend
npm start
# or npm run dev
```

Expected output:
```
Server running on http://localhost:3001
```

**Terminal 2 - Frontend (Port 5173):**
```bash
cd Frontend
npm run dev
```

Expected output:
```
VITE v7.1.0  ready in 123 ms

➜  Local:   http://localhost:5173/
```

Then open `http://localhost:5173` in your browser.

---

### Option B: Run Backend Only (API Testing)

```bash
cd Backend
npm start
```

Test the API:
```bash
# In another terminal, test if backend is running
curl http://localhost:3001/api/health
```

---

### Option C: Build for Production

**Backend:** No build needed, runs directly with Node.js

**Frontend:** Build for production
```bash
cd Frontend
npm run build
```

This creates an optimized build in `Frontend/dist/`

Then preview it:
```bash
npm run preview
```

---

## Development Tips

### Backend
- Edit `Backend/api.js` - changes require restart
- To auto-restart on file changes, install `nodemon`:
  ```bash
  npm install --save-dev nodemon
  npm start  # Will auto-restart when files change
  ```

### Frontend
- Edit files in `Frontend/src/` - changes auto-refresh in browser (HMR)
- No restart needed during development

### Linting
```bash
# Frontend linting
cd Frontend
npm run lint
```

---

## Troubleshooting

### Port Already in Use
- Backend (3001): `netstat -ano | findstr :3001` (Windows) or `lsof -i :3001` (Mac/Linux)
- Frontend (5173): Kill the process or change port in `vite.config.js`

### MongoDB Connection Error
- Check connection string in `.env`
- Verify MongoDB is running or accessible
- Check if IP whitelist allows your IP (MongoDB Atlas)

### CORS Errors
- Verify `FRONTEND_URL` matches your frontend URL exactly
- Check `CORS_ORIGINS` environment variable if needed

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ | - | MongoDB connection string |
| `SESSION_SECRET` | ✅ | - | Secret key for sessions (use random string) |
| `FRONTEND_URL` | ✅ | - | Frontend application URL |
| `SERVER_URL` | ✅ | - | Backend server URL |
| `GOOGLE_CLIENT_ID` | ✅ | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | - | Google OAuth client secret |
| `PORT` | ❌ | 3001 | Server port number |
| `GOOGLE_CALLBACK_URL` | ❌ | SERVER_URL + /api/auth/google/callback | OAuth callback URL |
| `CORS_ORIGINS` | ❌ | - | Additional CORS origins (comma-separated) |

---

## Quick Start Command

**One-liner to install all dependencies:**
```bash
cd Backend && npm install && cd ../Frontend && npm install
```

Then start both servers in separate terminals as shown in Option A.

---

## API Endpoints

The backend provides APIs at `http://localhost:3001/api/`

Common endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/logout` - User logout
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create new quiz

---

## Getting Help

- Check the `README_HOSTING.md` for additional backend details
- Check `Frontend/README.md` for frontend-specific info
- Review error messages in the terminal
- Check browser console (F12) for frontend errors
