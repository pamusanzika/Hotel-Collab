# HotelCollab — Hotel-Influencer Platform

A full-stack web application that connects hotel owners with social media influencers for marketing collaborations. Hotel owners list their properties and influencers link their social media accounts (YouTube, Instagram, TikTok) to find partnership opportunities.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Authentication Flow](#authentication-flow)
8. [OAuth Social Media Integration](#oauth-social-media-integration)
9. [Frontend Application](#frontend-application)
10. [Security](#security)
11. [Server-Side Functions Reference](#server-side-functions-reference)
12. [Client-Side Components Reference](#client-side-components-reference)
13. [Environment Variables](#environment-variables)
14. [Getting Started](#getting-started)
15. [Current Status & Missing Features](#current-status--missing-features)

---

## Project Overview

**HotelCollab** is a role-based platform with three user types:

| Role | Description |
|------|-------------|
| **Hotel Owner** | Registers hotels, manages listings, and finds influencers for marketing collaborations |
| **Influencer** | Links social media accounts (YouTube, Instagram, TikTok), browses campaigns, and applies to collaborate with hotels |
| **Admin** | Manages all users, bans/unbans accounts, views platform analytics |

**How it works:**

1. A user signs up as either a Hotel Owner or Influencer
2. They verify their email address via a token-based link
3. Hotel Owners create hotel listings with details like location, star rating, and amenities
4. Influencers link their social media accounts via OAuth to showcase their reach
5. Both sides can discover and collaborate with each other
6. Admins moderate the platform by managing users and enforcing policies

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | — | JavaScript runtime |
| Express | 4.21.0 | Web framework |
| MongoDB | — | NoSQL database |
| Mongoose | 8.8.0 | MongoDB ODM (Object Data Modeling) |
| JSON Web Token | 9.0.2 | Authentication tokens |
| Bcrypt | 5.1.1 | Password hashing |
| Zod | 3.23.8 | Request validation schemas |
| Helmet | 8.0.0 | HTTP security headers |
| CORS | 2.8.5 | Cross-Origin Resource Sharing |
| express-rate-limit | 7.4.1 | API rate limiting |
| express-mongo-sanitize | 2.2.0 | NoSQL injection prevention |
| dotenv | 16.4.5 | Environment variable management |
| Nodemon | 3.1.7 | Development hot-reload |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| React Router DOM | 6.28.0 | Client-side routing |
| Styled Components | 6.1.13 | CSS-in-JS styling |
| Axios | 1.7.7 | HTTP client |
| React Scripts | 5.0.1 | Build tooling (Create React App) |

---

## Architecture

The project follows a **monorepo structure** with separate `client/` and `server/` directories. There is no shared package — each side manages its own dependencies independently.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│  React Router → Pages → Components → Axios → API calls     │
│  AuthContext provides global auth state via React Context    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (REST JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Express)                        │
│  Routes → Middleware (auth, validate, roleGuard)            │
│         → Controllers → Services → Mongoose Models          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Database                        │
│  Collections: users, hotels, influencerprofiles,            │
│  hotelownerprofiles, socialaccounts, banlogs,               │
│  emailverificationtokens                                    │
└─────────────────────────────────────────────────────────────┘
```

**Backend pattern:** MVC (Model–View–Controller) — routes define endpoints, controllers handle logic, models define data, services encapsulate reusable operations.

**Frontend pattern:** Component-based architecture with Context API for global state, page-level components for routes, and a reusable UI component library.

---

## Directory Structure

```
hotel-influencer-platform/
│
├── server/
│   ├── package.json
│   ├── .env                              # Local environment config
│   ├── .env.example                      # Environment template
│   ├── scripts/
│   │   └── seedAdmin.js                  # Creates initial admin user
│   └── src/
│       ├── app.js                        # Express app entry point
│       ├── config/
│       │   ├── db.js                     # MongoDB connection logic
│       │   └── env.js                    # Centralized env var export
│       ├── controllers/
│       │   ├── authController.js         # Register, login, logout, verify, refresh, me
│       │   ├── oauthController.js        # OAuth start, callback, unlink
│       │   ├── hotelController.js        # Hotel CRUD operations
│       │   └── adminController.js        # User listing, ban, unban
│       ├── middleware/
│       │   ├── auth.js                   # JWT verification, attaches req.user
│       │   ├── roleGuard.js              # Role-based access control
│       │   ├── validate.js               # Zod schema validation
│       │   └── errorHandler.js           # Global error handler
│       ├── models/
│       │   ├── User.js                   # Core user account
│       │   ├── Hotel.js                  # Hotel listing
│       │   ├── InfluencerProfile.js      # Influencer profile + linked platforms
│       │   ├── HotelOwnerProfile.js      # Hotel owner profile
│       │   ├── SocialAccount.js          # OAuth token storage
│       │   ├── EmailVerificationToken.js # Email verification tokens (TTL)
│       │   └── BanLog.js                 # Admin moderation audit log
│       ├── routes/
│       │   ├── index.js                  # Route aggregator
│       │   ├── auth.js                   # /api/auth/* routes
│       │   ├── oauth.js                  # /api/oauth/* routes
│       │   ├── hotels.js                 # /api/hotels/* routes
│       │   └── admin.js                  # /api/admin/* routes
│       ├── services/
│       │   ├── tokenService.js           # JWT generation & verification
│       │   ├── emailService.js           # Email verification sender
│       │   └── oauth/
│       │       ├── OAuthAdapter.js       # Abstract base class
│       │       ├── YouTubeAdapter.js     # Google/YouTube OAuth
│       │       ├── InstagramAdapter.js   # Instagram Graph API OAuth
│       │       ├── TikTokAdapter.js      # TikTok Login Kit OAuth
│       │       └── index.js             # Adapter factory/registry
│       └── validators/
│           ├── authValidators.js         # Zod schemas: register, login, refresh
│           └── hotelValidators.js        # Zod schemas: create/update hotel
│
├── client/
│   ├── package.json
│   ├── public/
│   │   └── index.html                   # HTML template
│   └── src/
│       ├── index.js                     # React entry point
│       ├── App.js                       # Root component, routing, providers
│       ├── api/
│       │   └── axios.js                 # Axios instance with JWT interceptors
│       ├── contexts/
│       │   └── AuthContext.js           # Global auth state (React Context)
│       ├── hooks/
│       │   └── useAuth.js              # Custom hook wrapping AuthContext
│       ├── utils/
│       │   └── guards.js              # ProtectedRoute component
│       ├── styles/
│       │   ├── theme.js               # Design system tokens (colors, spacing, etc.)
│       │   └── GlobalStyles.js        # CSS reset and base styles
│       ├── components/
│       │   ├── ui/                    # Reusable UI primitives
│       │   │   ├── Button.js
│       │   │   ├── Card.js
│       │   │   ├── Input.js
│       │   │   ├── Modal.js
│       │   │   ├── Badge.js
│       │   │   └── index.js          # Barrel export
│       │   ├── layout/               # Dashboard layout components
│       │   │   ├── DashboardLayout.js
│       │   │   ├── Sidebar.js
│       │   │   ├── Topbar.js
│       │   │   ├── PageHeader.js
│       │   │   └── Container.js
│       │   └── landing/              # Landing page sections
│       │       ├── Header.js
│       │       ├── Hero.js
│       │       └── Features.js
│       └── pages/
│           ├── Landing.js             # Homepage
│           ├── Login.js               # User login
│           ├── Apply.js               # Role selection
│           ├── ApplyHotelOwner.js      # Hotel owner registration
│           ├── ApplyInfluencer.js      # Influencer registration
│           ├── VerifyEmail.js          # Email verification
│           ├── owner/                 # Hotel owner dashboard
│           │   ├── OwnerDashboard.js
│           │   ├── OwnerProfile.js
│           │   ├── OwnerHotels.js
│           │   ├── OwnerCollaborations.js
│           │   └── OwnerSettings.js
│           ├── influencer/            # Influencer dashboard
│           │   ├── InfluencerDashboard.js
│           │   ├── InfluencerProfile.js
│           │   ├── InfluencerCampaigns.js
│           │   ├── InfluencerApplications.js
│           │   └── InfluencerSettings.js
│           └── admin/                 # Admin panel
│               ├── AdminLogin.js
│               ├── AdminDashboard.js
│               └── AdminUsers.js
```

---

## Database Models

### User (`models/User.js`)

The core account model. Every person on the platform has a User document.

| Field | Type | Details |
|-------|------|---------|
| `name` | String | Required, trimmed |
| `email` | String | Required, unique, lowercase |
| `passwordHash` | String | Bcrypt hash (12 rounds) |
| `role` | Enum | `guest`, `hotel_owner`, `influencer`, `admin` |
| `status` | Enum | `active`, `banned`, `pending_verification` |
| `isEmailVerified` | Boolean | Default: `false` |
| `refreshToken` | String | Current JWT refresh token (for revocation) |

**Why:** Centralizes authentication for all roles. The `role` field determines what API endpoints and frontend dashboards a user can access. Storing `refreshToken` in the document enables server-side token revocation on logout or ban.

**Index:** `{ role, status }` — speeds up admin queries that filter users by role and status.

---

### Hotel (`models/Hotel.js`)

A hotel listing created by a hotel owner.

| Field | Type | Details |
|-------|------|---------|
| `ownerId` | ObjectId → User | The hotel owner who created it |
| `name` | String | Required, trimmed |
| `description` | String | Max 1000 characters |
| `location` | String | City/region |
| `starRating` | Number | 1–5, default: 3 |
| `amenities` | [String] | e.g., `["pool", "spa", "wifi"]` |
| `images` | [String] | URLs to hotel photos |
| `contactEmail` | String | Business contact |
| `isActive` | Boolean | Whether listing is visible |

**Why:** Hotels are the core product listings. The `ownerId` reference enforces ownership — controllers verify `req.user._id === hotel.ownerId` before allowing edits or deletes.

---

### InfluencerProfile (`models/InfluencerProfile.js`)

Extended profile for influencer users. One-to-one relationship with User.

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Unique, one profile per user |
| `displayName` | String | Public-facing name |
| `bio` | String | Max 500 characters |
| `niche` | String | e.g., "travel", "luxury", "food" |
| `location` | String | Where the influencer is based |
| `linkedPlatforms` | Array | Connected social accounts |

Each entry in `linkedPlatforms`:
| Field | Type | Details |
|-------|------|---------|
| `provider` | Enum | `youtube`, `instagram`, `tiktok` |
| `providerUserId` | String | Platform-specific user ID |
| `username` | String | Platform handle/channel name |
| `followers` | Number | Follower/subscriber count |
| `linkedAt` | Date | When the account was connected |

**Why:** Separating profile data from the User model keeps the User model clean for auth-only concerns. The `linkedPlatforms` array provides a quick summary of connected accounts without needing to query the SocialAccount collection.

---

### HotelOwnerProfile (`models/HotelOwnerProfile.js`)

Extended profile for hotel owner users. One-to-one with User.

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Unique |
| `companyName` | String | Business name |
| `phone` | String | Contact number |
| `bio` | String | Max 500 characters |
| `website` | String | Company website URL |
| `location` | String | Business location |

**Why:** Hotel owners need business-specific fields (company name, phone, website) that don't apply to influencers, so a separate profile model makes sense.

---

### SocialAccount (`models/SocialAccount.js`)

Stores OAuth tokens for linked social media accounts. Separate from InfluencerProfile for security.

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Which user owns these tokens |
| `provider` | Enum | `youtube`, `instagram`, `tiktok` |
| `providerUserId` | String | Platform user ID |
| `accessToken` | String | OAuth access token |
| `refreshToken` | String | OAuth refresh token |
| `scopes` | [String] | Granted permissions |
| `expiresAt` | Date | Token expiration |
| `tokenStrategy` | Enum | `oauth2` or `mock` |

**Unique index:** `{ userId, provider }` — one connection per platform per user.

**Why tokens are stored separately:** OAuth tokens are sensitive credentials. Keeping them in their own collection means profile reads don't expose tokens, and token management logic is isolated.

---

### EmailVerificationToken (`models/EmailVerificationToken.js`)

Temporary tokens for email verification. Auto-deleted after expiration.

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Who is being verified |
| `token` | String | Random 32-byte hex string |
| `expiresAt` | Date | 24 hours after creation |

**Why:** Uses a MongoDB TTL index on `expiresAt` so expired tokens are automatically garbage-collected by the database — no cron job needed.

---

### BanLog (`models/BanLog.js`)

Audit trail for admin moderation actions.

| Field | Type | Details |
|-------|------|---------|
| `adminId` | ObjectId → User | Which admin performed the action |
| `userId` | ObjectId → User | Which user was affected |
| `action` | Enum | `ban` or `unban` |
| `reason` | String | Max 500 characters |
| `timestamp` | Date | When the action occurred |

**Why:** Provides accountability for moderation decisions. If a user disputes a ban, admins can review the log to see who banned them and why.

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register a new user (hotel_owner or influencer) |
| `GET` | `/api/auth/verify-email?token=...` | No | Verify email using token from email link |
| `POST` | `/api/auth/login` | No | Login with email and password, returns JWT tokens |
| `POST` | `/api/auth/refresh` | No | Exchange refresh token for new access + refresh tokens |
| `POST` | `/api/auth/logout` | Yes | Invalidate refresh token |
| `GET` | `/api/auth/me` | Yes | Get current authenticated user info |

### OAuth (`/api/oauth`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/oauth/:provider/start` | Yes | influencer | Get OAuth authorization URL for a platform |
| `GET` | `/api/oauth/:provider/callback` | No | — | OAuth redirect callback (called by the platform) |
| `DELETE` | `/api/oauth/:provider/unlink` | Yes | influencer | Disconnect a linked social account |

`:provider` can be `youtube`, `instagram`, or `tiktok`.

### Hotels (`/api/hotels`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/hotels` | Yes | hotel_owner | Create a new hotel listing |
| `GET` | `/api/hotels` | Yes | hotel_owner | List all hotels owned by the current user |
| `GET` | `/api/hotels/:id` | Yes | hotel_owner | Get a single hotel by ID |
| `PUT` | `/api/hotels/:id` | Yes | hotel_owner | Update a hotel listing |
| `DELETE` | `/api/hotels/:id` | Yes | hotel_owner | Delete a hotel listing |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/admin/users` | Yes | admin | List all users (with role/status filters, pagination) |
| `POST` | `/api/admin/users/:id/ban` | Yes | admin | Ban a user (sets status to banned, clears refresh token) |
| `POST` | `/api/admin/users/:id/unban` | Yes | admin | Unban a user (restores active or pending status) |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Returns `{ status: 'ok' }` |

---

## Authentication Flow

The platform uses **JWT (JSON Web Tokens)** with an access/refresh token pattern.

### Why two tokens?

- **Access token** (15 min lifetime): Sent with every API request. Short-lived to limit damage if intercepted.
- **Refresh token** (7 day lifetime): Used only to get a new access token when the old one expires. Stored in the database for server-side revocation.

### Registration → Verification → Login Flow

```
1. REGISTER
   Client POST /api/auth/register { name, email, password, role }
   └─ Server hashes password (bcrypt, 12 rounds)
   └─ Creates User with status='pending_verification'
   └─ Creates role-specific profile (InfluencerProfile or HotelOwnerProfile)
   └─ Generates random verification token (32 bytes)
   └─ Stores token in EmailVerificationToken (expires in 24h)
   └─ Logs verification URL to console (email integration placeholder)

2. VERIFY EMAIL
   User clicks link: /verify-email?token=abc123
   Client GET /api/auth/verify-email?token=abc123
   └─ Server finds EmailVerificationToken by token
   └─ Sets user.isEmailVerified = true, user.status = 'active'
   └─ Deletes all verification tokens for that user

3. LOGIN
   Client POST /api/auth/login { email, password }
   └─ Server validates credentials
   └─ Checks user is not banned and email is verified
   └─ Generates access token (JWT, 15m) and refresh token (JWT, 7d)
   └─ Stores refresh token hash in User document
   └─ Returns { accessToken, refreshToken, user }

4. AUTHENTICATED REQUESTS
   Client sends: Authorization: Bearer {accessToken}
   └─ auth middleware verifies JWT signature
   └─ Loads user from database
   └─ Rejects if user is banned
   └─ Attaches user to req.user

5. TOKEN REFRESH (when access token expires)
   Client POST /api/auth/refresh { refreshToken }
   └─ Server verifies refresh token signature
   └─ Checks token matches value stored in User document
   └─ Generates new access + refresh tokens
   └─ Returns new tokens

6. LOGOUT
   Client POST /api/auth/logout (with access token)
   └─ Server clears refreshToken from User document
   └─ Client clears localStorage
```

### Client-Side Token Management (`api/axios.js`)

The Axios instance has two interceptors:

1. **Request interceptor:** Automatically attaches the `accessToken` from `localStorage` as a `Bearer` token on every outgoing request.

2. **Response interceptor (401 handler):** When any API call returns `401 Unauthorized`:
   - Attempts a silent refresh by calling `POST /auth/refresh` with the stored `refreshToken`
   - If refresh succeeds: stores new tokens, retries the original request
   - If refresh fails: clears all auth data and redirects to `/login`

**Why this pattern:** Users stay logged in for up to 7 days without re-entering credentials. The short-lived access token limits the window of vulnerability, while the refresh token provides a seamless experience.

---

## OAuth Social Media Integration

Influencers can link their YouTube, Instagram, and TikTok accounts to showcase their reach and follower counts.

### Architecture: Adapter Pattern

Each social media platform has its own **OAuth Adapter** class that extends a base `OAuthAdapter`:

```
OAuthAdapter (base class)
├── YouTubeAdapter    → Google OAuth 2.0 + YouTube Data API v3
├── InstagramAdapter  → Facebook/Instagram Graph API
└── TikTokAdapter     → TikTok Login Kit v2
```

Each adapter implements three methods:

| Method | Purpose |
|--------|---------|
| `getAuthUrl(state)` | Builds the OAuth authorization URL for the platform |
| `exchangeCode(code)` | Exchanges the authorization code for access/refresh tokens |
| `getProfile(accessToken)` | Fetches the user's profile (username, followers) from the platform API |

### Why the Adapter Pattern?

Adding a new social media platform requires only creating a new adapter class — no changes to controllers, routes, or middleware. The `oauthController` doesn't know or care which platform it's working with; it just calls `adapter.getAuthUrl()`, `adapter.exchangeCode()`, and `adapter.getProfile()`.

### OAuth Flow

```
1. START (GET /api/oauth/:provider/start)
   └─ Server generates a state token (userId + random nonce, base64-encoded)
   └─ Gets authorization URL from adapter
   └─ Returns { authUrl } to client

2. REDIRECT
   └─ Client opens authUrl in browser
   └─ User logs into the platform and grants permissions
   └─ Platform redirects to GET /api/oauth/:provider/callback?code=...&state=...

3. CALLBACK (GET /api/oauth/:provider/callback)
   └─ Server decodes state to extract userId
   └─ Exchanges code for tokens via adapter.exchangeCode(code)
   └─ Fetches profile via adapter.getProfile(accessToken)
   └─ Upserts SocialAccount (stores tokens securely)
   └─ Updates InfluencerProfile.linkedPlatforms (adds platform summary)
   └─ Redirects to frontend: /influencer/profile?linked=youtube

4. UNLINK (DELETE /api/oauth/:provider/unlink)
   └─ Deletes SocialAccount document
   └─ Removes entry from InfluencerProfile.linkedPlatforms
```

### Mock Mode

When OAuth credentials are not configured (empty in `.env`), each adapter falls back to **mock mode** — it returns fake tokens and profile data. This allows development and testing without setting up real OAuth applications.

### Platform-Specific Details

**YouTube (Google OAuth 2.0)**
- Scope: `youtube.readonly`
- API: YouTube Data API v3 (`/youtube/v3/channels?part=snippet,statistics&mine=true`)
- Returns: channel title, subscriber count

**Instagram (Graph API)**
- Scope: `instagram_business_basic`
- API: Instagram Graph API (`/me?fields=id,username,followers_count`)
- Note: Requires Facebook Developer app review for production use

**TikTok (Login Kit v2)**
- Scopes: `user.info.basic`, `user.info.stats`
- API: TikTok Open API v2 (`/v2/user/info/`)
- Note: Requires TikTok Developer account approval

---

## Frontend Application

### State Management

The app uses **React Context API** — no Redux or external state library.

**`AuthContext`** provides:

| Value | Type | Description |
|-------|------|-------------|
| `user` | Object or null | Current user (`{ name, email, role, status }`) |
| `loading` | Boolean | Whether initial auth check is in progress |
| `login(email, password)` | Function | Authenticates user, stores tokens |
| `logout()` | Function | Clears tokens, redirects to homepage |

On app mount, `AuthContext` reads tokens from `localStorage` and calls `GET /api/auth/me` to verify they're still valid. This rehydrates the user state without requiring a fresh login.

**Why Context API instead of Redux:** The only global state is the authenticated user. Context API handles this cleanly without the boilerplate of Redux actions, reducers, and store configuration.

### Routing Structure

**Public routes** (no authentication required):

| Path | Page | Description |
|------|------|-------------|
| `/` | Landing | Homepage with Hero, Features sections |
| `/login` | Login | Email/password login form |
| `/apply` | Apply | Choose role (Hotel Owner or Influencer) |
| `/apply/hotel-owner` | ApplyHotelOwner | Hotel owner registration form |
| `/apply/influencer` | ApplyInfluencer | Influencer registration form |
| `/verify-email` | VerifyEmail | Processes email verification token |
| `/admin` | AdminLogin | Admin-specific login page |

**Protected routes** (requires authentication + correct role):

| Path | Page | Role | Description |
|------|------|------|-------------|
| `/owner` | OwnerDashboard | hotel_owner | Stats overview |
| `/owner/profile` | OwnerProfile | hotel_owner | Company info form |
| `/owner/hotels` | OwnerHotels | hotel_owner | Hotel listing management |
| `/owner/collaborations` | OwnerCollaborations | hotel_owner | Collaboration requests |
| `/owner/settings` | OwnerSettings | hotel_owner | Password change, account deletion |
| `/influencer` | InfluencerDashboard | influencer | Stats overview |
| `/influencer/profile` | InfluencerProfile | influencer | Bio + social media linking |
| `/influencer/campaigns` | InfluencerCampaigns | influencer | Browse campaigns |
| `/influencer/applications` | InfluencerApplications | influencer | Track applications |
| `/influencer/settings` | InfluencerSettings | influencer | Password change, account deletion |
| `/admin/dashboard` | AdminDashboard | admin | Platform statistics |
| `/admin/users` | AdminUsers | admin | User management table |

### Route Protection (`utils/guards.js`)

The `ProtectedRoute` component wraps protected routes and checks:
1. Is the user authenticated? → If not, redirect to `/login`
2. Is the user banned? → If yes, redirect to `/login`
3. Does the user have the required role? → If not, redirect to `/`

### Dashboard Layout

All dashboard pages share a common layout:

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (260px)  │  Topbar (user info + logout)      │
│                  │───────────────────────────────────│
│  Logo            │                                   │
│  Nav Link 1      │  Page Content                     │
│  Nav Link 2      │  (rendered via <Outlet />)        │
│  Nav Link 3      │                                   │
│  Nav Link 4      │                                   │
│  Nav Link 5      │                                   │
│                  │                                   │
└──────────────────────────────────────────────────────┘
```

Each role has its own set of nav items defined in `App.js`:
- **Hotel Owner:** Dashboard, Profile, Hotels, Collaborations, Settings
- **Influencer:** Dashboard, Profile, Campaigns, Applications, Settings
- **Admin:** Dashboard, Users

### UI Component Library

All components use **styled-components** with a centralized theme.

#### Button (`components/ui/Button.js`)

| Prop | Values | Description |
|------|--------|-------------|
| `$variant` | `primary`, `secondary`, `ghost`, `danger` | Visual style |
| `$size` | `sm`, `md`, `lg` | Padding and font size |
| `$fullWidth` | Boolean | 100% width |

Colors: primary = teal `#14B8A6`, secondary = indigo `#6366F1`, danger = red `#FB7185`

#### Card (`components/ui/Card.js`)

White surface with rounded corners, light shadow, and border. Accepts custom `$padding`.

#### Input (`components/ui/Input.js`)

Exports `Input`, `InputWrapper`, `Label`, and `ErrorText`. Teal focus ring. Supports `as="textarea"`.

#### Modal (`components/ui/Modal.js`)

Full-screen overlay with centered modal box (max-width 480px). Click-outside-to-close. Props: `isOpen`, `onClose`, `children`.

#### Badge (`components/ui/Badge.js`)

Status pill with variants: `active` (green), `banned` (red), `pending` (yellow), `info` (blue).

### Design System (`styles/theme.js`)

| Category | Values |
|----------|--------|
| **Primary color** | Teal: `#14B8A6` (light: `#2DD4BF`, dark: `#0D9488`) |
| **Secondary color** | Indigo: `#6366F1` |
| **Accent color** | Red/Pink: `#FB7185` |
| **Font family** | Poppins (Google Fonts) |
| **Font sizes** | xs (12px) to 4xl (36px) |
| **Spacing** | xs (4px) to 3xl (64px) |
| **Border radius** | sm (6px), md (10px), lg (14px), xl (20px), full (9999px) |
| **Breakpoints** | sm: 640px, md: 768px, lg: 1024px, xl: 1280px |
| **Sidebar width** | 260px (collapsed: 72px) |
| **Topbar height** | 64px |

---

## Security

### Why each security measure is used:

| Measure | Implementation | Why |
|---------|---------------|-----|
| **Password hashing** | Bcrypt with 12 salt rounds | Passwords are never stored in plaintext. Bcrypt is deliberately slow to resist brute-force attacks. 12 rounds balances security and performance. |
| **JWT authentication** | Access (15m) + Refresh (7d) tokens | Short-lived access tokens limit damage if intercepted. Refresh tokens allow long sessions without storing passwords client-side. |
| **Server-side token revocation** | Refresh token stored in User document | Enables immediate logout/ban — clearing the stored token prevents refresh even if the client still has the token. |
| **Rate limiting** | 100 req/15min general, 20 req/15min auth | Prevents brute-force password attacks and API abuse. Auth endpoints have stricter limits because they're high-value targets. |
| **Helmet** | HTTP security headers | Sets headers like `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` to prevent common web attacks (clickjacking, MIME sniffing, etc.). |
| **CORS** | Configured with `CLIENT_URL` origin | Only the frontend domain can make cross-origin requests to the API, preventing unauthorized third-party sites from calling the API. |
| **Input validation (Zod)** | Schema validation on all endpoints | Validates and sanitizes all input before it reaches business logic. Prevents malformed data, type coercion attacks, and enforces constraints (max length, email format, etc.). |
| **MongoDB sanitization** | express-mongo-sanitize | Strips `$` and `.` from request body/query/params to prevent NoSQL injection attacks (e.g., `{ "$gt": "" }` in a password field). |
| **Role-based access control** | `roleGuard` middleware | Ensures hotel owners can't access admin endpoints, influencers can't manage hotels, etc. Checked at the middleware layer before controllers execute. |
| **OAuth state parameter** | Base64-encoded userId + nonce | Prevents CSRF attacks during the OAuth flow. The state parameter ties the OAuth callback to a specific user session. |
| **Separate token storage** | SocialAccount model | OAuth tokens (sensitive credentials) are stored in their own collection, separate from profile data. Profile reads don't accidentally expose tokens. |

---

## Server-Side Functions Reference

### Controllers

#### `authController.js`

| Function | Route | Description |
|----------|-------|-------------|
| `register` | POST /api/auth/register | Validates input, hashes password, creates user + role profile, sends verification email |
| `verifyEmail` | GET /api/auth/verify-email | Finds token, activates user, deletes verification tokens |
| `login` | POST /api/auth/login | Validates credentials, checks status, generates JWT pair |
| `refresh` | POST /api/auth/refresh | Verifies refresh token, issues new JWT pair |
| `logout` | POST /api/auth/logout | Clears stored refresh token |
| `me` | GET /api/auth/me | Returns current user data (id, name, email, role, status) |

#### `oauthController.js`

| Function | Route | Description |
|----------|-------|-------------|
| `startOAuth` | GET /api/oauth/:provider/start | Generates state, returns authorization URL |
| `handleCallback` | GET /api/oauth/:provider/callback | Exchanges code for tokens, fetches profile, updates records |
| `unlinkPlatform` | DELETE /api/oauth/:provider/unlink | Removes SocialAccount and platform entry from profile |

#### `hotelController.js`

| Function | Route | Description |
|----------|-------|-------------|
| `createHotel` | POST /api/hotels | Creates hotel with ownerId = req.user._id |
| `getMyHotels` | GET /api/hotels | Finds all hotels where ownerId = req.user._id |
| `getHotel` | GET /api/hotels/:id | Finds hotel by ID, verifies ownership |
| `updateHotel` | PUT /api/hotels/:id | Finds hotel by ID + ownerId, applies updates |
| `deleteHotel` | DELETE /api/hotels/:id | Finds hotel by ID + ownerId, deletes it |

#### `adminController.js`

| Function | Route | Description |
|----------|-------|-------------|
| `listUsers` | GET /api/admin/users | Paginated user list with role/status filters |
| `banUser` | POST /api/admin/users/:id/ban | Sets status=banned, clears refreshToken, logs action |
| `unbanUser` | POST /api/admin/users/:id/unban | Restores status (active or pending), logs action |

### Middleware

| Function | File | Description |
|----------|------|-------------|
| `authenticate` | middleware/auth.js | Extracts JWT from `Authorization` header, verifies signature, loads user from DB, rejects banned users, attaches `req.user` |
| `roleGuard(...roles)` | middleware/roleGuard.js | Higher-order function that returns middleware checking `req.user.role` against allowed roles |
| `validate(schema)` | middleware/validate.js | Higher-order function that returns middleware validating `req.body` against a Zod schema |
| `errorHandler` | middleware/errorHandler.js | Express error handler (4-arg middleware) that catches unhandled errors and returns JSON |

### Services

| Function | File | Description |
|----------|------|-------------|
| `generateAccessToken(user)` | services/tokenService.js | Creates JWT with `{ sub: userId, role }`, expires in 15m |
| `generateRefreshToken(user)` | services/tokenService.js | Creates JWT with `{ sub: userId }`, expires in 7d |
| `verifyRefreshToken(token)` | services/tokenService.js | Verifies JWT signature and returns decoded payload |
| `sendVerificationEmail(user)` | services/emailService.js | Generates 32-byte token, stores in DB (24h TTL), logs verification URL to console |

### Validators (Zod Schemas)

| Schema | File | Fields |
|--------|------|--------|
| `registerSchema` | validators/authValidators.js | name (2-100), email, password (8-128), role (hotel_owner \| influencer) |
| `loginSchema` | validators/authValidators.js | email, password (min 1) |
| `refreshSchema` | validators/authValidators.js | refreshToken (string) |
| `createHotelSchema` | validators/hotelValidators.js | name (2-200), description (max 1000), location (max 200), starRating (1-5), amenities ([string]), contactEmail |
| `updateHotelSchema` | validators/hotelValidators.js | Same as create but all fields optional |

### Configuration

| Function | File | Description |
|----------|------|-------------|
| `connectDB` | config/db.js | Connects to MongoDB using `MONGO_URI`, logs connection host |
| `env` (object) | config/env.js | Centralized export of all environment variables with defaults |

### Scripts

| Script | File | Description |
|--------|------|-------------|
| `seedAdmin` | scripts/seedAdmin.js | Creates admin user if not exists (email: `admin@hotelcollab.dev`, password: `admin12345`) |

---

## Client-Side Components Reference

### Contexts & Hooks

| Name | File | Description |
|------|------|-------------|
| `AuthProvider` | contexts/AuthContext.js | Provides `user`, `loading`, `login()`, `logout()` to the component tree |
| `useAuth()` | hooks/useAuth.js | Consumes AuthContext, throws if used outside provider |

### API Layer

| Name | File | Description |
|------|------|-------------|
| `api` (axios instance) | api/axios.js | Pre-configured Axios with base URL, auth interceptor, and 401 silent refresh |

### Pages (with key functions)

| Page | Key Behaviors |
|------|---------------|
| `Landing` | Renders Header + Hero + Features. Links to /apply and /login |
| `Login` | Form submission calls `login(email, password)`. Redirects by role: hotel_owner → /owner, influencer → /influencer |
| `Apply` | Two cards linking to /apply/hotel-owner and /apply/influencer |
| `ApplyHotelOwner` | POST /auth/register with role='hotel_owner'. Shows success message on completion |
| `ApplyInfluencer` | POST /auth/register with role='influencer'. Mentions social linking after verification |
| `VerifyEmail` | Reads `token` from URL params, GET /auth/verify-email. Three states: verifying, success, error |
| `AdminLogin` | Same as Login but checks role=admin, uses secondary styling |
| `OwnerDashboard` | Displays stats cards (Total Hotels, Active Collaborations, Pending Requests) |
| `OwnerProfile` | Form for company info (not yet wired to API) |
| `OwnerHotels` | **Fully functional:** Fetches GET /hotels, creates via modal POST /hotels, deletes via DELETE /hotels/:id |
| `OwnerCollaborations` | Placeholder — "No collaboration requests yet" |
| `OwnerSettings` | Password change and delete account forms (not yet wired to API) |
| `InfluencerDashboard` | Displays stats cards (Linked Platforms, Applications, Collaborations) |
| `InfluencerProfile` | **Fully functional:** Bio form + platform linking via GET /oauth/:provider/start and DELETE /oauth/:provider/unlink |
| `InfluencerCampaigns` | Placeholder — "No campaigns available yet" |
| `InfluencerApplications` | Placeholder — "You haven't applied to any campaigns yet" |
| `InfluencerSettings` | Password change and delete account forms (not yet wired to API) |
| `AdminDashboard` | Displays stats cards (Total Users, Hotel Owners, Influencers, Banned) |
| `AdminUsers` | **Fully functional:** GET /admin/users with role filter, ban/unban actions |

---

## Environment Variables

### Server (`server/.env`)

```env
# Server
PORT=5000                                    # Express port

# Database
MONGO_URI=mongodb://localhost:27017/hotel-influencer  # MongoDB connection string

# JWT
JWT_ACCESS_SECRET=change-this-access-secret  # Secret for signing access tokens
JWT_REFRESH_SECRET=change-this-refresh-secret # Secret for signing refresh tokens
JWT_ACCESS_EXPIRES=15m                       # Access token lifetime
JWT_REFRESH_EXPIRES=7d                       # Refresh token lifetime

# Client
CLIENT_URL=http://localhost:3000             # Frontend URL (for CORS + email links)

# Email
EMAIL_FROM=noreply@hotelcollab.dev           # Sender address for emails

# OAuth — leave empty to use mock adapters
GOOGLE_CLIENT_ID=                            # Google/YouTube OAuth client ID
GOOGLE_CLIENT_SECRET=                        # Google/YouTube OAuth client secret
INSTAGRAM_CLIENT_ID=                         # Instagram/Facebook app ID
INSTAGRAM_CLIENT_SECRET=                     # Instagram/Facebook app secret
TIKTOK_CLIENT_KEY=                           # TikTok developer client key
TIKTOK_CLIENT_SECRET=                        # TikTok developer client secret
```

### Client

The client uses Create React App's environment variable convention (`REACT_APP_` prefix):

```env
REACT_APP_API_URL=http://localhost:5001/api  # Backend API base URL (default if not set)
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (running locally or a cloud instance like MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd hotel-influencer-platform

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running in Development

```bash
# Terminal 1: Start the server (port 5000/5001)
cd server
npm run dev

# Terminal 2: Start the client (port 3000)
cd client
npm start
```

### Seed Admin User

```bash
cd server
npm run seed:admin
# Creates admin@hotelcollab.dev with password admin12345
```

### Production Build

```bash
cd client
npm run build
# Output in client/build/ — serve with any static file server
```

---

## Current Status & Missing Features

### Fully Implemented

- User registration with email verification
- JWT authentication with access/refresh tokens and silent refresh
- Hotel owner: create, list, and delete hotels
- Influencer: link/unlink YouTube, Instagram, TikTok accounts via OAuth
- Admin: list users with filters, ban/unban users
- Role-based route protection (frontend and backend)
- Complete UI component library and design system
- Landing page with Hero and Features sections

### Placeholder / Not Yet Implemented

| Feature | Current State |
|---------|--------------|
| Hotel editing | Edit button exists in UI but no handler is wired |
| Profile updates | Owner and influencer profile forms exist but don't submit to API |
| Password change | Form exists in settings pages but not functional |
| Account deletion | Delete button exists but not connected |
| Campaign browsing | Influencer campaigns page shows empty state |
| Application tracking | Influencer applications page shows empty state |
| Collaboration management | Owner collaborations page shows empty state |
| Dashboard statistics | All dashboard stat cards show placeholder values (0 or --) |
| Real email sending | Verification emails are logged to console (no SMTP/SendGrid integration) |
| Search and filtering | No search across hotels or influencers |
| Pagination | User tables and hotel lists don't paginate |
| Image uploads | Hotel images field exists in schema but no upload mechanism |
| Test suite | No tests (no Jest, Mocha, or any testing framework) |
| Docker | No containerization |
| CI/CD | No automated pipelines |
