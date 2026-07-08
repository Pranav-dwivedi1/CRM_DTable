# Environment Configuration System

## How It Works

The application automatically detects your environment and switches between:

- **Localhost:** Local MongoDB + Local Backend
- **Production:** Cloud MongoDB (Atlas) + Cloud Backend

---

## Setup Instructions

### Step 1: Create Environment Files

#### For Server (`server/.env`)

**Development (Localhost):**

```env
# server/.env (for development with localhost)
PORT=5000
NODE_ENV=development

# Use Local MongoDB
MONGODB_URI=mongodb://localhost:27017/crm_db

# JWT Configuration
JWT_ACCESS_SECRET=super_secret_access_token_key_1234567890
JWT_REFRESH_SECRET=super_secret_refresh_token_key_1234567890
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend URL (Localhost)
CLIENT_URL=http://localhost:5173
```

**Production (Cloud/Domain):**

```env
# server/.env (for production with cloud)
PORT=5000
NODE_ENV=production

# Use MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db?retryWrites=true&w=majority

# JWT Configuration (use stronger secrets in production!)
JWT_ACCESS_SECRET=your_very_long_and_secure_access_token_secret_key
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_token_secret_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend URL (Production Domain)
CLIENT_URL=https://your-domain.com
```

#### For Client (`client/.env.local`)

**Development (Localhost):**

```env
# client/.env.local (for development with localhost)
VITE_API_URL=http://localhost:5000/api
```

**Production (Cloud/Domain):**

```env
# client/.env.local (for production with cloud)
VITE_API_URL=https://api.your-domain.com/api
```

---

## Automatic Configuration

### How to Switch Environments

#### Option 1: Using npm scripts (Recommended)

**For Localhost Development:**

```bash
# This automatically uses local MongoDB and localhost URLs
npm run dev
```

**For Production Testing:**

```bash
# This automatically uses cloud MongoDB and production URLs
NODE_ENV=production npm start
```

#### Option 2: Manual Environment Switching

**To use Localhost:**

1. In `server/.env`, set: `MONGODB_URI=mongodb://localhost:27017/crm_db`
2. In `client/.env.local`, set: `VITE_API_URL=http://localhost:5000/api`
3. Ensure MongoDB is running: `net start MongoDB` (Windows)

**To use Cloud:**

1. In `server/.env`, set: `MONGODB_URI=mongodb+srv://...`
2. In `client/.env.local`, set: `VITE_API_URL=https://api.your-domain.com/api`
3. Ensure MongoDB Atlas IP whitelist includes your IP

---

## Environment Detection

The application automatically detects environment based on:

| Condition         | Environment | Database      | Backend          |
| ----------------- | ----------- | ------------- | ---------------- |
| `localhost:5173`  | Development | Local MongoDB | `localhost:5000` |
| `localhost:3000`  | Development | Local MongoDB | `localhost:5000` |
| `127.0.0.1`       | Development | Local MongoDB | `localhost:5000` |
| Domain name       | Production  | MongoDB Atlas | Cloud API        |
| `your-domain.com` | Production  | MongoDB Atlas | Cloud API        |

---

## Configuration Files Location

```
j:\DTable\CRM\
├── server/
│   └── .env                    ← Backend configuration
├── client/
│   └── .env.local              ← Frontend configuration
└── .env.example                ← Template (don't edit)
```

---

## Setting Up MongoDB

### For Localhost (Development)

**1. Install MongoDB Community Edition:**

- [Download MongoDB Community Edition](https://www.mongodb.com/try/download/community)
- Run installer and complete setup

**2. Start MongoDB Service:**

```bash
# Windows PowerShell (as Administrator)
net start MongoDB

# Or manually start
mongod

# Verify it's running
mongosh
> show dbs
```

**3. Verify Connection:**

```bash
# Test with mongodb+srv connection string
mongosh "mongodb://localhost:27017/crm_db"
```

### For Cloud (Production)

**1. Create MongoDB Atlas Account:**

- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up and create organization

**2. Create a Cluster:**

- Click "Create Cluster"
- Choose free tier (M0)
- Select region
- Create cluster (takes 1-3 minutes)

**3. Create Database User:**

- Go to **Database Access**
- Click **Add New Database User**
- Username: `your_username`
- Password: `your_password`
- Click **Add User**

**4. Get Connection String:**

- Go to **Clusters** → Click **Connect**
- Choose "Drivers"
- Copy connection string
- Replace `<password>` and `<username>`
- Update `.env` file: `MONGODB_URI=...`

**5. Whitelist Your IP:**

- Go to **Network Access**
- Click **Add IP Address**
- Enter your IP or `0.0.0.0/0`
- Click **Confirm**
- Wait 2-3 minutes

**6. Test Connection:**

```bash
# Test connection string
mongosh "mongodb+srv://username:password@cluster.mongodb.net/crm_db"
```

---

## Database Selection Logic

```javascript
// In app initialization:

if (process.env.NODE_ENV === "development") {
  // Use local or Atlas based on MONGODB_URI
  if (process.env.MONGODB_URI.includes("localhost")) {
    console.log("Using Local MongoDB");
  } else {
    console.log("Using MongoDB Atlas (Cloud)");
  }
}

if (process.env.NODE_ENV === "production") {
  // Always use Atlas
  console.log("Using MongoDB Atlas (Production)");
}
```

---

## Common Setup Scenarios

### Scenario 1: Localhost Development

**Setup:**

```
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Database: mongodb://localhost:27017/crm_db
```

**Files:**

```env
# server/.env
MONGODB_URI=mongodb://localhost:27017/crm_db
CLIENT_URL=http://localhost:5173

# client/.env.local
VITE_API_URL=http://localhost:5000/api
```

**Steps:**

1. Start MongoDB: `net start MongoDB`
2. Start app: `npm run dev`
3. Open: `http://localhost:5173`

### Scenario 2: Cloud Development (Testing)

**Setup:**

```
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Database: MongoDB Atlas (Cloud)
```

**Files:**

```env
# server/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crm_db
CLIENT_URL=http://localhost:5173

# client/.env.local
VITE_API_URL=http://localhost:5000/api
```

**Steps:**

1. Whitelist your IP on MongoDB Atlas
2. Start app: `npm run dev`
3. Open: `http://localhost:5173`

### Scenario 3: Production Deployment

**Setup:**

```
Frontend: https://your-domain.com
Backend:  https://api.your-domain.com
Database: MongoDB Atlas (Cloud)
```

**Files:**

```env
# server/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crm_db
NODE_ENV=production
CLIENT_URL=https://your-domain.com

# client/.env.local
VITE_API_URL=https://api.your-domain.com/api
```

**Steps:**

1. Deploy to hosting (Heroku, Vercel, AWS, etc.)
2. Set environment variables on hosting platform
3. Access: `https://your-domain.com`

---

## CORS Configuration

### For Localhost

```javascript
// Automatically configured in server/src/app.js
cors({
  origin: "http://localhost:5173",
  credentials: true,
});
```

### For Production

```javascript
// Update in server/src/app.js
cors({
  origin: process.env.CLIENT_URL, // From .env
  credentials: true,
});
```

---

## Switching Between Environments

### Quick Switch Checklist

```
To switch from Localhost → Cloud:
□ Update server/.env MONGODB_URI
□ Update client/.env.local VITE_API_URL
□ Whitelist IP on MongoDB Atlas
□ Restart both frontend and backend
□ Test login and basic features

To switch from Cloud → Localhost:
□ Start local MongoDB: net start MongoDB
□ Update server/.env MONGODB_URI
□ Update client/.env.local VITE_API_URL
□ Restart both frontend and backend
□ Test login and basic features
```

---

## Troubleshooting Environment Issues

### "Cannot connect to database"

**If using Localhost:**

```bash
# Check MongoDB is running
mongosh

# If not, start it
net start MongoDB
```

**If using Cloud:**

```bash
# Check IP is whitelisted
# Go to MongoDB Atlas → Network Access

# Check connection string format
# Should be: mongodb+srv://username:password@cluster.mongodb.net/db_name

# Test connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/crm_db"
```

### "Frontend can't reach backend"

```bash
# Check VITE_API_URL is correct
# Check backend is running
# Check CORS is configured
# Check CLIENT_URL in server/.env matches frontend URL
```

### "Environment variables not loading"

```bash
# Clear .vite cache
rm -r client/.vite

# Restart client
npm run dev:client

# On Windows:
rmdir /s client\.vite
```

---

## Environment Variables Reference

### Server Environment Variables

| Variable             | Development      | Production    | Description          |
| -------------------- | ---------------- | ------------- | -------------------- |
| `PORT`               | 5000             | 5000 or 8000  | Server port          |
| `NODE_ENV`           | development      | production    | Environment          |
| `MONGODB_URI`        | local            | MongoDB Atlas | Database connection  |
| `JWT_ACCESS_SECRET`  | any              | strong secret | Access token secret  |
| `JWT_REFRESH_SECRET` | any              | strong secret | Refresh token secret |
| `CLIENT_URL`         | `localhost:5173` | your domain   | Frontend origin      |

### Client Environment Variables

| Variable       | Development          | Production | Description     |
| -------------- | -------------------- | ---------- | --------------- |
| `VITE_API_URL` | `localhost:5000/api` | domain API | Backend API URL |

---

## Best Practices

### ✅ Do:

- Keep different `.env` files for dev and production
- Use strong secrets in production
- Whitelist specific IPs instead of `0.0.0.0/0` in production
- Test configuration changes on localhost first
- Use environment variables for all sensitive data

### ❌ Don't:

- Commit `.env` files to Git (use `.env.example`)
- Use same password for dev and production
- Leave `0.0.0.0/0` IP whitelist in production
- Hardcode URLs in code
- Mix localhost and cloud in same `.env`

---

## Deployment Checklist

Before deploying to production:

- [ ] Update `MONGODB_URI` to MongoDB Atlas connection string
- [ ] Update `CLIENT_URL` to your production domain
- [ ] Set `NODE_ENV=production` in server/.env
- [ ] Use strong JWT secrets
- [ ] Update `VITE_API_URL` to production API URL
- [ ] Test all features on production database
- [ ] Enable HTTPS on frontend and backend
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Monitor error logs
- [ ] Set up backups for MongoDB

---

**Status:** Configuration System Ready  
**Last Updated:** July 8, 2026
