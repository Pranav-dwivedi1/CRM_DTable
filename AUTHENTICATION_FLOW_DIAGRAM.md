# Authentication Flow Diagram - Before & After

## BEFORE FIX ❌ (BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (localhost:5173)                 SERVER (localhost:5000) │
│                                                                  │
│  User Login                                                      │
│  ─────────────────────────────────────────→ /api/auth/login    │
│     email: user@example.com                                     │
│     password: ••••••••••                                        │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                Set-Cookie: refreshToken        │
│                                {                                │
│                                  sameSite: 'strict'  ❌         │
│                                  path: undefined    ❌          │
│                                  httpOnly: true                 │
│                                  maxAge: 7 days                 │
│                                }                                │
│  accessToken stored in localStorage ✓                          │
│                                                                  │
│ ─ TIME PASSES - ACCESS TOKEN EXPIRES (15 min) ─                │
│                                                                  │
│  User clicks protected resource                                 │
│  ─────────────────────────────────────────→ GET /api/leads    │
│     Authorization: Bearer (expired_token)                       │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                401 Unauthorized                 │
│                                                                  │
│  Axios interceptor triggers refresh                             │
│  Cookie: refreshToken ❌ NOT SENT                               │
│  ─────────────────────────────────────────→ POST /api/auth/    │
│                                              refresh-token     │
│     (no cookies because:                                        │
│      - sameSite: strict blocks it ❌                            │
│      - cookie path doesn't match ❌)                            │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                401 Invalid or                   │
│                                    expired refresh token  ❌    │
│                                                                  │
│  User logged out ❌                                             │
│  Must re-login manually ❌                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## AFTER FIX ✅ (WORKING)

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (localhost:5173)                 SERVER (localhost:5000) │
│                                                                  │
│  User Login                                                      │
│  ─────────────────────────────────────────→ /api/auth/login    │
│     email: user@example.com                                     │
│     password: ••••••••••                                        │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                Set-Cookie: refreshToken        │
│                                {                                │
│                                  sameSite: 'lax'  ✅            │
│                                  path: '/'         ✅           │
│                                  httpOnly: true                 │
│                                  maxAge: 7 days                 │
│                                }                                │
│  refreshToken stored in cookie ✓                               │
│  accessToken stored in localStorage ✓                          │
│                                                                  │
│ ─ TIME PASSES - ACCESS TOKEN EXPIRES (15 min) ─                │
│                                                                  │
│  User clicks protected resource                                 │
│  ─────────────────────────────────────────→ GET /api/leads    │
│     Authorization: Bearer (expired_token)                       │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                401 Unauthorized                 │
│                                                                  │
│  Axios interceptor triggers refresh                             │
│  Cookie: refreshToken ✅ SENT AUTOMATICALLY                     │
│  ─────────────────────────────────────────→ POST /api/auth/    │
│     (cookies sent because:                  refresh-token     │
│      - sameSite: lax allows it ✅           (with Cookie)     │
│      - cookie path: / matches ✅)                              │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                200 OK                           │
│                                {                                │
│                                  accessToken: (new)             │
│                                }                                │
│                                Set-Cookie: refreshToken (new)  │
│                                                                  │
│  New accessToken stored ✓                                       │
│  New refreshToken cookie set ✓                                  │
│                                                                  │
│  Axios retries original request automatically                   │
│  ─────────────────────────────────────────→ GET /api/leads    │
│     Authorization: Bearer (new_token)                           │
│                                                                  │
│                              ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                200 OK (with leads data) ✅       │
│                                                                  │
│  User continues working seamlessly ✅                           │
│  NO LOGIN REQUIRED ✅                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cookie Configuration Comparison

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  BEFORE (BROKEN) ❌                                          │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  res.cookie('refreshToken', token, {                         │
│    httpOnly: true,                                           │
│    secure: false,                // for localhost            │
│    sameSite: 'strict',          ❌ TOO RESTRICTIVE!         │
│    maxAge: 604800000             // 7 days                   │
│  });                                                         │
│                                                               │
│  Problem: Cookie NOT sent to /refresh-token endpoint!        │
│  Impact: Automatic token refresh fails                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  AFTER (FIXED) ✅                                            │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  const cookieOptions = {                                     │
│    httpOnly: true,                                           │
│    secure: NODE_ENV === 'production',                        │
│    sameSite: NODE_ENV === 'production'                       │
│              ? 'strict'                 ✅ Strict in prod    │
│              : 'lax',                   ✅ Lax in dev        │
│    maxAge: 604800000,                  // 7 days             │
│    path: '/'                           ✅ CRITICAL FIX!     │
│  };                                                          │
│  res.cookie('refreshToken', token, cookieOptions);           │
│                                                               │
│  Result: Cookie sent to all routes, including refresh!       │
│  Impact: Automatic token refresh works perfectly             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## SameSite Policy Explanation

```
┌─────────────────────────────────────────────────────────────┐
│ SameSite: 'strict' ❌ (NOT SUITABLE FOR LOCALHOST DEV)      │
│                                                             │
│  Browser Rule: Only send cookie if:                         │
│  ├─ Same protocol (http/https)  ✓ Both http                │
│  ├─ Same domain (localhost)      ✓ Both localhost          │
│  └─ Same port (5000)             ✓ Both 5000               │
│                                                             │
│  Reality in Development:                                    │
│  ├─ Client at localhost:5173     ← Different port!         │
│  ├─ Server at localhost:5000     ← Different port!         │
│  └─ sameSite: strict treats as different sites ❌           │
│                                                             │
│  Result: Cookie NOT sent to refresh endpoint                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SameSite: 'lax' ✅ (DEVELOPMENT-FRIENDLY)                  │
│                                                             │
│  Browser Rule: Send cookie if:                              │
│  ├─ Same-site request (same origin, any port)  ✓           │
│  ├─ Top-level navigation                        ✓           │
│  └─ Cross-site requests get blocked (POST, etc) ✓           │
│                                                             │
│  Reality in Development:                                    │
│  ├─ Client at localhost:5173     ← Same origin             │
│  ├─ Server at localhost:5000     ← Different port OK!      │
│  └─ sameSite: lax allows it ✓                              │
│                                                             │
│  Result: Cookie SENT to refresh endpoint ✅                 │
│                                                             │
│  Security: Still prevents cross-site attacks               │
│  (http://attacker.com cannot access cookies)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SameSite: 'strict' ✅ (PRODUCTION SECURITY)                │
│                                                             │
│  Browser Rule: Only send cookie if:                         │
│  ├─ Same protocol ✓ Both https                             │
│  ├─ Same domain ✓ Both app.example.com                     │
│  └─ Same port ✓ Both 443                                   │
│                                                             │
│  Result: Maximum security in production                     │
│  Cookie only sent on exact same-site requests              │
│                                                             │
│  Note: Internal API calls still work                        │
│  (app.example.com/api/* all same site)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Path Configuration Impact

```
┌─────────────────────────────────────────────────────────────┐
│ WITHOUT path: '/' ❌ (BROKEN)                               │
│                                                             │
│  Set-Cookie at: /api/auth/login                            │
│  Cookie path defaults to: /api/auth/                        │
│                                                             │
│  Cookie sent to:                                            │
│  ├─ /api/auth/login                ✓ YES (exact match)     │
│  ├─ /api/auth/logout               ✓ YES (same path)       │
│  ├─ /api/auth/register             ✓ YES (same path)       │
│  └─ /api/auth/refresh-token        ❌ NO (different!)      │
│                                                             │
│  Problem: refresh-token at same level doesn't receive cookie!
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ WITH path: '/' ✅ (FIXED)                                   │
│                                                             │
│  Set-Cookie at: /api/auth/login                            │
│  Cookie path set to: /                                      │
│                                                             │
│  Cookie sent to:                                            │
│  ├─ /api/auth/login                ✓ YES (under /)         │
│  ├─ /api/auth/logout               ✓ YES (under /)         │
│  ├─ /api/auth/refresh-token        ✓ YES (under /)         │
│  ├─ /api/leads                     ✓ YES (under /)         │
│  └─ /api/users                     ✓ YES (under /)         │
│                                                             │
│  Result: Cookie available to ALL routes! ✅                │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow Sequence

```
STEP 1: LOGIN
  Browser                              Server
    │                                    │
    │  POST /login {email, password}    │
    ├──────────────────────────────────>│
    │                                    │ Validate credentials
    │                                    │ Generate tokens
    │  200 OK                           │
    │  { accessToken: "jwt..." }        │
    │< ─────────────────────────────────┤
    │  Set-Cookie: refreshToken         │
    │< ─────────────────────────────────┤
    │                                    │
    │ Store accessToken in localStorage │
    │ Store refreshToken in cookie      │
    │                                    │

STEP 2: PROTECTED REQUEST (with valid token)
  Browser                              Server
    │                                    │
    │  GET /api/leads                   │
    │  Authorization: Bearer (valid)    │
    ├──────────────────────────────────>│
    │                                    │ Verify token
    │                                    │ Return leads
    │  200 OK { leads: [...] }          │
    │< ─────────────────────────────────┤
    │                                    │

STEP 3: PROTECTED REQUEST (with expired token)
  Browser                              Server
    │                                    │
    │  GET /api/leads                   │
    │  Authorization: Bearer (expired)  │
    ├──────────────────────────────────>│
    │                                    │ Check token
    │                                    │ Token expired!
    │  401 Unauthorized                 │
    │< ─────────────────────────────────┤
    │                                    │
    │ Axios interceptor triggers refresh│
    │                                    │

STEP 4: TOKEN REFRESH (THE FIX)
  Browser                              Server
    │                                    │
    │  POST /refresh-token              │
    │  (automatic, with cookies)        │
    │  Cookie: refreshToken ✅          │
    ├──────────────────────────────────>│
    │                                    │ Get cookie ✓
    │                                    │ Query database ✓
    │                                    │ Token valid ✓
    │                                    │ Generate new tokens
    │  200 OK                           │
    │  { accessToken: "new_jwt..." }    │
    │< ─────────────────────────────────┤
    │  Set-Cookie: refreshToken (new)   │
    │< ─────────────────────────────────┤
    │                                    │
    │ Store new accessToken             │
    │ Update cookie                     │
    │                                    │

STEP 5: RETRY ORIGINAL REQUEST (with new token)
  Browser                              Server
    │                                    │
    │  GET /api/leads                   │
    │  Authorization: Bearer (new)      │
    ├──────────────────────────────────>│
    │                                    │ Verify new token ✓
    │                                    │ Return leads
    │  200 OK { leads: [...] } ✅       │
    │< ─────────────────────────────────┤
    │                                    │
    │ Show leads to user                │
    │ User never noticed the refresh!   │
    │                                    │
```

---

## Console Log Output

### Login Success

```
[LOGIN] Cookie Options: {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',      ← KEY CHANGE
  path: '/',             ← KEY CHANGE
  maxAge: 604800000,
  expiresDate: '2025-07-15T12:34:56.789Z'
}
[LOGIN] Response Headers will include Set-Cookie for refreshToken
[LOGIN] Refresh Token (last 8 chars): ...abc12345
```

### Token Refresh Success

```
[REFRESH_TOKEN] Received Request
[REFRESH_TOKEN] Cookies: {
  hasRefreshToken: true,              ← KEY: Token received!
  cookieKeys: ['refreshToken']
}
[REFRESH_TOKEN] Final Token (last 8 chars): ...abc12345
[REFRESH_TOKEN] Database Query: {
  found: true,
  dbId: '507f1f77bcf86cd799439011',
  expiresAt: '2025-07-15T12:34:56.789Z',
  now: '2025-07-08T12:34:56.789Z',
  isExpired: false
}
[REFRESH_TOKEN] SUCCESS: New tokens issued for user john@example.com
```

### If It Fails (Old Configuration)

```
[REFRESH_TOKEN] Received Request
[REFRESH_TOKEN] Cookies: {
  hasRefreshToken: false,             ← PROBLEM: No cookie!
  cookieKeys: []
}
[REFRESH_TOKEN] Final Token (last 8 chars): MISSING  ← ERROR!
[REFRESH_TOKEN] ERROR: No refresh token found in cookies or body
```

---

## Summary

| Aspect                      | Before ❌        | After ✅                      |
| --------------------------- | ---------------- | ----------------------------- |
| **sameSite**                | 'strict'         | 'lax' (dev) / 'strict' (prod) |
| **path**                    | undefined        | '/'                           |
| **Cookie sent to refresh?** | ❌ NO            | ✅ YES                        |
| **Token refresh works?**    | ❌ NO            | ✅ YES                        |
| **User experience**         | Frequent logouts | Seamless                      |
| **Debug visibility**        | ❌ None          | ✅ Full logs                  |

The fix enables automatic token refresh by allowing the refresh token cookie to be sent from the browser to the server on the refresh endpoint request.
