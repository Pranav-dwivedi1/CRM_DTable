# Error List & Troubleshooting Guide

## Known Issues & Solutions

### 🔴 Authentication Errors

#### 1. Login Failed - "Invalid email or password"

**Cause:** User account doesn't exist or credentials are wrong  
**Solution:**

- Register new company and admin at `/register-company`
- Check email and password spelling
- Clear browser cookies (DevTools → Application → Cookies)
- Clear localStorage (DevTools → Application → Local Storage)

#### 2. "Invalid or expired refresh token"

**Cause:** Refresh token cookie not being sent to server  
**Status:** ✅ FIXED in authentication flow update
**Solution:**

- Clear cookies and login again
- Check browser DevTools → Application → Cookies for `refreshToken`
- Verify cookie has `Path=/` and `SameSite=Lax`

#### 3. "Refresh token is missing"

**Cause:** Browser not sending refresh token cookie  
**Solution:**

- Check CORS configuration has `credentials: true`
- Check axios has `withCredentials: true`
- Verify cookie `sameSite` is not `strict` in development

---

### 🔴 Database Connection Errors

#### 4. "Could not connect to any servers in your MongoDB Atlas cluster"

**Cause:** IP address not whitelisted on MongoDB Atlas  
**Solution:**

- Get your IP: Open PowerShell and run: `(Invoke-WebRequest -Uri "https://api.ipify.org?format=json" -UseBasicParsing).Content | ConvertFrom-Json`
- Go to MongoDB Atlas → Network Access → IP Whitelist
- Add your IP address
- Wait 2-3 minutes for changes to propagate
- Try again

#### 5. MongoDB Connection Timeout

**Cause:** Network firewall blocking connection  
**Solution:**

- Check internet connection
- Check if VPN is blocking Atlas access
- Try connecting from different network
- Verify credentials in .env file

#### 6. "ECONNREFUSED" - Local MongoDB not running

**Cause:** MongoDB service not started (when using local DB)  
**Solution:**

- Windows: `net start MongoDB`
- Or manually start MongoDB: `mongod`
- Check MongoDB is listening on port 27017

---

### 🔴 Server Errors

#### 7. "Port 5000 is already in use"

**Cause:** Another process is using port 5000  
**Solution:**

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual PID)
taskkill /PID <PID> /F

# Or use different port
set PORT=5001
npm run dev
```

#### 8. "MONGODB_URI is not defined"

**Cause:** .env file missing MONGODB_URI variable  
**Solution:**

- Check `server/.env` file exists
- Verify it has `MONGODB_URI=...`
- Restart server: `npm run dev`

#### 9. CORS Error - "Access to XMLHttpRequest has been blocked"

**Cause:** Frontend and backend have different origins  
**Solution:**

- Check `CLIENT_URL` in `.env` matches frontend URL
- Verify CORS configuration in `server/src/app.js`
- Ensure `credentials: true` is set

---

### 🔴 Frontend Errors

#### 10. "Cannot GET /"

**Cause:** Vite dev server not running  
**Solution:**

- Check client is running: `npm run dev:client`
- Verify port 5173 is correct
- Clear browser cache (Ctrl+Shift+Delete)

#### 11. "Environmental variables not loading"

**Cause:** `.env.local` not found or Vite cache issue  
**Solution:**

- Create `client/.env.local` with `VITE_API_URL=http://localhost:5000/api`
- Restart Vite: Stop and run `npm run dev:client` again
- Clear Vite cache: Delete `client/.vite` folder

#### 12. Login page redirect loop

**Cause:** Authentication context not properly initialized  
**Solution:**

- Clear localStorage and cookies
- Check browser console for errors (F12)
- Verify JWT tokens are being stored correctly

---

### 🔴 API Errors

#### 13. "Invalid token" or "401 Unauthorized"

**Cause:** Access token expired or invalid  
**Solution:**

- Login again to get fresh token
- Check token in localStorage: `localStorage.getItem('accessToken')`
- Verify token hasn't been tampered with

#### 14. "User not found"

**Cause:** User deleted or ID mismatch  
**Solution:**

- Logout and login again
- Check MongoDB: `db.users.findOne({ email: 'your@email.com' })`
- Re-register if needed

#### 15. "Not authorized, role not sufficient"

**Cause:** User doesn't have permission for this action  
**Solution:**

- Login with admin or manager account
- Check user role in `/api/users` endpoint
- Contact admin to elevate permissions

---

### 🔴 Database Issues

#### 16. "Duplicate key error" on registration

**Cause:** Email already exists in database  
**Solution:**

- Use different email for new company
- Or clear database: `db.users.deleteMany({})`
- Or login with existing user

#### 17. Multi-tenant data leaking

**Cause:** Tenant plugin not properly applied  
**Solution:**

- Verify `companyId` is set on all records
- Check tenant middleware is applied to routes
- Verify `bypassTenant: true` only used for auth queries

#### 18. Cannot delete company/user

**Cause:** Foreign key constraints or pending data  
**Solution:**

- Delete related leads first
- Delete related activity logs
- Then delete user/company
- Or implement cascade delete

---

### 🔴 Development/Build Errors

#### 19. "npm ERR! code ENOENT"

**Cause:** package.json or dependencies missing  
**Solution:**

```bash
# Install all dependencies
npm install
npm install --prefix server
npm install --prefix client

# Or reinstall everything
rm -r node_modules
npm install
```

#### 20. "Module not found" errors

**Cause:** Missing dependencies or wrong import path  
**Solution:**

- Check import path is correct (case-sensitive)
- Install missing package: `npm install package-name`
- Check package.json has dependency listed

---

### 🟡 Performance Issues

#### 21. Slow database queries

**Cause:** Missing MongoDB indexes  
**Solution:**

- Add indexes to frequently queried fields
- Example: `db.users.createIndex({ companyId: 1 })`
- Profile queries with MongoDB Atlas Performance Advisor

#### 22. High memory usage

**Cause:** Memory leak or too many connections  
**Solution:**

- Restart server: `npm run dev`
- Check for circular dependencies
- Monitor connections: `db.currentOp()`

---

### 🟡 Browser Issues

#### 23. Session lost after page refresh

**Cause:** Token not stored properly or cookie expired  
**Solution:**

- Check `localStorage.getItem('accessToken')` has value
- Check cookie `refreshToken` exists in DevTools
- Verify token not manually deleted

#### 24. CORS preflight request failing

**Cause:** OPTIONS request not allowed  
**Solution:**

- Add OPTIONS handler in Express
- Verify CORS middleware runs before routes
- Check `Access-Control-Allow-*` headers

---

### 🟡 Feature-Specific Issues

#### 25. Leads not showing

**Cause:** No leads created or visibility filtered  
**Solution:**

- Create test lead in UI
- Check leads exist in MongoDB: `db.leads.find()`
- Verify current user has permission to view
- Check company filter is correct

#### 26. Real-time updates not working

**Cause:** Socket.io not connected  
**Solution:**

- Check Socket.io is initialized in `socket.js`
- Verify client connects with `connectSocket()`
- Check WebSocket is not blocked by firewall

#### 27. File upload failing

**Cause:** No upload endpoint or permissions issue  
**Solution:**

- Create upload endpoint if missing
- Check file size limits
- Verify write permissions to upload directory

---

## Environment Configuration Summary

### Localhost (Development)

```
Frontend: http://localhost:5173
Backend: http://localhost:5000/api
Database: Local MongoDB or MongoDB Atlas
```

### Production (Cloud/Domain)

```
Frontend: https://your-domain.com
Backend: https://api.your-domain.com/api
Database: MongoDB Atlas (Cloud)
```

---

## Quick Diagnosis

**If you're getting errors:**

1. **First:** Check browser console (F12) for JavaScript errors
2. **Second:** Check server terminal for backend errors
3. **Third:** Check MongoDB connection
4. **Fourth:** Check environment variables in `.env`
5. **Fifth:** Clear cookies and localStorage, try again

---

## Common Error Patterns

### Pattern: "Cannot read property of undefined"

Usually means:

- Variable not initialized
- User not loaded from database
- Missing environment variable
- Component re-renders before data loads

### Pattern: "Network error" or request failing

Usually means:

- Backend not running
- CORS not configured
- Wrong API URL
- Wrong HTTP method

### Pattern: "Authentication required"

Usually means:

- Token expired
- Token not sent in headers
- Wrong authorization header format
- Token tampered with

---

## Debugging Tips

### 1. Enable Debug Logging

Check console output for `[PREFIX]` debug messages:

- `[LOGIN]` - Login flow
- `[REFRESH_TOKEN]` - Token refresh
- `[PROTECT]` - Authorization
- `[API_REQUEST]` - Axios requests
- `[API_RESPONSE]` - Axios responses

### 2. Check Storage

```javascript
// In browser console:
console.log("Access Token:", localStorage.getItem("accessToken"));
console.log("Cookies:", document.cookie);
```

### 3. Check Network Requests

- DevTools → Network tab
- Look for failing requests
- Check response status and body
- Verify headers are correct

### 4. Check Database

```javascript
// In MongoDB:
db.users.findOne({ email: "user@example.com" });
db.refreshtokens.find();
db.leads.find();
```

---

## Error Resolution Flowchart

```
Error Encountered
    ↓
Is it login error?
├─ YES → Check user exists in database
│        ├─ No → Register new user
│        └─ Yes → Check password correct
│
Is it database connection error?
├─ YES → Check MongoDB is running
│        ├─ Local → Start MongoDB service
│        └─ Cloud → Check IP whitelist
│
Is it CORS error?
├─ YES → Check CLIENT_URL in .env
│        └─ Restart server
│
Is it "token expired" error?
├─ YES → Login again
│        └─ Or check refresh token logic
│
Is it "module not found" error?
├─ YES → npm install
│        └─ Check import paths
│
→ Check browser console for details
→ Check server terminal for backend errors
→ Try clearing cache and restarting
→ Check GitHub issues or docs
```

---

**Last Updated:** July 8, 2026  
**Status:** Active Development  
**Known Issues:** 25+ documented with solutions
