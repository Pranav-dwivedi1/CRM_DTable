# Adding Demo Users to CRM Application

## Seed Script Added ✅

I've added a seed script to `package.json`. The following users are already configured in `server/src/scripts/seed.js`:

### Configured Users:

**AeroCorp Company:**

- Email: `admin@aerocorp.com` | Password: `password123` | Role: Master Admin
- Email: `manager@aerocorp.com` | Password: `password123` | Role: Manager
- Email: `employee1@aerocorp.com` | Password: `password123` | Role: Employee
- Email: `employee2@aerocorp.com` | Password: `password123` | Role: Employee (additional)

**ByteTech Solutions Company:**

- Email: `admin@bytetech.com` | Password: `password123` | Role: Master Admin

---

## How to Populate Database

### Option 1: Fix MongoDB Atlas Connection (Recommended)

**Error:** Your current IP is not whitelisted on MongoDB Atlas.

**Solution Steps:**

1. **Get your current IP address:**

   ```bash
   # Windows PowerShell
   (Invoke-WebRequest -Uri "https://api.ipify.org?format=json").Content | ConvertFrom-Json | Select-Object ip

   # Or use a website: https://www.whatismyipaddress.com/
   ```

2. **Add IP to MongoDB Atlas whitelist:**
   - Go to [MongoDB Atlas Console](https://cloud.mongodb.com/)
   - Login to your account
   - Navigate to: **Network Access** → **IP Whitelist**
   - Click **Add IP Address**
   - Add your IP or `0.0.0.0/0` (allows all IPs, less secure)
   - Click **Confirm**

3. **Wait 2-3 minutes** for changes to propagate

4. **Run the seed script:**
   ```bash
   cd server
   npm run seed
   ```

### Option 2: Manual Registration Through UI

If MongoDB connection issues persist:

1. **Start the application:**

   ```bash
   npm run dev
   ```

2. **Navigate to Registration Page:**
   - Open browser: `http://localhost:5173/register-company`

3. **Register First Company (AeroCorp):**
   - Company Name: `AeroCorp`
   - Admin Name: `Alice Admin`
   - Admin Email: `admin@aerocorp.com`
   - Admin Password: `password123`
   - Click Register

4. **Login as Admin:**
   - Email: `admin@aerocorp.com`
   - Password: `password123`

5. **Add Users (Go to Users page):**
   - Add Manager: `manager@aerocorp.com` (password123, Manager role)
   - Add Employee: `employee1@aerocorp.com` (password123, Employee role)

6. **Register Second Company (ByteTech):**
   - Logout
   - Go to: `http://localhost:5173/register-company`
   - Company Name: `ByteTech`
   - Admin Name: `Zack ByteAdmin`
   - Admin Email: `admin@bytetech.com`
   - Admin Password: `password123`
   - Click Register

---

## MongoDB Atlas Troubleshooting

### If Still Getting Connection Error:

1. **Check MongoDB Connection String:**

   ```bash
   # In server/.env
   MONGODB_URI=mongodb+srv://Pranavdev01:Pranav%40123@crm.3oowsdv.mongodb.net/crm_db?retryWrites=true&w=majority&appName=CRM
   ```

2. **Verify Credentials:**
   - Username: `Pranavdev01`
   - Password should be URL encoded (@ becomes %40)

3. **Test Connection:**

   ```bash
   # Install MongoDB client
   npm install -g mongodb-shell

   # Test connection string
   mongosh "mongodb+srv://Pranavdev01:Pranav@123@crm.3oowsdv.mongodb.net/crm_db"
   ```

4. **Common Issues:**
   - IP not whitelisted
   - Incorrect password
   - Network firewall blocking connection
   - MongoDB cluster is paused

---

## Verify Users After Seeding

Once seed script succeeds:

```bash
# Check created users in MongoDB
db.users.find().pretty()

# Check companies
db.companies.find().pretty()

# Login with any user to verify
# Email: admin@aerocorp.com
# Password: password123
```

---

## Seed Script Details

**Location:** `server/src/scripts/seed.js`

**What it does:**

1. Clears all existing data (companies, users, leads, activity logs)
2. Creates 2 companies (AeroCorp, ByteTech)
3. Creates 5 users across both companies
4. Creates sample leads and notes
5. Outputs success/error messages

**To run again:**

```bash
cd server
npm run seed
```

---

## Quick Start (Recommended Path)

1. **Add your IP to MongoDB Atlas whitelist** (2 minutes)
2. **Run seed script:** `npm run seed` (1 minute)
3. **Login with demo accounts** (instant)
4. **Demo is ready!** ✅

---

## Alternative: Use Local MongoDB

If MongoDB Atlas keeps failing:

1. **Install MongoDB Community Edition:**
   - [Download MongoDB](https://www.mongodb.com/try/download/community)

2. **Update .env file:**

   ```env
   MONGODB_URI=mongodb://localhost:27017/crm_db
   ```

3. **Start MongoDB:**

   ```bash
   # Windows
   net start MongoDB

   # Or run mongod manually
   mongod
   ```

4. **Run seed script:**
   ```bash
   npm run seed
   ```

---

## Expected Output When Successful

```
Connecting to database for seeding...
Database connected.
Clearing existing collections...
Collections cleared.
Seeding company "AeroCorp" and "ByteTech"...
Seeding users for AeroCorp...
Seeding users for ByteTech...
Seeding leads for AeroCorp...
Seeding activity logs...
Database seeding completed successfully!
```

---

**Status:** ✅ Seed script is ready. Just fix MongoDB connection and run `npm run seed`
