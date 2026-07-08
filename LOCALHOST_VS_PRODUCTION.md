# Quick Reference: Localhost vs Production

## 🚀 TL;DR (Too Long; Didn't Read)

### For Localhost Development:

```bash
# 1. Start MongoDB
net start MongoDB

# 2. Run app
npm run dev

# 3. Open browser
http://localhost:5173
```

### For Production (Cloud/Domain):

```bash
# 1. Setup MongoDB Atlas and get connection string
# 2. Update server/.env with MONGODB_URI and CLIENT_URL
# 3. Update client/.env.local with VITE_API_URL
# 4. Deploy to hosting platform
```

---

## Configuration Comparison

| Aspect           | Localhost                   | Production                        |
| ---------------- | --------------------------- | --------------------------------- |
| **Frontend URL** | `http://localhost:5173`     | `https://your-domain.com`         |
| **Backend URL**  | `http://localhost:5000`     | `https://api.your-domain.com`     |
| **Database**     | Local MongoDB (port 27017)  | MongoDB Atlas (Cloud)             |
| **API Path**     | `http://localhost:5000/api` | `https://api.your-domain.com/api` |
| **Env File**     | `server/.env`               | `server/.env` (different values)  |
| **NODE_ENV**     | `development`               | `production`                      |
| **SSL/HTTPS**    | ❌ No                       | ✅ Yes                            |
| **IP Whitelist** | N/A                         | Required on MongoDB Atlas         |

---

## 5-Minute Setup

### For Localhost:

**File: `server/.env`**

```env
MONGODB_URI=mongodb://localhost:27017/crm_db
CLIENT_URL=http://localhost:5173
```

**File: `client/.env.local`**

```env
VITE_API_URL=http://localhost:5000/api
```

**Then run:**

```bash
npm run dev
```

### For Cloud/Domain:

**File: `server/.env`**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db?retryWrites=true&w=majority
CLIENT_URL=https://your-domain.com
```

**File: `client/.env.local`**

```env
VITE_API_URL=https://api.your-domain.com/api
```

**Then deploy to hosting (Heroku, Vercel, etc.)**

---

## Files to Update

| File                | Localhost          | Production         |
| ------------------- | ------------------ | ------------------ |
| `server/.env`       | Local MongoDB URL  | MongoDB Atlas URL  |
| `client/.env.local` | `localhost:5000`   | Production domain  |
| `NODE_ENV`          | development        | production         |
| `.env.example`      | Same for reference | Same for reference |

---

## Common Issues & Quick Fixes

| Issue                        | Localhost Fix                      | Production Fix                |
| ---------------------------- | ---------------------------------- | ----------------------------- |
| Can't connect to database    | Start MongoDB: `net start MongoDB` | Whitelist IP in MongoDB Atlas |
| Frontend can't reach backend | Check `VITE_API_URL`               | Check CORS origin in `.env`   |
| Login fails                  | Clear cookies                      | Check database credentials    |
| Token refresh fails          | Check cookie settings              | Ensure HTTPS on both ends     |
| CORS error                   | Check `CLIENT_URL` in `.env`       | Check domain in CORS config   |

---

## One-Click Checklist

### Starting Localhost:

- [ ] MongoDB running (`net start MongoDB`)
- [ ] `server/.env` has `MONGODB_URI=mongodb://localhost:27017/crm_db`
- [ ] `client/.env.local` has `VITE_API_URL=http://localhost:5000/api`
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:5173`

### Deploying to Production:

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Connection string copied to `server/.env`
- [ ] IP whitelist updated
- [ ] `CLIENT_URL` updated to your domain
- [ ] `VITE_API_URL` updated to your API domain
- [ ] Deployed to hosting platform
- [ ] Tested at `https://your-domain.com`

---

## Environment Variables Quick Copy

### Localhost `.env` Files

**`server/.env`:**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_ACCESS_SECRET=super_secret_access_token_key_1234567890
JWT_REFRESH_SECRET=super_secret_refresh_token_key_1234567890
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
```

**`client/.env.local`:**

```
VITE_API_URL=http://localhost:5000/api
```

### Production `.env` Files

**`server/.env`:**

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_very_strong_secret_key_min_32_chars
JWT_REFRESH_SECRET=another_very_strong_secret_key_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=https://your-domain.com
```

**`client/.env.local`:**

```
VITE_API_URL=https://api.your-domain.com/api
```

---

## Decision Tree

```
Starting New Project?
├─ For Development Locally?
│  └─ Use Localhost Configuration
│
└─ For Production/Hosting?
   └─ Use Cloud Configuration

Need to Switch Later?
├─ Localhost → Cloud?
│  ├─ Create MongoDB Atlas cluster
│  ├─ Get connection string
│  ├─ Update .env files
│  └─ Restart app
│
└─ Cloud → Localhost?
   ├─ Start local MongoDB
   ├─ Update .env files
   └─ Restart app
```

---

## Status Indicators

### ✅ Localhost is Working

- Server running on port 5000
- Client running on port 5173
- Can see debug logs in terminal
- MongoDB connected
- Login successful

### ✅ Production is Working

- HTTPS connections
- No CORS errors
- Database syncing correctly
- Users can login from domain
- Uploads and transactions working

### ❌ Common Failures

- "Cannot connect" = Database issue
- "CORS error" = URL mismatch
- "401 Unauthorized" = Token/auth issue
- "Blank page" = Frontend not built
- "API timeout" = Backend down or unreachable

---

## Support

**Detailed Setup Instructions:** See `ENVIRONMENT_CONFIGURATION.md`  
**Error Troubleshooting:** See `ERROR_LIST_AND_TROUBLESHOOTING.md`  
**Authentication Issues:** See `AUTHENTICATION_AUDIT_REPORT.md`

---

**Ready to start? Pick your environment above! 🚀**
