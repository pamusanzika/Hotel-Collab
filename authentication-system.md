# Authentication & Signup System - Technical Documentation

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Models](#3-database-models)
4. [Backend API Endpoints](#4-backend-api-endpoints)
5. [Registration Flow](#5-registration-flow)
6. [Email Verification Flow](#6-email-verification-flow)
7. [Login Flow](#7-login-flow)
8. [Token System (JWT)](#8-token-system-jwt)
9. [Token Refresh & Silent Renewal](#9-token-refresh--silent-renewal)
10. [Password Reset Flow](#10-password-reset-flow)
11. [Protected Routes & Role Guard](#11-protected-routes--role-guard)
12. [Frontend Pages & Forms](#12-frontend-pages--forms)
13. [Frontend State Management](#13-frontend-state-management)
14. [Security Features](#14-security-features)
15. [File Reference Map](#15-file-reference-map)

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | Express.js 4.21 | REST API server |
| **Database** | MongoDB + Mongoose 8.8 | User storage, token storage |
| **Password Hashing** | bcrypt (salt rounds: 12) | Secure password storage |
| **Token Auth** | jsonwebtoken (JWT) | Stateless access + refresh tokens |
| **Input Validation** | Zod | Server-side schema validation |
| **Email Service** | Nodemailer (SMTP/Gmail) | Verification, reset, invite emails |
| **Frontend Framework** | React 18 (CRA) | Single Page Application |
| **Routing** | React Router v6 | Client-side routing + protected routes |
| **HTTP Client** | Axios | API calls with interceptors |
| **Styling** | styled-components 6 | CSS-in-JS with theming |
| **State Management** | React Context API | Auth state across components |
| **Real-time** | Socket.io | Authenticated WebSocket connections |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ AuthContext│  │SocketCtx │  │   ProtectedRoute      │  │
│  │ (user,    │  │ (socket, │  │   (role check,        │  │
│  │  login,   │  │  unread) │  │    ban check,         │  │
│  │  logout)  │  │          │  │    redirect)          │  │
│  └─────┬─────┘  └────┬─────┘  └───────────────────────┘  │
│        │              │                                   │
│  ┌─────▼──────────────▼─────┐                            │
│  │     Axios Instance        │                            │
│  │  - Bearer token attach    │                            │
│  │  - 401 → silent refresh   │                            │
│  │  - FormData auto-detect   │                            │
│  └──────────┬────────────────┘                            │
└─────────────┼────────────────────────────────────────────┘
              │ HTTPS
┌─────────────▼────────────────────────────────────────────┐
│                   BACKEND (Express)                      │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────────┐ │
│  │  Helmet   │  │Rate Limit │  │ MongoDB Sanitize       │ │
│  └──────────┘  └───────────┘  └────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Auth Routes (/api/auth)                  │ │
│  │  register → login → refresh → logout → me            │ │
│  │  verify-email → forgot-password → reset-password     │ │
│  └───────────────────────┬──────────────────────────────┘ │
│                          │                                │
│  ┌───────────┐  ┌────────▼──────┐  ┌──────────────────┐  │
│  │  Zod      │  │ authController│  │  tokenService     │  │
│  │ Validate  │  │  (bcrypt,     │  │  (JWT sign/verify)│  │
│  │ Middleware │  │   profiles)   │  │                   │  │
│  └───────────┘  └───────┬───────┘  └──────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼───────────────────────────────┐ │
│  │                    MongoDB                            │ │
│  │  User │ EmailVerificationToken │ PasswordResetToken   │ │
│  │  HotelOwnerProfile │ InfluencerProfile               │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Database Models

### User Model (`server/src/models/User.js`)

| Field | Type | Details |
|-------|------|---------|
| `name` | String | Required, trimmed |
| `email` | String | Required, unique, lowercase, trimmed |
| `passwordHash` | String | Required (bcrypt, 12 salt rounds) |
| `role` | String (enum) | `guest`, `hotel_owner`, `influencer`, `admin` (default: `guest`) |
| `status` | String (enum) | `active`, `banned`, `pending_verification` (default: `pending_verification`) |
| `isEmailVerified` | Boolean | Default: `false` |
| `refreshToken` | String | Nullable, stores current refresh JWT |
| `createdAt` | Date | Auto (timestamps) |
| `updatedAt` | Date | Auto (timestamps) |

**Indexes:** `{ role: 1, status: 1 }` compound index for admin queries.

### EmailVerificationToken (`server/src/models/EmailVerificationToken.js`)

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId | Ref → User |
| `token` | String | Required, unique, 32-byte hex |
| `expiresAt` | Date | Required (24h from creation) |
| `createdAt` | Date | Auto |

**TTL Index:** MongoDB auto-deletes expired documents via `expiresAt`.

### PasswordResetToken (`server/src/models/PasswordResetToken.js`)

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId | Ref → User |
| `token` | String | Required, unique, 32-byte hex |
| `expiresAt` | Date | Required (1h from creation) |
| `createdAt` | Date | Auto |

**TTL Index:** MongoDB auto-deletes expired documents via `expiresAt`.

### AdminInviteToken (`server/src/models/AdminInviteToken.js`)

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId | Ref → User |
| `token` | String | Required, unique |
| `invitedBy` | ObjectId | Ref → User (who invited) |
| `expiresAt` | Date | Required (48h from creation) |
| `createdAt` | Date | Auto |

---

## 4. Backend API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Middleware | Zod Schema | Purpose |
|--------|----------|-----------|------------|---------|
| `POST` | `/register` | `validate(registerSchema)` | name, email, password, role | Create new user account |
| `GET` | `/verify-email` | None | Query: `?token=xxx` | Verify email via token |
| `POST` | `/login` | `validate(loginSchema)` | email, password | Authenticate & get tokens |
| `POST` | `/refresh` | `validate(refreshSchema)` | refreshToken | Get new access token |
| `POST` | `/logout` | `authenticate` | None | Invalidate refresh token |
| `GET` | `/me` | `authenticate` | None | Get current user data |
| `POST` | `/forgot-password` | `validate(forgotPasswordSchema)` | email | Send password reset email |
| `POST` | `/reset-password` | `validate(resetPasswordSchema)` | token, password | Set new password |

### Zod Validation Schemas (`server/src/validators/authValidators.js`)

```
registerSchema:
  - name:     string, trim, 2-100 chars
  - email:    string, trim, lowercase, valid email format
  - password: string, 8-128 chars
  - role:     enum ["hotel_owner", "influencer"]

loginSchema:
  - email:    string, trim, lowercase, valid email format
  - password: string, min 1 char

refreshSchema:
  - refreshToken: string, min 1 char

forgotPasswordSchema:
  - email:    string, trim, lowercase, valid email format

resetPasswordSchema:
  - token:    string, required
  - password: string, 8-128 chars
```

---

## 5. Registration Flow

### Sequence

```
User (Browser)              Frontend (React)              Backend (Express)              MongoDB              Email (SMTP)
     │                           │                              │                          │                     │
     │  Fill form & submit       │                              │                          │                     │
     ├──────────────────────────►│                              │                          │                     │
     │                           │  POST /api/auth/register     │                          │                     │
     │                           │  {name,email,password,role}  │                          │                     │
     │                           ├─────────────────────────────►│                          │                     │
     │                           │                              │  Zod validate body       │                     │
     │                           │                              │  Check duplicate email   │                     │
     │                           │                              │  bcrypt hash (12 rounds) │                     │
     │                           │                              ├─────────────────────────►│                     │
     │                           │                              │  Create User             │                     │
     │                           │                              │  (status: pending)       │                     │
     │                           │                              ├─────────────────────────►│                     │
     │                           │                              │  Create Profile          │                     │
     │                           │                              │  (Owner or Influencer)   │                     │
     │                           │                              ├────────────────────────────────────────────────►│
     │                           │                              │  Send verification email │                     │
     │                           │                              │  (24h token)             │                     │
     │                           │  201 { userId }              │                          │                     │
     │                           │◄─────────────────────────────┤                          │                     │
     │  Show success message     │                              │                          │                     │
     │◄──────────────────────────┤                              │                          │                     │
```

### Backend Logic (`authController.register`)

1. **Duplicate Check** — Query User by email; return `409 Conflict` if exists
2. **Hash Password** — `bcrypt.hash(password, SALT_ROUNDS=12)`
3. **Create User** — `{ name, email, passwordHash, role, status: 'pending_verification' }`
4. **Create Profile** — Based on role:
   - `hotel_owner` → creates empty `HotelOwnerProfile { userId }`
   - `influencer` → creates empty `InfluencerProfile { userId }`
5. **Send Verification Email** — Generates 32-byte hex token, stores in `EmailVerificationToken` with 24h TTL
6. **Return** — `201 { userId }`

### Frontend Implementation

**Two separate signup forms** share the same structure but differ in role:

- **ApplyHotelOwner** (`client/src/pages/ApplyHotelOwner.js`) — sends `role: 'hotel_owner'`
- **ApplyInfluencer** (`client/src/pages/ApplyInfluencer.js`) — sends `role: 'influencer'`

**Form Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Name / Display Name | text | HTML `required` |
| Email | email | HTML `required` + `type="email"` |
| Password | password | HTML `required` + `minLength={8}` |

**State Management Pattern:**
```javascript
const [form, setForm] = useState({ name: '', email: '', password: '' });
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);
const [loading, setLoading] = useState(false);

const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
```

**On Submit:**
```javascript
const onSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    await api.post('/auth/register', { ...form, role: 'hotel_owner' }); // or 'influencer'
    setSuccess(true);
  } catch (err) {
    setError(err.response?.data?.error || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

**Post-Submit UI:**
- Success → Shows "Registration successful! Check your email" + "Go to Login" button
- Error → Shows red error text from API response

### Role Selection Page (`client/src/pages/Apply.js`)

A presentational component with two clickable cards:
- **Hotel Owner card** (teal `#14B8A6`) → navigates to `/apply/hotel-owner`
- **Influencer card** (indigo `#6366F1`) → navigates to `/apply/influencer`

Uses SVG icons (`/Hotel.svg`, `/Influncer.svg`) and responsive CSS Grid layout.

---

## 6. Email Verification Flow

### Sequence

```
User clicks email link → /verify-email?token=abc123

Browser                    VerifyEmail Page              Backend                    MongoDB
  │                              │                          │                         │
  │  Navigate to URL             │                          │                         │
  ├─────────────────────────────►│                          │                         │
  │                              │  GET /api/auth/          │                         │
  │                              │  verify-email?token=abc  │                         │
  │                              ├─────────────────────────►│                         │
  │                              │                          │  Find token in DB       │
  │                              │                          ├────────────────────────►│
  │                              │                          │  Check not expired      │
  │                              │                          │  Set isEmailVerified    │
  │                              │                          │  = true                 │
  │                              │                          │  Set status = 'active'  │
  │                              │                          ├────────────────────────►│
  │                              │                          │  Delete all verify      │
  │                              │                          │  tokens for user        │
  │                              │  200 { message }         │                         │
  │                              │◄─────────────────────────┤                         │
  │  Show "Email Verified!"      │                          │                         │
  │◄─────────────────────────────┤                          │                         │
```

### Frontend Implementation (`client/src/pages/VerifyEmail.js`)

- **State machine** with 3 states: `verifying` → `success` | `error`
- Auto-fires on mount via `useEffect` — no user action needed
- Extracts `token` from URL using `useSearchParams()`
- Missing token → immediate error state
- Success → "Go to Login" button
- Error → "Try Again" button (navigates back to `/apply`)

---

## 7. Login Flow

### Sequence

```
User                       Login Page                 AuthContext              Backend                 MongoDB
  │                            │                          │                      │                       │
  │  Enter email + password    │                          │                      │                       │
  ├───────────────────────────►│                          │                      │                       │
  │                            │  login(email, password)  │                      │                       │
  │                            ├─────────────────────────►│                      │                       │
  │                            │                          │  POST /api/auth/login│                       │
  │                            │                          ├─────────────────────►│                       │
  │                            │                          │                      │  Find user by email   │
  │                            │                          │                      ├──────────────────────►│
  │                            │                          │                      │  bcrypt.compare()     │
  │                            │                          │                      │  Check not banned     │
  │                            │                          │                      │  Check email verified │
  │                            │                          │                      │  Generate JWT pair    │
  │                            │                          │                      │  Store refreshToken   │
  │                            │                          │                      ├──────────────────────►│
  │                            │                          │  {accessToken,       │                       │
  │                            │                          │   refreshToken,      │                       │
  │                            │                          │   user}              │                       │
  │                            │                          │◄─────────────────────┤                       │
  │                            │                          │  localStorage.set    │                       │
  │                            │                          │  (tokens + user)     │                       │
  │                            │                          │  setUser(user)       │                       │
  │                            │  return { user }         │                      │                       │
  │                            │◄─────────────────────────┤                      │                       │
  │                            │  Navigate by role:       │                      │                       │
  │                            │  hotel_owner → /owner    │                      │                       │
  │                            │  influencer → /influencer│                      │                       │
  │◄───────────────────────────┤                          │                      │                       │
```

### Backend Checks (in order)

1. Zod validates email format and password presence
2. Find user by email → `401` if not found
3. `bcrypt.compare(password, user.passwordHash)` → `401` if mismatch
4. Check `user.status !== 'banned'` → `403` if banned
5. Check `user.isEmailVerified === true` → `403` if unverified
6. Generate access token (15m) + refresh token (7d)
7. Store refreshToken in `User.refreshToken`
8. Return `{ accessToken, refreshToken, user: { _id, name, email, role, status } }`

### Frontend Login Page (`client/src/pages/Login.js`)

- **Form fields:** Email + Password (both `required`)
- Uses `useAuth()` hook to call `login()` from AuthContext
- **Role-based redirect:**
  - `hotel_owner` → `/owner`
  - `influencer` → `/influencer`
  - Default → `/`
- **Error display:** Shows API error message or "Login failed"
- **Forgot password link:** Navigates to `/forgot-password`
- **Apply link:** "Don't have an account? Apply now" → `/apply`

---

## 8. Token System (JWT)

### Token Service (`server/src/services/tokenService.js`)

```
┌───────────────────────────────────────────────────────────┐
│                    ACCESS TOKEN (15m)                      │
│                                                           │
│  Payload:  { sub: user._id, role: user.role }             │
│  Secret:   JWT_ACCESS_SECRET                              │
│  Expires:  JWT_ACCESS_EXPIRES (default: '15m')            │
│  Usage:    Authorization header on every API request      │
│  Storage:  localStorage('accessToken')                    │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                   REFRESH TOKEN (7d)                       │
│                                                           │
│  Payload:  { sub: user._id }                              │
│  Secret:   JWT_REFRESH_SECRET                             │
│  Expires:  JWT_REFRESH_EXPIRES (default: '7d')            │
│  Usage:    Only sent to /api/auth/refresh                 │
│  Storage:  localStorage('refreshToken') + User.refreshToken│
│  Rotation: New token pair issued on every refresh         │
└───────────────────────────────────────────────────────────┘
```

### Why Two Tokens?

| Aspect | Access Token | Refresh Token |
|--------|-------------|---------------|
| Lifetime | 15 minutes | 7 days |
| Sent with | Every API request | Only refresh endpoint |
| Validated against DB | No (stateless) | Yes (stored in User.refreshToken) |
| If stolen | Expires quickly | Can be revoked server-side |
| Contains role | Yes | No |

---

## 9. Token Refresh & Silent Renewal

### Axios Interceptor (`client/src/api/axios.js`)

**Request Interceptor:**
```javascript
// Attaches Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Auto-detect FormData and remove Content-Type (browser sets boundary)
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});
```

**Response Interceptor (401 handler):**
```
API returns 401
     │
     ▼
Is this a retry? (_retry flag)
     │
     ├── Yes → Reject (prevent infinite loop)
     │
     └── No → Set _retry = true
              │
              ▼
         Has refreshToken in localStorage?
              │
              ├── No → Reject error
              │
              └── Yes → POST /api/auth/refresh { refreshToken }
                         │
                         ├── Success → Update both tokens in localStorage
                         │              Retry original request with new token
                         │
                         └── Failure → Clear all tokens from localStorage
                                       Redirect to /login
```

### Backend Auth Middleware (`server/src/middleware/auth.js`)

```
Incoming Request
     │
     ▼
Has Authorization header?
     │
     ├── No → 401 "Authentication required"
     │
     └── Yes → Extract "Bearer {token}"
                │
                ▼
          jwt.verify(token, JWT_ACCESS_SECRET)
                │
                ├── TokenExpiredError → 401 "Token expired"
                ├── Invalid → 401 "Invalid token"
                │
                └── Valid → Find User by decoded.sub
                             (exclude passwordHash, refreshToken)
                             │
                             ├── Not found → 401 "User not found"
                             ├── Banned → 403 "Account banned"
                             │
                             └── OK → req.user = user → next()
```

---

## 10. Password Reset Flow

### Sequence

```
Step 1: Request Reset
────────────────────
User → ForgotPassword page → POST /api/auth/forgot-password { email }
  - Backend deletes existing reset tokens for user
  - Generates 32-byte hex token
  - Stores in PasswordResetToken (1h expiry)
  - Sends email with link: {CLIENT_URL}/reset-password?token={token}
  - Returns same response whether email exists or not (timing-attack resistant)

Step 2: Reset Password
──────────────────────
User clicks email link → ResetPassword page → POST /api/auth/reset-password { token, password }
  - Backend validates token exists and not expired
  - Hashes new password (bcrypt, 12 rounds)
  - Updates user password
  - Nullifies refreshToken (forces re-login on all devices)
  - Deletes all reset tokens for user (single-use enforcement)
```

### Frontend Implementation

**ForgotPassword Page (`client/src/pages/ForgotPassword.js`):**
- Single email input
- Shows server success message on submit
- "Back to Login" link

**ResetPassword Page (`client/src/pages/ResetPassword.js`):**
- Extracts `token` from URL query params
- **Three renders:**
  - Missing token → "Invalid Link" with "Request a New Link" button
  - Success → "Password Reset!" with "Go to Login" button
  - Form → New Password + Confirm Password
- **Client-side validation:**
  - Passwords must match
  - Minimum 8 characters
  - Validates before sending API request

---

## 11. Protected Routes & Role Guard

### Frontend Route Protection (`client/src/utils/guards.js`)

```javascript
ProtectedRoute({ children, role })
  │
  ├── loading === true  → return null (prevent flash of wrong content)
  ├── user === null      → Navigate to /login
  ├── user.status === 'banned' → Navigate to /login
  ├── role && user.role !== role → Navigate to /
  └── All checks pass   → Render children
```

### Route Structure in App.js

```
/                           → Landing (public)
/login                      → Login (public)
/apply                      → Apply role selection (public)
/apply/hotel-owner          → Hotel Owner signup (public)
/apply/influencer           → Influencer signup (public)
/verify-email               → Email verification (public)
/forgot-password            → Forgot password (public)
/reset-password             → Reset password (public)

/owner/*                    → ProtectedRoute(role="hotel_owner") → OwnerLayout
/influencer/*               → ProtectedRoute(role="influencer")  → InfluencerLayout
/admin/*                    → ProtectedRoute(role="admin")       → AdminLayout
```

### Backend Role Guard (`server/src/middleware/roleGuard.js`)

```javascript
roleGuard(...allowedRoles)
  │
  ├── req.user missing     → 401 "Authentication required"
  ├── user.role not in allowedRoles → 403 "Insufficient permissions"
  └── Role matches         → next()
```

**Usage in routes:**
```javascript
router.post('/hotels', authenticate, roleGuard('hotel_owner'), hotelController.create);
router.get('/admin/stats', authenticate, roleGuard('admin'), adminController.getStats);
```

---

## 12. Frontend Pages & Forms

### Page Component Summary

| Page | Route | Form Fields | API Endpoint | Styling |
|------|-------|-------------|-------------|---------|
| **Apply** | `/apply` | None (role selection cards) | None | CSS Grid, SVG icons, hover effects |
| **ApplyHotelOwner** | `/apply/hotel-owner` | Name, Email, Password | `POST /auth/register` | Card, Input, Button(primary) |
| **ApplyInfluencer** | `/apply/influencer` | Display Name, Email, Password | `POST /auth/register` | Card, Input, Button(secondary), Divider |
| **Login** | `/login` | Email, Password | via `AuthContext.login()` | Card, Input, Button(primary) |
| **VerifyEmail** | `/verify-email` | None (auto-verify) | `GET /auth/verify-email?token=` | Status-based conditional render |
| **ForgotPassword** | `/forgot-password` | Email | `POST /auth/forgot-password` | Card, Input, Button(primary) |
| **ResetPassword** | `/reset-password` | New Password, Confirm Password | `POST /auth/reset-password` | Card, Input, client-side validation |

### UI Component Building Blocks

All auth forms are built from these reusable components:

- **`Header`** — Landing page navigation bar (shown on all public pages)
- **`Container`** — Centered max-width wrapper
- **`Card`** — White card with shadow and border-radius
- **`Input`** — Styled text input with focus ring (teal glow)
- **`InputWrapper`** — Flex column with gap for label + input + error
- **`Label`** — Form field label (sm font, medium weight)
- **`ErrorText`** — Red error message (xs font)
- **`Button`** — Variants: `primary` (teal), `secondary` (indigo), `ghost` (transparent), `danger` (red)

### Styling Approach

All components use **styled-components** with a centralized theme:

```javascript
// Theme tokens used across auth forms:
colors.primary:       '#14B8A6'  (teal — primary buttons, links, focus rings)
colors.secondary:     '#6366F1'  (indigo — influencer-specific elements)
colors.error:         '#EF4444'  (red — error messages)
colors.success:       '#10B981'  (green — success messages)
colors.textSecondary: '#6B7280'  (gray — subtitles, helper text)

typography.fontSize.sm:  '0.875rem'  (labels, helper text)
typography.fontSize['2xl']: '1.5rem' (page titles)

spacing.md: '1rem'    (form gaps)
spacing.xl: '2rem'    (section spacing)
spacing['2xl']: '3rem' (page top margin)

radius.md: '10px'     (input and card corners)
```

---

## 13. Frontend State Management

### AuthContext (`client/src/contexts/AuthContext.js`)

**Provider wraps entire app in App.js:**
```
ThemeProvider → GlobalStyles → AuthProvider → SocketProvider → BrowserRouter → Routes
```

**State:**
```javascript
user    — Object | null  (current authenticated user)
loading — Boolean        (true until initial hydration completes)
```

**Methods:**
| Method | Action |
|--------|--------|
| `login(email, password)` | POST `/auth/login`, store tokens + user in localStorage, update state |
| `logout()` | POST `/auth/logout` (error ignored), clear localStorage, set user = null, redirect to `/` |

**Hydration on App Load:**
```
App starts → AuthProvider mounts
  │
  ├── localStorage has accessToken?
  │     │
  │     ├── Yes → GET /api/auth/me
  │     │          │
  │     │          ├── Success → setUser(data.user), update localStorage
  │     │          └── Failure → clear user + tokens from localStorage
  │     │
  │     └── No → setLoading(false), user remains null
```

### LocalStorage Keys

| Key | Value | Set By | Cleared By |
|-----|-------|--------|------------|
| `accessToken` | JWT string | `login()`, refresh interceptor | `logout()`, refresh failure |
| `refreshToken` | JWT string | `login()`, refresh interceptor | `logout()`, refresh failure |
| `user` | JSON string | `login()`, hydration | `logout()`, hydration failure |

### SocketContext (`client/src/contexts/SocketContext.js`)

- Depends on `AuthContext` — connects Socket.io when `user` exists
- Passes JWT token via Socket.io `auth` option
- Disconnects when user logs out (user becomes null)
- Tracks `unreadCount` for messaging badge

---

## 14. Security Features

### Password Security
- **Hashing:** bcrypt with 12 salt rounds (industry standard)
- **Validation:** 8-128 character requirement (Zod server-side)
- **Reset invalidation:** Nullifies refreshToken on password change (forces re-login on all devices)

### Token Security
- **Short-lived access:** 15-minute expiry limits exposure window
- **Server-stored refresh:** Validated against DB on every refresh (revocable)
- **Token rotation:** New refresh token on every refresh call
- **Separate secrets:** Different signing keys for access and refresh

### Input Validation
- **Server-side Zod:** All inputs validated before processing
- **HTML5 constraints:** `required`, `type="email"`, `minLength` on frontend
- **MongoDB sanitization:** Prevents NoSQL injection
- **Trimming/lowercase:** Email normalized before storage

### Rate Limiting
- **API routes:** 100 requests per 15 minutes (1000 in dev)
- **Auth routes:** 20 requests per 15 minutes

### User Status Enforcement
- **Login:** Rejects banned and unverified users
- **Auth middleware:** Checks ban status on every authenticated request
- **Socket connection:** Verifies JWT and ban status before allowing WebSocket
- **Protected routes (frontend):** Redirects banned users to login

### Anti-Timing Attack
- **Forgot password:** Returns identical response regardless of whether email exists

### Session Management
- **Logout:** Nullifies refresh token server-side
- **Password reset:** Forces logout on all devices
- **Token refresh failure:** Auto-logout with full cleanup

---

## 15. File Reference Map

### Backend Files

```
server/src/
├── app.js                              ← Express app entry point
├── config/
│   ├── db.js                           ← MongoDB connection
│   └── env.js                          ← Environment variables
├── controllers/
│   └── authController.js               ← register, login, verify, reset, me, logout, refresh
├── middleware/
│   ├── auth.js                         ← JWT verification + ban check
│   ├── roleGuard.js                    ← Role-based access control
│   ├── validate.js                     ← Zod schema validation
│   └── errorHandler.js                 ← Global error handler
├── models/
│   ├── User.js                         ← Core user model
│   ├── HotelOwnerProfile.js            ← Owner profile (auto-created on register)
│   ├── InfluencerProfile.js            ← Influencer profile (auto-created on register)
│   ├── EmailVerificationToken.js       ← 24h TTL token
│   ├── PasswordResetToken.js           ← 1h TTL token
│   └── AdminInviteToken.js             ← 48h TTL token
├── routes/
│   ├── index.js                        ← Route aggregator
│   └── auth.js                         ← Auth route definitions
├── services/
│   ├── tokenService.js                 ← JWT sign/verify helpers
│   └── emailService.js                 ← Nodemailer email sending
└── validators/
    └── authValidators.js               ← Zod schemas for auth endpoints
```

### Frontend Files

```
client/src/
├── App.js                              ← Routes, providers, ProtectedRoute
├── api/
│   └── axios.js                        ← Axios instance + interceptors
├── contexts/
│   ├── AuthContext.js                  ← Auth state provider (user, login, logout)
│   └── SocketContext.js                ← Socket.io connection (depends on auth)
├── hooks/
│   ├── useAuth.js                      ← useContext(AuthContext) wrapper
│   └── useSocket.js                    ← useContext(SocketContext) wrapper
├── utils/
│   └── guards.js                       ← ProtectedRoute component
├── pages/
│   ├── Landing.js                      ← Public landing page
│   ├── Login.js                        ← Login form
│   ├── Apply.js                        ← Role selection (owner vs influencer)
│   ├── ApplyHotelOwner.js              ← Owner registration form
│   ├── ApplyInfluencer.js              ← Influencer registration form
│   ├── VerifyEmail.js                  ← Auto-verify email token
│   ├── ForgotPassword.js               ← Request password reset
│   └── ResetPassword.js                ← Set new password
├── components/
│   ├── landing/
│   │   └── Header.js                   ← Public page header/nav
│   ├── layout/
│   │   └── Container.js                ← Centered max-width wrapper
│   └── ui/
│       ├── Button.js                   ← Styled button (primary/secondary/ghost/danger)
│       ├── Card.js                     ← Card container with shadow
│       ├── Input.js                    ← Input + InputWrapper + Label + ErrorText
│       └── Badge.js                    ← Status badges
└── styles/
    ├── theme.js                        ← Color, typography, spacing tokens
    └── GlobalStyles.js                 ← CSS reset and defaults
```

---

## Summary

The authentication system is a **full-stack JWT-based auth implementation** with:

- **Dual-token architecture** (short access + long refresh with rotation)
- **Email verification** required before login
- **Role-based access** enforced on both frontend (ProtectedRoute) and backend (roleGuard)
- **Automatic token refresh** via Axios interceptor (transparent to users)
- **Password reset** with single-use, time-limited tokens and session invalidation
- **Auto-created profiles** based on role during registration
- **Consistent UI** built with styled-components and reusable form components
- **Production security** including rate limiting, input validation, ban enforcement, and timing-attack resistance
