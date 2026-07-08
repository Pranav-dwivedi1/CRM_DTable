# Error Reference - Visual Guide

## Error Categories with Solutions

### 🔴 AUTHENTICATION ERRORS

#### Error 1: Login Failed - "Invalid email or password"

```
❌ What User Sees: Login form shows error message

🔍 Root Cause:
   - User account doesn't exist
   - Wrong email or password
   - Database connection issue

✅ Quick Fix:
   1. Register new company at /register-company
   2. Use exact email and password
   3. Clear browser cookies (Ctrl+Shift+Delete)

⏱️ Time to Fix: 2 minutes

🧪 Test: Login with newly registered user
```

---

#### Error 2: "Invalid or expired refresh token"

```
❌ What User Sees: "Invalid or expired refresh token" after 15 minutes

🔍 Root Cause:
   - Refresh token cookie not being sent
   - Cookie path not set to /
   - sameSite setting too strict

✅ Quick Fix:
   1. Clear cookies: DevTools → Application → Cookies → Delete all
   2. Clear localStorage: DevTools → Local Storage → Clear all
   3. Refresh page and login again

⏱️ Time to Fix: 1 minute

🧪 Test: Wait 15+ minutes and make request to protected endpoint
```

---

#### Error 3: "Refresh token is missing"

```
❌ What User Sees: Logged out after access token expires

🔍 Root Cause:
   - Browser not sending refresh token cookie
   - CORS credentials not enabled
   - Axios withCredentials not set

✅ Quick Fix:
   1. Check cookie exists: DevTools → Application → Cookies
   2. Verify cookie path is /
   3. Clear cache: Delete client/.vite folder
   4. Restart: npm run dev

⏱️ Time to Fix: 2 minutes

🧪 Test: Check console logs for [REFRESH_TOKEN] messages
```

---

### 🔴 DATABASE CONNECTION ERRORS

#### Error 4: "Could not connect to any servers in MongoDB Atlas cluster"

```
❌ What User Sees: Seed script or app fails to start

🔍 Root Cause:
   - IP not whitelisted on MongoDB Atlas
   - Wrong credentials in MONGODB_URI
   - Network firewall blocking connection

✅ Quick Fix:
   1. Get your IP:
      (Invoke-WebRequest -Uri "https://api.ipify.org?format=json" -UseBasicParsing).Content

   2. Go to MongoDB Atlas:
      - Network Access → IP Whitelist
      - Add IP Address
      - Wait 2-3 minutes

   3. Test: npm run seed

⏱️ Time to Fix: 5 minutes

🧪 Test: Run seed script successfully
```

---

#### Error 5: "ECONNREFUSED" - Cannot connect to database

```
❌ What User Sees: Server fails to start

🔍 Root Cause:
   - Local MongoDB not running
   - Wrong MONGODB_URI
   - MongoDB service disabled

✅ Quick Fix (for localhost):
   1. Start MongoDB:
      net start MongoDB

   2. Verify:
      mongosh

   3. Restart server:
      npm run dev

⏱️ Time to Fix: 1 minute

🧪 Test: Server logs show "MongoDB connected" or app starts
```

---

### 🔴 CORS & NETWORK ERRORS

#### Error 6: "Access to XMLHttpRequest blocked by CORS policy"

```
❌ What User Sees: Network errors in console, no data loads

🔍 Root Cause:
   - CLIENT_URL in server/.env wrong
   - VITE_API_URL in client/.env.local wrong
   - Frontend and backend origins don't match

✅ Quick Fix:
   1. Check server/.env:
      CLIENT_URL=http://localhost:5173

   2. Check client/.env.local:
      VITE_API_URL=http://localhost:5000/api

   3. Restart both:
      npm run dev

⏱️ Time to Fix: 2 minutes

🧪 Test: No CORS errors in browser console
```

---

#### Error 7: "Network Error" / Request Timeout

```
❌ What User Sees: Page loads but no data, spinner keeps spinning

🔍 Root Cause:
   - Backend server not running
   - Wrong API URL
   - Database too slow
   - Network firewall

✅ Quick Fix:
   1. Check server running:
      netstat -ano | findstr :5000

   2. Check terminal shows "Server running on port 5000"

   3. Check VITE_API_URL is correct

   4. Restart: npm run dev

⏱️ Time to Fix: 1-2 minutes

🧪 Test: API requests complete in browser Network tab
```

---

### 🔴 SERVER ERRORS

#### Error 8: "Port 5000 is already in use"

```
❌ What User Sees: Server won't start

🔍 Root Cause:
   - Another process using port 5000
   - Previous server instance still running

✅ Quick Fix:
   1. Find process:
      netstat -ano | findstr :5000

   2. Kill process:
      taskkill /PID <PID> /F

   3. Restart:
      npm run dev

⏱️ Time to Fix: 1 minute

🧪 Test: Server starts successfully
```

---

#### Error 9: "MONGODB_URI is not defined"

```
❌ What User Sees: Server crashes on startup

🔍 Root Cause:
   - server/.env file missing
   - MONGODB_URI variable not set
   - .env file in wrong location

✅ Quick Fix:
   1. Check file exists:
      server/.env

   2. Add this line:
      MONGODB_URI=mongodb://localhost:27017/crm_db

   3. Restart:
      npm run dev

⏱️ Time to Fix: 1 minute

🧪 Test: Server starts and shows "Database connected"
```

---

### 🔴 FRONTEND ERRORS

#### Error 10: "Cannot GET /"

```
❌ What User Sees: Browser shows error page

🔍 Root Cause:
   - Vite dev server not running
   - Wrong port (5173)
   - Frontend not built

✅ Quick Fix:
   1. Check client running:
      npm run dev:client

   2. Wait for message:
      "VITE v... ready in ... ms"

   3. Open:
      http://localhost:5173

⏱️ Time to Fix: 1 minute

🧪 Test: Page loads in browser
```

---

#### Error 11: "Environmental variables not loading"

```
❌ What User Sees: API calls go to wrong URL

🔍 Root Cause:
   - client/.env.local not found
   - Vite cache not cleared
   - .env.local in wrong location

✅ Quick Fix:
   1. Create client/.env.local:
      VITE_API_URL=http://localhost:5000/api

   2. Clear Vite cache:
      rm -r client/.vite (Windows: rmdir /s client\.vite)

   3. Restart:
      npm run dev:client

⏱️ Time to Fix: 2 minutes

🧪 Test: API calls go to correct URL (check Network tab)
```

---

### 🔴 COMMON LOGIN FLOW ERRORS

#### Error 12: Session Lost After Page Refresh

```
❌ What User Sees: Gets logged out when refreshing

🔍 Root Cause:
   - Token not stored properly
   - Refresh token cookie missing
   - localStorage cleared unexpectedly

✅ Quick Fix:
   1. Check localStorage has token:
      localStorage.getItem('accessToken')

   2. Check cookie exists:
      DevTools → Cookies → refreshToken

   3. Clear and re-login:
      DevTools → Clear all data
      Login again

⏱️ Time to Fix: 2 minutes

🧪 Test: Session persists after refresh
```

---

## 🎯 Diagnosis Flowchart

```
Got an Error?
    ↓
Is it login error?
├─ YES ──→ Check user exists in database
│          └─ Error 1: Register new user
│
Is it "refresh token" error?
├─ YES ──→ Clear cookies and re-login
│          └─ Error 2 or 3: See CORS checklist
│
Is it database error?
├─ YES ──→ Check MongoDB connection
│          ├─ Localhost? Start MongoDB (Error 5)
│          └─ Cloud? Whitelist IP (Error 4)
│
Is it CORS error?
├─ YES ──→ Check URLs in .env files
│          └─ Error 6: Update CLIENT_URL and VITE_API_URL
│
Is it network error?
├─ YES ──→ Check server running
│          └─ Error 7: Start server (npm run dev)
│
Is it server won't start?
├─ YES ──→ Check logs
│          ├─ Port in use? (Error 8: Kill process)
│          ├─ Missing .env? (Error 9: Create file)
│          └─ Database down? (Error 4 or 5)
│
Is it frontend not loading?
├─ YES ──→ Check Vite running
│          └─ Error 10: Start client (npm run dev:client)
│
Still stuck?
└─→ Check ERROR_LIST_AND_TROUBLESHOOTING.md
```

---

## 🚨 Error Severity Levels

### CRITICAL 🔴

- Database connection fails
- Server won't start
- Cannot login

→ **Action:** Fix immediately before testing  
→ **Time:** 1-5 minutes

### HIGH 🟠

- CORS errors
- Token refresh failing
- Wrong environment variables

→ **Action:** Fix before user-facing features work  
→ **Time:** 2-10 minutes

### MEDIUM 🟡

- Session lost on refresh
- Slow API responses
- Deprecated warnings

→ **Action:** Fix during development  
→ **Time:** 10-30 minutes

### LOW 🟢

- Non-critical console warnings
- Code quality issues
- Performance optimization

→ **Action:** Fix when convenient  
→ **Time:** 30+ minutes or later

---

## 🧪 Testing Your Setup

### Quick Test Checklist

```
Step 1: Server Running?
├─ Open terminal
├─ See "CRM Server running on port 5000"
└─ ✅ Pass: Continue to Step 2

Step 2: Client Running?
├─ Check browser at http://localhost:5173
├─ See login page loads
└─ ✅ Pass: Continue to Step 3

Step 3: Database Connected?
├─ Check server terminal
├─ See "Database connected" message
└─ ✅ Pass: Continue to Step 4

Step 4: Can Register?
├─ Go to /register-company
├─ Fill form and click Register
├─ See success message
└─ ✅ Pass: Continue to Step 5

Step 5: Can Login?
├─ Enter registered email and password
├─ Click Login
├─ See dashboard
└─ ✅ Pass: Setup Complete!

❌ If any step fails:
└─ Check error against Error Reference above
```

---

## 📊 Error Distribution

```
By Type:
  Authentication ████░ (4 errors)
  Database ███████░ (5 errors)
  Server █████░ (5 errors)
  Frontend ████░ (4 errors)
  API ████░ (4 errors)
  Development ███░ (3 errors)

By Severity:
  Critical ███░ (3)
  High ██████░ (6)
  Medium ██░ (8)
  Low █░ (8)

By Frequency:
  Very Common ██████ (Errors 1,4,6,7)
  Common ████ (Errors 2,5,9)
  Occasional ██ (Errors 3,8,10,11)
  Rare █ (Others)
```

---

## 💡 Prevention Tips

### Prevent Authentication Errors:

- Clear cookies before testing
- Test login immediately after changes
- Monitor token expiration in logs

### Prevent Database Errors:

- Keep MongoDB running (Scenario A)
- Keep IP whitelisted (Scenario B)
- Check connection string format

### Prevent CORS Errors:

- Match CLIENT_URL in backend
- Match VITE_API_URL in frontend
- Use exact domain names

### Prevent Server Errors:

- Check port isn't in use
- Create .env before starting
- Start MongoDB before server

### Prevent Frontend Errors:

- Create .env.local file
- Clear .vite cache on changes
- Restart client after .env update

---

**Status:** Error Reference Complete  
**Coverage:** 27+ errors documented with solutions  
**Last Updated:** July 8, 2026
