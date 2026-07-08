# Complete Setup & Troubleshooting Checklist

## 🎯 Phase 1: Environment Setup

### Prerequisites Check

- [ ] Node.js installed (v16+): `node --version`
- [ ] npm installed: `npm --version`
- [ ] Git installed: `git --version`
- [ ] Code editor ready (VS Code)
- [ ] Terminal access (PowerShell/Command Prompt)

### For Localhost Development

- [ ] MongoDB installed locally
- [ ] MongoDB service running: `net start MongoDB`
- [ ] Can connect to MongoDB: `mongosh`

### For Cloud Development

- [ ] MongoDB Atlas account created
- [ ] Cluster created (free tier OK)
- [ ] Database user created
- [ ] Connection string obtained
- [ ] IP whitelisted on MongoDB Atlas
  - [ ] Your IP: `(Invoke-WebRequest -Uri "https://api.ipify.org?format=json" -UseBasicParsing).Content`
  - [ ] Added to Network Access: MongoDB Atlas → Network Access → Add IP

---

## 🎯 Phase 2: Code Setup

### Clone & Dependencies

- [ ] Project cloned to: `j:\DTable\CRM`
- [ ] Navigate to project: `cd j:\DTable\CRM`
- [ ] Install root dependencies: `npm install`
- [ ] Install server dependencies: `cd server && npm install && cd ..`
- [ ] Install client dependencies: `cd client && npm install && cd ..`

### Environment Files - Server

- [ ] Create `server/.env` file
- [ ] Add MONGODB_URI:
  - Localhost: `mongodb://localhost:27017/crm_db`
  - Cloud: `mongodb+srv://username:password@cluster.mongodb.net/crm_db`
- [ ] Add CLIENT_URL:
  - Localhost: `http://localhost:5173`
  - Production: `https://your-domain.com`
- [ ] Add JWT_ACCESS_SECRET: (minimum 32 random characters)
- [ ] Add NODE_ENV: `development` (or `production`)

### Environment Files - Client

- [ ] Create `client/.env.local` file
- [ ] Add VITE_API_URL:
  - Localhost: `http://localhost:5000/api`
  - Production: `https://api.your-domain.com/api`
- [ ] Add VITE_APP_NAME: `CRM`

### Verify File Structure

- [ ] `server/.env` exists and readable
- [ ] `client/.env.local` exists and readable
- [ ] `.gitignore` includes `.env` files (don't commit secrets!)
- [ ] `package.json` scripts present

---

## 🎯 Phase 3: Database Setup

### For Localhost MongoDB

#### Install (if needed)

- [ ] Download MongoDB Community: https://www.mongodb.com/try/download/community
- [ ] Run installer
- [ ] Choose "Install as a Service"
- [ ] Accept default path: `C:\Program Files\MongoDB\Server\...`
- [ ] Complete installation

#### Verify Installation

- [ ] MongoDB service exists: `Get-Service MongoDB` (should show "Running")
- [ ] Can connect: `mongosh` (should show connection success)
- [ ] Exit mongosh: `exit`

#### Create Database (optional, auto-created on first insert)

- [ ] Database name: `crm_db`
- [ ] Will auto-create when server runs

### For MongoDB Atlas (Cloud)

#### Cluster Setup

- [ ] Go to: https://cloud.mongodb.com
- [ ] Log in or create account
- [ ] Create cluster (free tier: M0)
- [ ] Wait for cluster to initialize (2-5 minutes)
- [ ] Go to Database
- [ ] Click "Connect"

#### Network Access

- [ ] Go to: Network Access (left sidebar)
- [ ] Click "Add IP Address"
- [ ] Paste your IP from: `(Invoke-WebRequest -Uri "https://api.ipify.org?format=json" -UseBasicParsing).Content`
- [ ] Click "Add IP Address"
- [ ] Wait for status to change to "Active" (2-3 minutes)

#### Database User

- [ ] Go to: Database Access (left sidebar)
- [ ] Click "Add Database User"
- [ ] Username: (e.g., `crm_admin`)
- [ ] Password: (minimum 8 characters, save it!)
- [ ] Database User Privileges: "Read and Write to any database"
- [ ] Click "Add User"

#### Connection String

- [ ] Go to: Clusters → Connect
- [ ] Choose "Drivers" (Node.js)
- [ ] Copy connection string
- [ ] Replace `<password>` with actual password
- [ ] Replace `myFirstDatabase` with `crm_db`
- [ ] Final format: `mongodb+srv://username:password@cluster.mongodb.net/crm_db`
- [ ] Paste into `server/.env` as MONGODB_URI

#### Test Connection

- [ ] Keep cloud terminal ready
- [ ] Start server: `npm run dev`
- [ ] Check server logs: Should show "Database connected" within 5 seconds
- [ ] If not, check:
  - [ ] IP is whitelisted (check Network Access page)
  - [ ] Connection string is correct
  - [ ] Password is correct (no special char encoding issues)

---

## 🎯 Phase 4: Application Startup

### Start Development Servers

- [ ] Open terminal in `j:\DTable\CRM`
- [ ] Run: `npm run dev`
- [ ] Wait for output (30-60 seconds)
- [ ] Verify server output:
  - [ ] `[APP_INIT]` shows CORS configuration
  - [ ] `CRM Server running in development mode on port 5000`
  - [ ] `Database connected` or `MongoDB connected`
  - [ ] `Socket.io initialized`
- [ ] Verify client output:
  - [ ] `VITE v... ready in ... ms`
  - [ ] `Local: http://localhost:5173/`

### First Access

- [ ] Open browser to: `http://localhost:5173`
- [ ] Should show login page
- [ ] Check browser console:
  - [ ] No CORS errors (red X's)
  - [ ] No 404 errors
  - [ ] Minimal warnings

---

## 🎯 Phase 5: Authentication Testing

### Register New Company & User

#### Via UI (Recommended for First Test)

- [ ] Go to: `http://localhost:5173/register-company`
- [ ] Fill Company Name: `TestCorp`
- [ ] Fill Company Email: `admin@testcorp.com`
- [ ] Fill Password: `password123`
- [ ] Click "Register Company"
- [ ] Should see success message: "Company registered successfully"
- [ ] Automatically redirected to login

#### Manual Steps (if UI doesn't work)

- [ ] Open MongoDB (local):
  ```
  mongosh
  use crm_db
  ```
- [ ] Insert company:
  ```
  db.companies.insertOne({
    name: "TestCorp",
    createdAt: new Date()
  })
  ```
- [ ] Copy the `_id` from output
- [ ] Insert user:
  ```
  db.users.insertOne({
    email: "admin@testcorp.com",
    password: "<bcrypt hashed password>",
    role: "masterAdmin",
    companyId: ObjectId("<company_id>"),
    createdAt: new Date()
  })
  ```

### Test Login

- [ ] Email: `admin@testcorp.com`
- [ ] Password: `password123`
- [ ] Click "Login"
- [ ] Check browser console for `[API_REQUEST]` and `[API_RESPONSE]` logs
- [ ] Should see:
  - [ ] Request to `/auth/login`
  - [ ] Response with `accessToken` and `refreshToken`
  - [ ] Redirect to dashboard
- [ ] Verify authenticated state:
  - [ ] Browser shows main app (not login page)
  - [ ] localStorage has `accessToken`
  - [ ] Cookies have `refreshToken`

---

## 🎯 Phase 6: Demo Users Setup (Optional)

### Seed Database with Demo Data

#### Prerequisites

- [ ] MongoDB connected and running
- [ ] `server/.env` configured with MONGODB_URI
- [ ] Database user has write permissions

#### Run Seed Script

- [ ] Open terminal in project root
- [ ] Run: `npm run seed`
- [ ] Wait for completion (10-30 seconds)
- [ ] Should see output:
  ```
  ✓ Companies seeded
  ✓ Users seeded
  ✓ Leads seeded
  ✓ Activity logs created
  ✓ Database seeded successfully
  ```

#### Verify Demo Users

- [ ] Users created:
  - [ ] AeroCorp: admin@aerocorp.com (password: `password123`)
  - [ ] AeroCorp: manager@aerocorp.com (password: `password123`)
  - [ ] AeroCorp: employee1@aerocorp.com (password: `password123`)
  - [ ] ByteTech: admin@bytetech.com (password: `password123`)

#### Test Demo User Login

- [ ] Log out current user (if logged in)
- [ ] Go to login page
- [ ] Try each demo user:
  - [ ] Email: `admin@aerocorp.com`
  - [ ] Password: `password123`
  - [ ] Click Login
  - [ ] Should see dashboard with AeroCorp data
- [ ] Repeat for other demo users

---

## 🎯 Phase 7: Core Features Testing

### Dashboard

- [ ] Dashboard loads: `http://localhost:5173/dashboard`
- [ ] Shows company info
- [ ] Shows lead statistics
- [ ] Shows recent activity

### Pipeline/Kanban

- [ ] Pipeline page loads: `http://localhost:5173/pipeline`
- [ ] Shows kanban board columns
- [ ] Shows leads as cards
- [ ] Can drag/drop cards

### Leads List

- [ ] Leads page loads: `http://localhost:5173/leads`
- [ ] Shows table of leads
- [ ] Can search leads
- [ ] Can filter by status

### Lead Detail

- [ ] Click on a lead in list
- [ ] Detail page shows all lead info
- [ ] Can edit lead
- [ ] Can add activity notes

### Users Management

- [ ] Users page loads: `http://localhost:5173/users`
- [ ] Shows list of company users
- [ ] Can add new user
- [ ] Can edit user roles

---

## 🎯 Phase 8: Troubleshooting

### If Server Won't Start

Check In This Order:

1. [ ] MongoDB running? `net start MongoDB` (or start service)
2. [ ] MONGODB_URI set? Check `server/.env`
3. [ ] Port 5000 free? `netstat -ano | findstr :5000`
   - [ ] If in use: `taskkill /PID <PID> /F`
4. [ ] Dependencies installed? `npm install` in server folder
5. [ ] Node version OK? `node --version` (should be v16+)
6. [ ] Clear cache: `rm -r server/node_modules && npm install`

**Reference:** ERROR_LIST_AND_TROUBLESHOOTING.md

### If Client Won't Load

Check In This Order:

1. [ ] Vite running? See "VITE ready" message
2. [ ] VITE_API_URL set? Check `client/.env.local`
3. [ ] Port 5173 free? `netstat -ano | findstr :5173`
4. [ ] Cache cleared? Delete `client/.vite` folder
5. [ ] Dependencies installed? `npm install` in client folder
6. [ ] Refresh browser: `Ctrl+Shift+R` (hard refresh)

**Reference:** ERROR_REFERENCE_VISUAL.md

### If Login Fails

Check In This Order:

1. [ ] User exists? Check MongoDB:
   ```
   mongosh
   use crm_db
   db.users.findOne({email: "admin@testcorp.com"})
   ```
2. [ ] Password correct? Try `password123` for seeded users
3. [ ] Check server logs: Look for `[LOGIN]` messages
4. [ ] Check browser console: Look for network errors
5. [ ] Clear cookies: DevTools → Cookies → Delete all
6. [ ] Try registering new user instead

**Reference:** ERROR_REFERENCE_VISUAL.md (Error 1)

### If Getting CORS Error

Check In This Order:

1. [ ] CLIENT_URL in `server/.env`: Should match frontend origin
   - Localhost: `http://localhost:5173`
   - Production: `https://your-domain.com`
2. [ ] VITE_API_URL in `client/.env.local`: Should match backend origin
   - Localhost: `http://localhost:5000/api`
   - Production: `https://api.your-domain.com/api`
3. [ ] Restart both servers: `npm run dev`
4. [ ] Clear browser cache: `Ctrl+Shift+Delete`

**Reference:** ERROR_REFERENCE_VISUAL.md (Error 6)

### If Token Refresh Error

Check In This Order:

1. [ ] Clear cookies: DevTools → Application → Cookies → Delete all
2. [ ] Clear localStorage: DevTools → Local Storage → Clear all
3. [ ] Login again
4. [ ] Wait 15+ minutes
5. [ ] Make request to protected endpoint (e.g., go to dashboard)
6. [ ] Check server logs for `[REFRESH_TOKEN]` messages

**Reference:** ERROR_REFERENCE_VISUAL.md (Error 2, 3)

---

## 🎯 Phase 9: Going to Production

### Before Deploying

- [ ] All tests pass locally
- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] Demo users work
- [ ] All features tested

### Environment Configuration

- [ ] Create production `server/.env`:
  - [ ] MONGODB_URI: Atlas connection string
  - [ ] CLIENT_URL: Your domain (https)
  - [ ] NODE_ENV: `production`
  - [ ] JWT_ACCESS_SECRET: Strong random 32+ char string
  - [ ] All other vars from development

- [ ] Create production `client/.env.local`:
  - [ ] VITE_API_URL: Your API domain (https)

### Build for Production

- [ ] Run: `npm run build`
- [ ] Wait for build to complete
- [ ] Check `client/dist` folder exists with files

### Deploy

- [ ] Choose hosting (Heroku, Vercel, AWS, etc.)
- [ ] Follow hosting provider's deployment guide
- [ ] Set environment variables on hosting platform
- [ ] Deploy both server and client
- [ ] Test on production domain

### Post-Deployment

- [ ] Test login on production domain
- [ ] Test all core features
- [ ] Monitor error logs
- [ ] Set up backup strategy for database

---

## ✅ Completion Checklist

### Development Environment Ready

- [ ] Phase 1: Prerequisites complete
- [ ] Phase 2: Code setup complete
- [ ] Phase 3: Database setup complete
- [ ] Phase 4: Servers running successfully
- [ ] Phase 5: Can login successfully
- [ ] Phase 6: Demo users seeded (optional)
- [ ] Phase 7: Core features working
- [ ] Phase 8: Know how to troubleshoot

### Ready for Development

- [ ] Can start app with `npm run dev`
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Backend running on port 5000
- [ ] Database connected
- [ ] Can register new users
- [ ] Can login with credentials
- [ ] Dashboard displays correctly

### Ready for Production

- [ ] All development features tested
- [ ] Production environment variables set
- [ ] HTTPS enabled
- [ ] MongoDB Atlas configured
- [ ] Build process tested
- [ ] Deployment method chosen
- [ ] Backup strategy planned

---

## 📞 Need Help?

| Issue             | Reference Document                |
| ----------------- | --------------------------------- |
| Any error message | ERROR_REFERENCE_VISUAL.md         |
| Setup question    | LOCALHOST_VS_PRODUCTION.md        |
| Configuration     | ENVIRONMENT_CONFIGURATION.md      |
| Complete list     | ERROR_LIST_AND_TROUBLESHOOTING.md |
| Auth issues       | AUTHENTICATION_AUDIT_REPORT.md    |

---

## 🚀 Next Steps

### For First-Time Setup

1. Complete Phase 1-5 above
2. If any step fails, check ERROR_REFERENCE_VISUAL.md
3. Test login with demo credentials or newly registered user
4. Proceed to Phase 6 (optional demo users)

### For Development

1. Use `npm run dev` to start both servers
2. Make code changes
3. Browser hot-reloads frontend automatically
4. Restart server manually for backend changes
5. Check console for debug logs

### For Production

1. Complete all phases including Phase 9
2. Use production environment variables
3. Deploy to hosting provider
4. Test thoroughly on live domain
5. Monitor logs and errors

---

**Status:** Complete Setup & Troubleshooting Checklist  
**Last Updated:** 2026-07-08  
**Duration:** 45-120 minutes for complete setup depending on choices
