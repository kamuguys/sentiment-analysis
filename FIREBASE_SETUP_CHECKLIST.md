# Firebase Admin Authentication - Quick Setup Checklist

## ✅ Completed (Automated)

- [x] Frontend `.env.local` configured with your Firebase credentials
- [x] Backend `.env` configured with Firebase Project ID (`smes-5d914`)
- [x] Backend Firebase initialization updated to support project ID only mode
- [x] Admin auth service layer ready (already in `backend/services/adminAuth.js`)
- [x] Frontend admin login UI ready (uses Firebase when credentials detected)
- [x] Frontend rebuilt to detect Firebase authentication

## 🔧 Manual Setup Required (Next Steps)

### Step 1: Download Service Account Key (5 minutes)
```bash
# Go to: https://console.firebase.google.com/project/smes-5d914/settings/serviceaccounts/adminsdk
# Click "Generate New Private Key"
# Save as: backend/config/serviceAccountKey.json

# Then set environment variable (choose one):

# Option A - File path (local dev)
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/backend/config/serviceAccountKey.json

# Option B - Environment variable (CI/CD)
export FIREBASE_SERVICE_ACCOUNT_JSON=$(cat backend/config/serviceAccountKey.json | jq -c)
```

### Step 2: Verify Firebase Connection
```bash
cd /home/rennie/Desktop/projects/SME
node backend/scripts/setup-firebase-admins.js
```

Expected output: `✅ Firebase Authentication API available`

### Step 3: Create Firebase Admin User
1. Go to [Firebase Console → Authentication](https://console.firebase.google.com/project/smes-5d914/authentication/users)
2. Click **"Add user"**
3. Email: `admin@example.com`
4. Password: `Admin123!@`
5. Copy the **User UID** (looks like: `AbCdEfGhIjKlMnOpQrStUvWxYz`)

### Step 4: Map Admin to Business in Firestore
1. Go to [Firestore Database](https://console.firebase.google.com/project/smes-5d914/firestore/data)
2. Create collection: **`admins`** (if not exists)
3. Create document with ID = **User UID from Step 3**
4. Add fields:
   ```
   uid: AbCdEfGhIjKlMnOpQrStUvWxYz
   email: admin@example.com
   businessId: business-1
   enabled: true
   createdAt: (server timestamp)
   updatedAt: (server timestamp)
   ```

### Step 5: Start Backend & Frontend
```bash
# Terminal 1 - Backend
cd /home/rennie/Desktop/projects/SME
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/backend/config/serviceAccountKey.json
node server.js

# Terminal 2 - Frontend
cd /home/rennie/Desktop/projects/SME/my-app
npm run dev
```

### Step 6: Test Admin Login
1. Go to `http://localhost:5173/admin/login`
2. Email: `admin@example.com`
3. Password: `Admin123!@`
4. Business ID: `business-1`
5. Click **"Access Admin Dashboard"**

## 📊 Architecture Summary

```
Frontend Admin Login (Firebase auth UI)
         ↓
    Firebase Auth
         ↓
  Get ID Token
         ↓
  POST /admin/login
         ↓
Backend Admin Auth Service
         ├─ Verify Firebase ID Token
         ├─ Query Firestore admins collection
         ├─ Check business isolation
         └─ Issue session token
         ↓
  Store token in localStorage
         ↓
Admin Dashboard Protected Routes
```

## 🔒 Security

- ✅ No mock tokens in production (Firebase only)
- ✅ ID token expiration handled
- ✅ Admin→Business isolation enforced
- ✅ Firestore security rules ready
- ✅ Service account key protected (local only)

## 📁 Key Files

- `frontend/.env.local` - Firebase web config
- `backend/.env` - Firebase project ID
- `backend/config/firestore.js` - Firebase Admin SDK initialization
- `backend/services/adminAuth.js` - Token verification
- `backend/scripts/setup-firebase-admins.js` - Setup helper
- `FIREBASE_ADMIN_SETUP.md` - Detailed guide

---

**Ready?** → Download service account key and follow steps 1-6 above.
