# Firebase Admin Authentication Setup Guide

## Project Details
- **Project ID**: smes-5d914
- **Firebase Console**: https://console.firebase.google.com/project/smes-5d914

## Step 1: Download Service Account Key (Backend)

This allows the backend to authenticate with Firebase and verify admin tokens.

1. Go to [Firebase Console](https://console.firebase.google.com/project/smes-5d914/settings/serviceaccounts/adminsdk)
2. Click **"Generate New Private Key"**
3. A JSON file will download (e.g., `smes-5d914-firebase-adminsdk-xyz.json`)
4. **Keep this file secure** — never commit to git

## Step 2: Add to Backend Environment

**Option A: Via File Path (Recommended for local dev)**
```bash
# Copy the service account JSON to the project
cp /path/to/smes-5d914-firebase-adminsdk-xyz.json ./backend/config/serviceAccountKey.json

# In backend/.env, set:
GOOGLE_APPLICATION_CREDENTIALS=./backend/config/serviceAccountKey.json
```

**Option B: Via Environment Variable (Recommended for CI/CD)**
```bash
# Read the JSON and set as env var:
export FIREBASE_SERVICE_ACCOUNT_JSON=$(cat ./backend/config/serviceAccountKey.json | jq -c)

# Or in backend/.env:
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"smes-5d914",...}'
```

## Step 3: Create Firestore Admin Collection

Run this command to set up the Firestore admins collection schema:

```bash
cd /home/rennie/Desktop/projects/SME
node backend/scripts/setup-firebase-admins.js
```

This will:
- Create the `admins` collection in Firestore
- Add your first admin user
- Set up security rules

## Step 4: Create Test Admin User in Firebase Auth

1. Go to [Firebase Console → Authentication](https://console.firebase.google.com/project/smes-5d914/authentication/users)
2. Click **"Create user"** or **"Add user"**
3. Email: `admin@example.com`
4. Password: `Admin123!@` (or any strong password)
5. Click **"Create"**
6. Copy the **User UID**

## Step 5: Map Admin User to Business (Firestore)

1. Go to [Firestore Database](https://console.firebase.google.com/project/smes-5d914/firestore/data)
2. Create or navigate to the **`admins`** collection
3. Create a new document with ID = **the User UID from Step 4**
4. Add fields:
   ```
   uid: (auto-filled or copy from UID)
   email: admin@example.com
   businessId: business-1
   enabled: true
   createdAt: (server timestamp)
   updatedAt: (server timestamp)
   role: admin (optional, for future RBAC)
   ```

## Step 6: Test Admin Login

### Frontend
1. Go to `http://localhost:5173/admin/login`
2. Email: `admin@example.com`
3. Password: `Admin123!@`
4. Business ID: `business-1`
5. Click **"Access Admin Dashboard"**

### Backend (Via curl)
```bash
# Get Firebase ID token (requires Firebase CLI or manual auth)
# For testing, use this endpoint after frontend login to verify flow

curl -X GET http://localhost:4000/admin/dashboard/business-1 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

## Step 7: Firestore Security Rules (Production)

Replace Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Businesses: owner can read/write
    match /businesses/{businessId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
    }
    
    // Admins: only Firebase can write, users can read their own
    match /admins/{adminId} {
      allow read: if request.auth.uid == resource.data.uid;
      allow create, update, delete: if false; // Backend only
    }
    
    // Comments/Analysis: business owner can read
    match /businesses/{businessId}/comments/{commentId} {
      allow read: if request.auth.uid == get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerId;
    }
  }
}
```

## Troubleshooting

**"Cannot find GOOGLE_APPLICATION_CREDENTIALS"**
- Make sure the file path is correct
- Try using `FIREBASE_SERVICE_ACCOUNT_JSON` instead

**"Firestore project is missing or disabled"**
- Enable Firestore in [Firebase Console → Build → Firestore Database](https://console.firebase.google.com/project/smes-5d914/firestore)
- Select "Start in production mode"

**"Admin token verification failed"**
- Check that the admin user exists in Firebase Authentication
- Verify the admin mapping exists in Firestore `admins` collection
- Ensure `enabled: true` in the admin document

**"Business isolation denied"**
- Admin's `businessId` must match the requested business ID
- Check Firestore admin document for correct `businessId`

## Next Steps

1. Frontend now sends Firebase ID tokens to backend
2. Backend verifies tokens against Firebase Auth
3. Backend validates admin permissions from Firestore
4. Admin routes protected with business isolation

All admin auth is now production-grade and uses real Firebase authentication.
