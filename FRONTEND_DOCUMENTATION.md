# Hotel Influencer Platform - Complete Frontend Documentation

## Table of Contents

1. [Technology Stack & Tools](#technology-stack--tools)
2. [Project Architecture](#project-architecture)
3. [Core Infrastructure Files](#core-infrastructure-files)
4. [Context & State Management](#context--state-management)
5. [Reusable UI Components](#reusable-ui-components)
6. [Layout Components](#layout-components)
7. [Landing Page Components](#landing-page-components)
8. [Public Pages (Authentication & Registration)](#public-pages-authentication--registration)
9. [Hotel Owner Pages](#hotel-owner-pages)
10. [Influencer Pages](#influencer-pages)
11. [Shared Pages (Messaging)](#shared-pages-messaging)
12. [Admin Pages](#admin-pages)
13. [Campaign System Components](#campaign-system-components)
14. [Backend API Endpoints Reference](#backend-api-endpoints-reference)
15. [Database Models Reference](#database-models-reference)
16. [Real-Time Communication (Socket.io)](#real-time-communication-socketio)
17. [OAuth Integration](#oauth-integration)
18. [Deployment & Environment Variables](#deployment--environment-variables)

---

## Technology Stack & Tools

### Frontend Technologies

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | Core UI library with functional components and hooks |
| **Create React App** | - | Project scaffolding, build tool (Webpack, Babel under the hood) |
| **React Router** | v6 | Client-side routing with nested layouts, `<Outlet>`, `useParams`, `useNavigate` |
| **styled-components** | 6 | CSS-in-JS styling with theme support and transient props (`$variant`) |
| **Axios** | - | HTTP client with interceptors for JWT auto-attach and token refresh |
| **Socket.io Client** | - | Real-time WebSocket connection for messaging and notifications |

### Backend Technologies

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | - | Server runtime |
| **Express.js** | 4.21 | REST API framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 8.8 | MongoDB ODM (Object Document Mapping) with schemas and validation |
| **Socket.io** | - | Real-time bidirectional event-based communication |
| **JSON Web Tokens (JWT)** | - | Authentication (access token 15min + refresh token 7 days) |
| **Zod** | - | Server-side request body/params validation |
| **Multer** | - | File upload handling (hotel images, influencer avatars) |
| **Nodemailer** | - | Email delivery (verification, password reset, admin invites) |
| **bcryptjs** | - | Password hashing |
| **crypto** | - | Token generation for email verification, password reset |

### Key Design Patterns

- **Controller Pattern**: Each backend route delegates to a controller function (`exports.methodName = async (req, res) => { try/catch }`)
- **Middleware Chaining**: Routes use `auth` (JWT verify) → `roleGuard(roles...)` → `validate(schema)` → controller
- **Context + Hooks**: Frontend uses React Context for global state (Auth, Socket) exposed via custom hooks
- **Transient Props**: styled-components use `$` prefix for props that shouldn't pass to DOM (e.g., `$variant`, `$size`)

---

## Project Architecture

```
hotel-influencer-platform/
├── client/                          # React Frontend (CRA)
│   ├── public/                      # Static assets (logos, images)
│   └── src/
│       ├── api/
│       │   └── axios.js             # Axios instance with JWT interceptors
│       ├── components/
│       │   ├── campaigns/           # Campaign-related reusable components
│       │   ├── landing/             # Landing page sections
│       │   ├── layout/              # Dashboard layout, sidebar, topbar
│       │   └── ui/                  # Button, Card, Badge, Input, Modal
│       ├── contexts/
│       │   ├── AuthContext.js        # Authentication state
│       │   └── SocketContext.js      # Socket.io connection state
│       ├── hooks/
│       │   ├── useAuth.js           # Shortcut hook for AuthContext
│       │   └── useSocket.js         # Shortcut hook for SocketContext
│       ├── pages/
│       │   ├── admin/               # Admin dashboard pages
│       │   ├── influencer/          # Influencer dashboard pages
│       │   ├── owner/               # Hotel owner dashboard pages
│       │   ├── shared/              # Shared pages (Messages, ChatPanel)
│       │   ├── Landing.js           # Public landing page
│       │   ├── Login.js             # User login
│       │   ├── Apply.js             # Role selection
│       │   └── ...                  # Other public pages
│       ├── styles/
│       │   ├── theme.js             # Theme config (colors, spacing, typography)
│       │   └── GlobalStyles.js      # CSS reset and global styles
│       ├── utils/
│       │   └── guards.js            # ProtectedRoute component
│       ├── App.js                   # Root component with all routes
│       └── index.js                 # ReactDOM entry point
│
└── server/                          # Express Backend
    ├── scripts/
    │   └── seedAdmin.js             # Admin seed script
    └── src/
        ├── app.js                   # Express app + HTTP server + Socket.io init
        ├── config/
        │   ├── db.js                # MongoDB connection
        │   └── env.js               # Environment variable loader
        ├── controllers/             # Route handlers
        ├── middleware/
        │   ├── auth.js              # JWT verification + banned check
        │   ├── roleGuard.js         # Role-based access control
        │   ├── validate.js          # Zod schema validation
        │   └── errorHandler.js      # Global error handler
        ├── models/                  # Mongoose schemas
        ├── routes/                  # Express routers
        ├── services/
        │   ├── emailService.js      # Nodemailer email sending
        │   ├── tokenService.js      # JWT sign/verify helpers
        │   └── oauth/               # OAuth adapters (YouTube, Instagram, TikTok)
        ├── socket/
        │   ├── index.js             # Socket.io initialization + JWT auth
        │   └── chatHandler.js       # Real-time message events
        └── validators/              # Zod validation schemas
```

---

## Core Infrastructure Files

### `client/src/App.js` - Root Component & Routing

**File**: [App.js](client/src/App.js)

This is the main entry point that wraps the entire app with providers and defines all routes.

**How it works:**

```
ThemeProvider (styled-components theme)
  └─ GlobalStyles (CSS reset)
     └─ AuthProvider (login/logout/user state)
        └─ SocketProvider (Socket.io connection)
           └─ BrowserRouter
              └─ Routes (all page routes)
```

**Route Structure:**

| Route Pattern | Component | Protection |
|---|---|---|
| `/` | `Landing` | Public |
| `/login` | `Login` | Public |
| `/apply` | `Apply` | Public |
| `/apply/hotel-owner` | `ApplyHotelOwner` | Public |
| `/apply/influencer` | `ApplyInfluencer` | Public |
| `/verify-email` | `VerifyEmail` | Public |
| `/forgot-password` | `ForgotPassword` | Public |
| `/reset-password` | `ResetPassword` | Public |
| `/privacy-policy` | `PrivacyPolicy` | Public |
| `/terms-conditions` | `TermsConditions` | Public |
| `/admin/setup-password` | `AdminSetupPassword` | Public (token-gated) |
| `/owner/*` | Owner pages | `ProtectedRoute role="hotel_owner"` |
| `/influencer/*` | Influencer pages | `ProtectedRoute role="influencer"` |
| `/admin` | `AdminLogin` | Public |
| `/admin/*` | Admin pages | `ProtectedRoute role="admin"` |

**Layout Wrappers (`OwnerLayout` / `InfluencerLayout`):**

These are defined inside `App.js` and wrap DashboardLayout with dynamic navigation badges:

```javascript
const OwnerLayout = () => {
  const { unreadCount } = useSocket();          // Live unread message count
  const pendingCampaigns = usePendingCampaigns(); // Pending campaign applications
  const navItems = [
    { to: '/owner', label: 'Dashboard', end: true },
    { to: '/owner/messages', label: 'Messages', badge: unreadCount },
    { to: '/owner/collaborations', label: 'Collaborations', badge: pendingCampaigns },
    // ...
  ];
  return <DashboardLayout navItems={navItems} />;
};
```

**Backend Connection**: The `usePendingCampaigns()` hook calls `GET /api/campaigns/stats` on mount to fetch the count of pending campaign applications. The unread count comes from `GET /api/chat/unread-count` (fetched in SocketContext).

---

### `client/src/api/axios.js` - HTTP Client Configuration

**File**: [axios.js](client/src/api/axios.js)

Creates a configured Axios instance used by every page for API calls.

**How it works:**

1. **Base URL**: Set from `REACT_APP_API_URL` environment variable (e.g., `http://localhost:5001/api`)
2. **Request Interceptor**: Before every request, reads `accessToken` from `localStorage` and attaches it as `Authorization: Bearer <token>`
3. **Response Interceptor**: On `401 Unauthorized`:
   - Reads `refreshToken` from localStorage
   - Calls `POST /auth/refresh` to get a new access token
   - Retries the original failed request with the new token
   - If refresh also fails, clears localStorage and redirects to `/login`

**Backend Connection**: Works with `server/src/middleware/auth.js` which verifies the JWT on every protected endpoint. The refresh endpoint is `POST /api/auth/refresh` handled by `authController.refresh`.

---

### `client/src/styles/theme.js` - Theme Configuration

**File**: [theme.js](client/src/styles/theme.js)

Defines the visual design system used across all styled-components.

| Category | Key Values |
|---|---|
| **Primary Color** | `#14B8A6` (Teal) |
| **Secondary Color** | `#6366F1` (Indigo) |
| **Accent Color** | `#FB7185` (Pink) |
| **Font Family** | Poppins |
| **Font Sizes** | xs (0.75rem) to 6xl (3.75rem) |
| **Spacing Scale** | xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px) |
| **Breakpoints** | sm: 640px, md: 768px, lg: 1024px, xl: 1280px |
| **Border Radius** | sm to full (for circles) |
| **Shadows** | sm to xl for card elevation |
| **Sidebar** | 260px width (72px collapsed) |

---

### `client/src/styles/GlobalStyles.js` - CSS Reset & Globals

**File**: [GlobalStyles.js](client/src/styles/GlobalStyles.js)

Uses `createGlobalStyle` from styled-components to apply:
- CSS reset (box-sizing, margin, padding)
- Theme-based body background and text colors
- Font family from theme
- Smooth scrolling behavior

---

## Context & State Management

### `client/src/contexts/AuthContext.js` - Authentication State

**File**: [AuthContext.js](client/src/contexts/AuthContext.js)

**State Managed:**
- `user` - The authenticated user object (`{ _id, name, email, role }`)
- `loading` - Whether initial auth check is in progress

**Methods:**
- `login(email, password)` - Calls `POST /api/auth/login`, stores `accessToken`, `refreshToken`, and `user` in localStorage
- `logout()` - Clears localStorage and redirects to `/`

**Initialization Flow:**
1. On app mount, reads `accessToken` from localStorage
2. Calls `GET /api/auth/me` to validate the token and get current user
3. If valid, sets `user` state; if invalid, clears tokens

**Backend Connection:**
- `POST /api/auth/login` → `authController.login` - Validates credentials, returns tokens + user
- `GET /api/auth/me` → `authController.me` - Returns current user from JWT
- Access token expires in 15 minutes, refresh token in 7 days

---

### `client/src/contexts/SocketContext.js` - Real-Time Connection

**File**: [SocketContext.js](client/src/contexts/SocketContext.js)

**State Managed:**
- `socket` - The Socket.io client instance
- `unreadCount` - Total unread messages across all conversations

**Methods:**
- `setUnreadCount` - Direct setter for unread count
- `decrementUnread(n)` - Subtracts n from unread count (used when reading messages)

**How it works:**
1. When `user` exists (from AuthContext), establishes Socket.io connection with `auth: { token: accessToken }`
2. Fetches initial unread count from `GET /api/chat/unread-count`
3. The socket instance is shared to all child components via context

**Backend Connection:**
- Socket server at `server/src/socket/index.js` uses JWT middleware to authenticate connections
- `GET /api/chat/unread-count` → `chatController.getUnreadCount` - Returns total unread messages

---

## Reusable UI Components

### `client/src/components/ui/Button.js`

**File**: [Button.js](client/src/components/ui/Button.js)

A styled button component with variants and sizes.

**Props:**
| Prop | Values | Description |
|---|---|---|
| `$variant` | `primary`, `secondary`, `ghost`, `danger` | Visual style |
| `$size` | `sm`, `md`, `lg` | Button size |
| `$fullWidth` | `boolean` | Full width button |

**Used in**: Every page for actions (Submit, Cancel, Save, Delete, etc.)

---

### `client/src/components/ui/Card.js`

**File**: [Card.js](client/src/components/ui/Card.js)

A container component with border, shadow, border-radius, and padding.

**Props:**
| Prop | Description |
|---|---|
| `$padding` | Custom padding (default from theme). Use `"0"` for table cards |

**Used in**: Dashboard stats, forms, tables, profile sections

---

### `client/src/components/ui/Badge.js`

**File**: [Badge.js](client/src/components/ui/Badge.js)

Status indicator badges with colored backgrounds.

**Props:**
| Prop | Values |
|---|---|
| `$variant` | `active` (green), `banned` (red), `pending` (yellow), `info` (blue) |

**Used in**: User status, campaign status, availability indicators, collaboration types

---

### `client/src/components/ui/Input.js`

**File**: [Input.js](client/src/components/ui/Input.js)

Styled input component with companion components.

**Exported components:**
- `Input` (default) - The input element
- `InputWrapper` - Form field container
- `Label` - Field label
- `ErrorText` - Red error message text

**Used in**: Login, Register, Profile edit, Hotel forms, Settings

---

### `client/src/components/ui/Modal.js`

**File**: [Modal.js](client/src/components/ui/Modal.js)

Overlay modal with backdrop click-to-close.

**Props:**
| Prop | Description |
|---|---|
| `onClose` | Function called when modal should close |
| `children` | Modal content |

**Used in**: Campaign cancel confirmation, hotel preview, profile preview

---

## Layout Components

### `client/src/components/layout/DashboardLayout.js`

**File**: [DashboardLayout.js](client/src/components/layout/DashboardLayout.js)

Main authenticated layout with sidebar navigation and top bar.

**Props:**
| Prop | Description |
|---|---|
| `logoSrc` | Path to logo image |
| `logoText` | Text next to logo |
| `navItems` | Array of `{ to, label, end?, badge? }` |

**Structure:**
```
┌─────────────────────────────────────┐
│  Topbar (64px)                      │
├──────────┬──────────────────────────┤
│ Sidebar  │  <Outlet />             │
│ (260px)  │  (nested page content)  │
│          │                          │
│ Nav      │                          │
│ Items    │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

**How it works**: Uses React Router's `<Outlet />` to render child routes. Navigation items are passed from the parent layout wrapper (OwnerLayout/InfluencerLayout) which injects dynamic badge counts.

---

### `client/src/components/layout/Sidebar.js`

**File**: [Sidebar.js](client/src/components/layout/Sidebar.js)

Fixed 260px sidebar with logo and navigation links.

**Features:**
- Logo with text at the top
- Navigation links using React Router's `<NavLink>` with active styling
- Badge display (red dot with count) for items with `badge > 0`
- Responsive (hides on mobile)

---

### `client/src/components/layout/Topbar.js`

**File**: [Topbar.js](client/src/components/layout/Topbar.js)

Sticky 64px header bar.

**Features:**
- Displays current user's name and role
- Logout button that calls `logout()` from AuthContext

---

### `client/src/components/layout/PageHeader.js`

**File**: [PageHeader.js](client/src/components/layout/PageHeader.js)

Reusable page title component.

**Props:**
- `title` - Main heading text
- `subtitle` - Secondary description text

**Used in**: Every dashboard page as the first element

---

### `client/src/components/layout/Container.js`

**File**: [Container.js](client/src/components/layout/Container.js)

Centered max-width wrapper (1200px default) with horizontal padding.

**Props:**
- `$maxWidth` - Custom max width

**Used in**: Public pages (Login, Apply, Landing sections)

---

## Landing Page Components

### `client/src/pages/Landing.js`

**File**: [Landing.js](client/src/pages/Landing.js)

Assembles all landing page sections into one public page.

**Structure:**
```
Header (navigation bar)
Hero (full-screen hero section)
Aboutus (about the platform)
Features (how it works steps)
Contactus (contact form)
Footer (privacy/terms links)
```

**Backend Connection**: None directly (sub-components may have their own API calls).

---

### `client/src/components/landing/Header.js`

**File**: [Header.js](client/src/components/landing/Header.js)

Public navigation bar with smooth-scrolling anchor links.

**Features:**
- Logo
- Navigation: About, How It Works, Contact Us (smooth scroll to sections)
- "Log In" and "Apply Now" buttons linking to `/login` and `/apply`
- Mobile responsive hamburger menu

---

### `client/src/components/landing/Hero.js`

**File**: [Hero.js](client/src/components/landing/Hero.js)

Full-screen hero section with animated elements.

**Features:**
- Gradient blur background effects
- Animated floating avatar bubbles (using `@keyframes float`)
- Dashboard preview cards (Hotels, Analytics, Influencers)
- "Get Started" and "Discover Influencers" call-to-action buttons
- `fadeInUp` animation for content entrance

**Backend Connection**: None (purely presentational).

---

### `client/src/components/landing/Aboutus.js`

**File**: [Aboutus.js](client/src/components/landing/Aboutus.js)

About section with split layout.

**Features:**
- Left side: Image with floating stat cards (donut chart, trust card)
- Right side: Heading, description, feature list
- Gradient blob backgrounds
- "Get Started" call-to-action button

**Backend Connection**: None (static content).

---

### `client/src/components/landing/Features.js`

**File**: [Features.js](client/src/components/landing/Features.js)

"How It Works" section with 4 steps.

**Steps:**
1. **Apply** - Register and create your profile
2. **Discover** - Browse hotels or influencers
3. **Connect** - Message and discuss collaboration
4. **Collaborate** - Work together and create content

**Features:**
- Grid layout (responsive 1-4 columns)
- Animated entrance with stagger effect
- Colored icon backgrounds

---

### `client/src/components/landing/Contactus.js`

**File**: [Contactus.js](client/src/components/landing/Contactus.js)

Contact form with validation.

**Form Fields:**
- First Name, Last Name
- Email
- Phone (with country code dropdown supporting 20+ countries with flag emojis)
- Message (textarea with 500 character limit and counter)

**Backend Connection:**
- `POST /api/contact` → `contactController.submitContact`
- Sends the form data; backend uses `emailService` to forward the message
- Server-side validation via Zod (`contactValidators.js`)

---

## Public Pages (Authentication & Registration)

### `client/src/pages/Login.js`

**File**: [Login.js](client/src/pages/Login.js)

User login page.

**Form Fields:** Email, Password

**How it works:**
1. User fills email and password
2. On submit, calls `login(email, password)` from `useAuth()` hook
3. AuthContext calls `POST /api/auth/login` with credentials
4. On success, stores tokens in localStorage and redirects based on role:
   - `hotel_owner` → `/owner`
   - `influencer` → `/influencer`
   - `admin` → `/admin/dashboard`
5. On error, displays error message

**Backend Connection:**
- `POST /api/auth/login` → `authController.login`
  - Finds user by email
  - Compares password hash with bcrypt
  - Checks email verification status
  - Checks banned status
  - Returns `{ accessToken, refreshToken, user: { _id, name, email, role } }`

**Links:** "Forgot password?" → `/forgot-password`, "Apply now" → `/apply`

---

### `client/src/pages/Apply.js`

**File**: [Apply.js](client/src/pages/Apply.js)

Role selection page.

**How it works:**
- Displays two cards: "Hotel Owner" and "Influencer"
- Each card has an icon and description
- Clicking a card navigates to the role-specific registration form:
  - Hotel Owner → `/apply/hotel-owner`
  - Influencer → `/apply/influencer`

**Backend Connection**: None (navigation only).

---

### `client/src/pages/ApplyHotelOwner.js`

**File**: [ApplyHotelOwner.js](client/src/pages/ApplyHotelOwner.js)

Hotel owner registration form.

**Form Fields:** Full Name, Email, Password

**How it works:**
1. User fills registration form
2. On submit, calls `POST /api/auth/register` with `{ name, email, password, role: 'hotel_owner' }`
3. On success, shows email verification notice screen
4. User must click verification link in email before logging in

**Backend Connection:**
- `POST /api/auth/register` → `authController.register`
  - Creates `User` document with `status: 'pending_verification'`
  - Creates `HotelOwnerProfile` document linked to user
  - Generates `EmailVerificationToken` with 24h expiry
  - Sends verification email via `emailService.sendVerificationEmail()`

---

### `client/src/pages/ApplyInfluencer.js`

**File**: [ApplyInfluencer.js](client/src/pages/ApplyInfluencer.js)

Influencer registration form.

**Form Fields:** Display Name, Email, Password

**How it works:**
- Same flow as hotel owner registration but with `role: 'influencer'`
- Shows info note: "You'll be able to link your social platforms after email verification"

**Backend Connection:**
- `POST /api/auth/register` with `role: 'influencer'`
  - Creates `User` document
  - Creates `InfluencerProfile` document linked to user
  - Sends verification email

---

### `client/src/pages/VerifyEmail.js`

**File**: [VerifyEmail.js](client/src/pages/VerifyEmail.js)

Email verification handler.

**How it works:**
1. Reads `token` from URL query parameter (`/verify-email?token=abc123`)
2. On mount, calls `GET /api/auth/verify-email?token=abc123`
3. Shows one of three states:
   - **Verifying**: Spinner/loading message
   - **Success**: "Email verified!" with login link
   - **Error**: "Invalid or expired token" message

**Backend Connection:**
- `GET /api/auth/verify-email` → `authController.verifyEmail`
  - Finds `EmailVerificationToken` by token value
  - Checks expiry (24h)
  - Updates `User.isEmailVerified = true`, `User.status = 'active'`
  - Deletes the used token

---

### `client/src/pages/ForgotPassword.js`

**File**: [ForgotPassword.js](client/src/pages/ForgotPassword.js)

Password reset request page.

**Form Fields:** Email

**How it works:**
1. User enters email
2. Calls `POST /api/auth/forgot-password` with `{ email }`
3. Shows success message regardless (to prevent email enumeration)

**Backend Connection:**
- `POST /api/auth/forgot-password` → `authController.forgotPassword`
  - Finds user by email
  - Creates `PasswordResetToken` with 1h expiry
  - Sends reset email with link containing the token

---

### `client/src/pages/ResetPassword.js`

**File**: [ResetPassword.js](client/src/pages/ResetPassword.js)

New password entry after clicking reset link.

**Form Fields:** New Password, Confirm Password

**How it works:**
1. Reads `token` from URL query parameter
2. User enters and confirms new password
3. Calls `POST /api/auth/reset-password` with `{ token, password }`
4. On success, shows "Password reset successful" with login link

**Backend Connection:**
- `POST /api/auth/reset-password` → `authController.resetPassword`
  - Validates `PasswordResetToken`
  - Hashes new password with bcrypt
  - Updates `User.passwordHash`
  - Deletes the used token

---

### `client/src/pages/PrivacyPolicy.js` & `client/src/pages/TermsConditions.js`

**Files**: [PrivacyPolicy.js](client/src/pages/PrivacyPolicy.js), [TermsConditions.js](client/src/pages/TermsConditions.js)

Static content pages with styled sections. No API calls - purely informational.

---

## Hotel Owner Pages

### `client/src/pages/owner/OwnerDashboard.js`

**File**: [OwnerDashboard.js](client/src/pages/owner/OwnerDashboard.js)
**Route**: `/owner`

Dashboard overview with stats grid.

**Stats Displayed:**
| Stat | Source |
|---|---|
| Total Hotels | `GET /api/hotels` → count |
| Active Collaborations | `GET /api/campaigns/stats` → `activeCampaigns` |
| Pending Requests | `GET /api/campaigns/stats` → `pendingApplications` |
| Waiting for Approval | `GET /api/campaigns/stats` → `waitingForApproval` |
| Upcoming | `GET /api/campaigns/stats` → `upcoming` |
| Completed | `GET /api/campaigns/stats` → `completed` |

**Backend Connection:**
- `GET /api/hotels` → `hotelController.getAll` - Returns hotels owned by current user
- `GET /api/campaigns/stats` → `campaignController.getStats` - Returns campaign statistics for current user

**Code Flow:**
```
useEffect (on mount)
  ├── api.get('/campaigns/stats') → setStats(data)
  └── api.get('/hotels') → setHotels(data.hotels)
Render: StatsGrid with Card components showing each stat
```

---

### `client/src/pages/owner/OwnerProfile.js`

**File**: [OwnerProfile.js](client/src/pages/owner/OwnerProfile.js)
**Route**: `/owner/profile`

Hotel owner company profile management.

**Form Fields:** Company Name, Phone, Website, Location, Bio

**How it works:**
1. On mount, fetches current profile from `GET /api/owner/profile`
2. Populates form fields with existing data
3. User edits and clicks "Save"
4. Calls `PUT /api/owner/profile` with updated fields
5. Shows success/error message

**Backend Connection:**
- `GET /api/owner/profile` → `ownerProfileController.getProfile` - Returns HotelOwnerProfile for current user
- `PUT /api/owner/profile` → `ownerProfileController.updateProfile` - Updates HotelOwnerProfile fields

---

### `client/src/pages/owner/OwnerHotels.js`

**File**: [OwnerHotels.js](client/src/pages/owner/OwnerHotels.js)
**Route**: `/owner/hotels`

List of hotel owner's properties.

**Features:**
- Grid of hotel cards showing: feature image, hotel name, location, status badge (Active/Inactive)
- Action buttons per card: Preview, Edit, Delete
- "Add Hotel" button → navigates to `/owner/hotels/add`

**How it works:**
1. On mount, fetches `GET /api/hotels` → displays hotels as cards
2. Preview → navigates to `/owner/hotels/preview/:id`
3. Edit → navigates to `/owner/hotels/edit/:id`
4. Delete → confirmation dialog → `DELETE /api/hotels/:id` → refetch list

**Backend Connection:**
- `GET /api/hotels` → `hotelController.getAll` - Returns all hotels where `ownerId === req.user._id`
- `DELETE /api/hotels/:id` → `hotelController.delete` - Deletes hotel and its images

---

### `client/src/pages/owner/AddHotelListing.js`

**File**: [AddHotelListing.js](client/src/pages/owner/AddHotelListing.js)
**Route**: `/owner/hotels/add`

Complex form for creating a new hotel listing (~810 lines).

**Form Sections:**

**Section 1 - Basic Details:**
- Hotel Name (required)
- Location (required)
- City (required)
- Description (textarea, 1000 char limit)

**Section 2 - Hotel Images:**
- Drag-and-drop upload zone (max 5 images, JPEG/PNG/WebP, 5MB each)
- Image thumbnails with remove button
- Click to set Feature Image (highlighted with primary border)

**Section 3 - Collaboration Types:**
- Checkboxes: Free Stay, Discount Stay, Paid Collaboration (at least one required)

**Section 4 - Availability:**
- Toggle: Available / Unavailable
- If Available: optional start/end date range

**Workflow:**
1. User fills all sections
2. Clicks "Preview" → opens modal showing all data
3. In modal, clicks "Submit" or "Edit"
4. Submit sends `POST /api/hotels` as `FormData` (for file upload)

**Backend Connection:**
- `POST /api/hotels` → `hotelController.create`
  - Middleware: `auth`, `roleGuard('hotel_owner')`, `multer.array('images', 5)`
  - Creates `Hotel` document with `ownerId: req.user._id`
  - Saves uploaded images to disk, stores paths in `Hotel.images`
  - Sets `Hotel.featureImage` based on selected index

---

### `client/src/pages/owner/EditHotelListing.js`

**File**: [EditHotelListing.js](client/src/pages/owner/EditHotelListing.js)
**Route**: `/owner/hotels/edit/:id`

Edit form for an existing hotel listing (~865 lines).

**How it works:**
1. On mount, fetches hotel data from `GET /api/hotels/:id`
2. Populates form with existing data
3. Manages two image arrays:
   - `existingImages` - URLs of images already on server
   - `newImages` - Newly uploaded files (File objects with preview URLs)
4. User can remove existing images, add new ones, change feature image
5. On submit, sends `PUT /api/hotels/:id` as `FormData` containing:
   - Text fields (name, location, city, description)
   - `existingImages` as JSON string (to tell server which old images to keep)
   - `newImages` as file attachments
   - `featureImage` as index
   - `collaborationTypes` as JSON string
   - `availability` as JSON string

**Backend Connection:**
- `GET /api/hotels/:id` → `hotelController.getById` - Returns hotel data
- `PUT /api/hotels/:id` → `hotelController.update`
  - Middleware: `auth`, `roleGuard('hotel_owner')`, `multer.array('images', 5)`
  - Verifies ownership (`hotel.ownerId === req.user._id`)
  - Deletes removed images from disk
  - Saves new images, updates hotel document

---

### `client/src/pages/owner/HotelPreview.js`

**File**: [HotelPreview.js](client/src/pages/owner/HotelPreview.js)
**Route**: `/owner/hotels/preview/:id`

Read-only preview of a hotel listing (~420 lines).

**Sections displayed:**
- Hero image with "Feature Image" badge
- Thumbnail strip for image navigation (clickable)
- Hotel name, location
- Photo gallery grid
- Description
- Details grid: Collaboration Types, Availability, Status, Listed Date
- "Edit" button → navigates to edit page

**Backend Connection:**
- `GET /api/hotels/:id` → `hotelController.getById`

---

### `client/src/pages/owner/InfluencersListing.js`

**File**: [InfluencersListing.js](client/src/pages/owner/InfluencersListing.js)
**Route**: `/owner/influencers`

Browse all influencer profiles available for collaboration.

**Features:**
- Grid of influencer cards
- Search by name or niche
- Each card shows: avatar, display name, niche, location
- Click card → navigates to `/owner/influencers/:id`

**Backend Connection:**
- `GET /api/influencer-listing` → `influencerListingController.getAll`
  - Returns all `InfluencerProfile` documents (populated with user info)
  - Supports `?search=` query param

---

### `client/src/pages/owner/InfluencerProfileView.js`

**File**: [InfluencerProfileView.js](client/src/pages/owner/InfluencerProfileView.js)
**Route**: `/owner/influencers/:id`

Detailed view of an influencer's public profile (~312 lines).

**Sections:**
- Avatar, Display Name, Niche, Location
- Bio
- Details grid: Collaboration Types, Linked Platforms
- Reviews section (if available)
- Action buttons: "Message" and "Create Campaign"

**How it works:**
1. Fetches influencer profile from `GET /api/influencer-listing/:id`
2. Fetches reviews from `GET /api/reviews/user/:userId` (where userId = `profile.userId`)
3. "Message" button:
   - Calls `POST /api/chat/conversations` with `{ participantId: profile.userId }`
   - Returns existing or new conversation
   - Navigates to `/owner/messages/:conversationId`
4. "Create Campaign" button:
   - Navigates to `/owner/collaborations/create` with `state: { preSelectedInfluencer }` (React Router state)

**Backend Connection:**
- `GET /api/influencer-listing/:id` → `influencerListingController.getById` - Returns influencer profile with userId
- `GET /api/reviews/user/:userId` → `reviewController.getByUser` - Returns reviews received by this user
- `POST /api/chat/conversations` → `chatController.createConversation` - Creates or returns existing conversation

---

### `client/src/pages/owner/OwnerCollaborations.js`

**File**: [OwnerCollaborations.js](client/src/pages/owner/OwnerCollaborations.js)
**Route**: `/owner/collaborations`

Tabbed campaign management interface (~175 lines).

**Tabs:**
| Tab | Query | Shows |
|---|---|---|
| **Campaigns** | `?tab=campaigns` | Active campaigns (upcoming, ongoing) |
| **Applications** | `?tab=applications` | Pending campaigns waiting for action |
| **History** | `?tab=history` | Completed and cancelled campaigns |

**Features:**
- Tab navigation with badge count for applications
- Campaign cards using `CampaignCard` component
- Approve/Reject buttons on applications tab
- "Create Campaign" button → `/owner/collaborations/create`

**How it works:**
1. On mount and tab change, fetches `GET /api/campaigns?tab={tab}`
2. Approve: `PATCH /api/campaigns/:id/status` with `{ status: 'upcoming' }`
3. Reject: `PATCH /api/campaigns/:id/status` with `{ status: 'rejected' }`

**Backend Connection:**
- `GET /api/campaigns` → `campaignController.getCampaigns`
  - Filters by tab:
    - `campaigns`: status in [upcoming, ongoing] for this user
    - `applications`: status = pending, created by OTHER user (this user is recipient)
    - `history`: status in [done, cancelled, rejected]
- `PATCH /api/campaigns/:id/status` → `campaignController.updateStatus`
  - Only the recipient (non-creator) can approve/reject pending campaigns
  - Sends chat notification via existing Conversation/Message system

---

### `client/src/pages/owner/OwnerCampaignCreate.js`

**File**: [OwnerCampaignCreate.js](client/src/pages/owner/OwnerCampaignCreate.js)
**Route**: `/owner/collaborations/create`

Wrapper page for campaign creation.

**How it works:**
- Reads `state.preSelectedInfluencer` from React Router navigation state
- Renders `<CampaignForm preSelectedInfluencer={...} />` component
- On success, navigates to `/owner/collaborations`

---

### `client/src/pages/owner/OwnerCampaignDetail.js`

**File**: [OwnerCampaignDetail.js](client/src/pages/owner/OwnerCampaignDetail.js)
**Route**: `/owner/collaborations/:id`

Wrapper page for campaign detail view.

**How it works:**
- Renders `<CampaignDetail />` component
- Back button → `/owner/collaborations`

---

### `client/src/pages/owner/OwnerSettings.js`

**File**: [OwnerSettings.js](client/src/pages/owner/OwnerSettings.js)
**Route**: `/owner/settings`

Account settings page (placeholder).

**Sections:**
- **Change Password**: Form with Current Password and New Password fields (UI only, not wired to backend)
- **Danger Zone**: "Delete Account" button (UI only, not wired)

**Backend Connection**: None currently (placeholder page).

---

## Influencer Pages

### `client/src/pages/influencer/InfluencerDashboard.js`

**File**: [InfluencerDashboard.js](client/src/pages/influencer/InfluencerDashboard.js)
**Route**: `/influencer`

Dashboard overview with stats.

**Stats Displayed:**
| Stat | Source |
|---|---|
| Linked Platforms | `GET /api/influencer/profile` → linkedPlatforms count |
| Active Collaborations | `GET /api/campaigns/stats` → `activeCampaigns` |
| Pending Applications | `GET /api/campaigns/stats` → `pendingApplications` |
| Waiting for Approval | `GET /api/campaigns/stats` → `waitingForApproval` |
| Upcoming | `GET /api/campaigns/stats` → `upcoming` |
| Completed | `GET /api/campaigns/stats` → `completed` |

**Backend Connection:**
- `GET /api/influencer/profile` → `influencerController.getProfile`
- `GET /api/campaigns/stats` → `campaignController.getStats`

---

### `client/src/pages/influencer/InfluencerProfile.js`

**File**: [InfluencerProfile.js](client/src/pages/influencer/InfluencerProfile.js)
**Route**: `/influencer/profile`

Complete profile management page (~900 lines).

**Sections:**

**1. Profile Picture:**
- Current avatar display with initials fallback
- Upload button (file input, max 2MB, JPEG/PNG/WebP)
- Remove button (if avatar exists)
- Auto-upload on file select

**2. Basic Info:**
- Display Name, Niche (dropdown), Location, Bio (textarea)
- Single "Save" button for all fields

**3. Collaboration Types:**
- Checkboxes: Free Stay, Discount Stay, Paid Collaboration
- Saved together with basic info

**4. Social Accounts (YouTube, Instagram, TikTok):**
- Shows connection status for each platform
- "Connect" button starts OAuth flow
- "Disconnect" button unlinks the account
- Only ONE platform can be connected at a time

**5. My Content:**
- Grid of recent posts from connected platform
- Shows thumbnails, titles, publication dates
- Links to original posts (external)

**6. Profile Preview:**
- Modal showing how profile appears to hotel owners

**Backend Connection:**
- `GET /api/influencer/profile` → `influencerController.getProfile` - Loads current profile data
- `PUT /api/influencer/profile` → `influencerController.updateProfile` - Saves basic info + collab types
- `POST /api/influencer/avatar` → `influencerController.uploadAvatar` - Uploads new avatar (FormData)
- `DELETE /api/influencer/avatar` → `influencerController.deleteAvatar` - Removes current avatar
- `GET /api/oauth/:provider/start` → `oauthController.startOAuth` - Returns OAuth URL, user is redirected
- `DELETE /api/oauth/:provider/unlink` → `oauthController.unlinkProvider` - Disconnects social account
- `GET /api/oauth/:provider/content` → `oauthController.getContent` - Fetches recent posts from platform

**OAuth Flow:**
```
1. User clicks "Connect YouTube"
2. Frontend calls GET /api/oauth/youtube/start
3. Backend generates OAuth URL with state token, returns URL
4. Frontend redirects user to YouTube's consent screen
5. YouTube redirects back to SERVER callback URL
6. Server exchanges code for tokens, saves SocialAccount
7. Server redirects user back to frontend profile page
8. Profile page re-fetches data, shows "Connected"
```

---

### `client/src/pages/influencer/HostsListing.js`

**File**: [HostsListing.js](client/src/pages/influencer/HostsListing.js)
**Route**: `/influencer/hosts`

Browse available hotels for collaboration (~212 lines).

**Features:**
- Grid of hotel cards
- Search by name, city, location
- Each card shows: feature image, hotel name, location, availability badge
- Click card → navigates to `/influencer/hosts/:id`

**Backend Connection:**
- `GET /api/hosts` → `hostController.getAll`
  - Returns all active hotels with their feature images
  - Different from `/api/hotels` (which returns only current user's hotels)
  - Supports `?search=` query param

---

### `client/src/pages/influencer/HostDetails.js`

**File**: [HostDetails.js](client/src/pages/influencer/HostDetails.js)
**Route**: `/influencer/hosts/:id`

Detailed view of a hotel listing (~478 lines).

**Sections:**
- Hero image with Feature badge
- Thumbnail strip for image navigation
- Hotel name, location
- Photo gallery grid
- Description ("About this Hotel")
- Details grid: Collaboration Types, Availability, Location, Star Rating
- Reviews for the hotel owner
- Action bar: Back, Message Host, Create Campaign

**How it works:**
1. Fetches hotel from `GET /api/hosts/:id`
2. Fetches reviews for hotel owner from `GET /api/reviews/user/:ownerId`
3. "Message Host":
   - Calls `POST /api/chat/conversations` with `{ participantId: hotel.ownerId }`
   - Navigates to `/influencer/messages/:conversationId`
4. "Create Campaign":
   - Navigates to `/influencer/campaigns/create` with `state: { preSelectedHotel }`

**Backend Connection:**
- `GET /api/hosts/:id` → `hostController.getById` - Returns full hotel document including `ownerId`
- `GET /api/reviews/user/:userId` → `reviewController.getByUser`
- `POST /api/chat/conversations` → `chatController.createConversation`

---

### `client/src/pages/influencer/InfluencerCampaigns.js`

**File**: [InfluencerCampaigns.js](client/src/pages/influencer/InfluencerCampaigns.js)
**Route**: `/influencer/campaigns`

Tabbed campaign management (~150 lines). Same structure as OwnerCollaborations.

**Tabs:** Campaigns, Applications, History

**Backend Connection:**
- `GET /api/campaigns?tab={tab}` → `campaignController.getCampaigns`
- `PATCH /api/campaigns/:id/status` → `campaignController.updateStatus`

---

### `client/src/pages/influencer/InfluencerCampaignCreate.js`

**File**: [InfluencerCampaignCreate.js](client/src/pages/influencer/InfluencerCampaignCreate.js)
**Route**: `/influencer/campaigns/create`

Wrapper for `<CampaignForm preSelectedHotel={...} />`.

---

### `client/src/pages/influencer/InfluencerCampaignDetail.js`

**File**: [InfluencerCampaignDetail.js](client/src/pages/influencer/InfluencerCampaignDetail.js)
**Route**: `/influencer/campaigns/:id`

Wrapper for `<CampaignDetail />`.

---

### `client/src/pages/influencer/InfluencerSettings.js`

**File**: [InfluencerSettings.js](client/src/pages/influencer/InfluencerSettings.js)
**Route**: `/influencer/settings`

Account settings page (placeholder - same as OwnerSettings).

---

## Shared Pages (Messaging)

### `client/src/pages/shared/Messages.js`

**File**: [Messages.js](client/src/pages/shared/Messages.js)
**Routes**: `/owner/messages`, `/owner/messages/:conversationId`, `/influencer/messages`, `/influencer/messages/:conversationId`

Real-time messaging interface used by both hotel owners and influencers (~406 lines).

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  PageHeader: "Messages"                          │
├──────────────┬──────────────────────────────────┤
│ Conversations│  ChatPanel                        │
│ List (340px) │  (active conversation)            │
│              │                                   │
│ [Search box] │  [Header: Other user name]        │
│              │  [Messages area with bubbles]     │
│ Conv 1  [2]  │  [Typing indicator]               │
│ Conv 2       │  [Input + Send button]            │
│ Conv 3  [1]  │                                   │
│              │                                   │
└──────────────┴──────────────────────────────────┘
```

**How the Conversation List works:**
1. On mount, fetches all conversations: `GET /api/chat/conversations`
2. Each conversation shows:
   - Avatar with initials of the other participant
   - Name of other participant
   - Last message preview text
   - Timestamp (Today: HH:MM, Yesterday: "Yesterday", This week: weekday, Older: date)
   - Unread badge (red circle with count, "99+" if >99)
3. Search box filters conversations by other participant's name
4. Clicking a conversation:
   - Sets it as active (highlights in list)
   - Clears its unread count
   - Loads ChatPanel for that conversation

**Real-time updates (Socket.io):**
- Listens for `newMessage` events → updates conversation's lastMessage, reorders to top, increments unread
- Listens for `messagesRead` events → clears unread badge for that conversation
- Does NOT increment unread if user is currently viewing that conversation

**Backend Connection:**
- `GET /api/chat/conversations` → `chatController.getConversations`
  - Returns conversations for current user, populated with participant names and last message
  - Includes `unreadCount` per conversation

---

### `client/src/pages/shared/ChatPanel.js`

**File**: [ChatPanel.js](client/src/pages/shared/ChatPanel.js)

The actual chat interface component within a single conversation (~373 lines).

**Props:**
- `conversationId` - Active conversation ID
- `otherUser` - The other participant's data `{ _id, name, role }`

**Features:**
- **Message Loading**: `GET /api/chat/conversations/:id/messages` on conversation change
- **Message Display**: Chat bubbles with different colors by role:
  - Hotel Owner messages: `#6366F1` (indigo)
  - Influencer messages: `#14B8A6` (teal)
- **Date Separators**: Groups messages by date (Today, Yesterday, or full date)
- **Read Receipts**: Shows "Seen" label on your messages when the other person has read them
- **Typing Indicator**: Shows "[Name] is typing..." when other user is typing
- **Auto-scroll**: Scrolls to bottom on new messages
- **Mark as Read**: Automatically marks messages as read when viewing a conversation

**Socket Events Used:**
| Event | Direction | Purpose |
|---|---|---|
| `sendMessage` | Emit | Send a new message `{ conversationId, text }` |
| `newMessage` | Listen | Receive new messages in real-time |
| `markAsRead` | Emit | Mark all messages in conversation as read |
| `messagesRead` | Listen | Other user read your messages (shows "Seen") |
| `typing` | Emit | Send typing indicator `{ conversationId, isTyping }` |
| `userTyping` | Listen | Other user typing indicator |

**Typing Indicator Logic:**
- On each keystroke, emits `typing: true`
- After 2 seconds of no typing, emits `typing: false`
- Uses timeout ref to debounce

**Backend Connection:**
- `GET /api/chat/conversations/:id/messages` → `chatController.getMessages`
  - Returns paginated messages for a conversation
  - Each message: `{ _id, conversationId, senderId, text, readBy, createdAt }`
- Socket handlers in `server/src/socket/chatHandler.js`:
  - `sendMessage`: Creates Message document, updates Conversation.lastMessage, emits to participants
  - `markAsRead`: Updates Message.readBy, notifies other participant
  - `typing`: Relays typing status to other participant

---

## Admin Pages

### `client/src/pages/admin/AdminLogin.js`

**File**: [AdminLogin.js](client/src/pages/admin/AdminLogin.js)
**Route**: `/admin`

Separate login page for admin users.

**How it works:**
1. Uses same `login()` from AuthContext
2. After successful login, checks `user.role === 'admin'`
3. If not admin, shows "Admin access only" error
4. If admin, navigates to `/admin/dashboard`

**Visual**: Centered card with "Influspark" logo, "Admin Panel" subtitle, secondary-colored button

**Backend Connection**: Same as regular login (`POST /api/auth/login`)

---

### `client/src/pages/admin/AdminDashboard.js`

**File**: [AdminDashboard.js](client/src/pages/admin/AdminDashboard.js)
**Route**: `/admin/dashboard`

Platform overview statistics.

**Stats Displayed:**
| Stat | Field |
|---|---|
| Total Users | `stats.total` |
| Hotel Owners | `stats.hotelOwners` |
| Influencers | `stats.influencers` |
| Admins | `stats.admins` |
| Banned Users | `stats.banned` |

**Backend Connection:**
- `GET /api/admin/stats` → `adminController.getStats`
  - Requires auth + admin role
  - Aggregates User collection by role and status

---

### `client/src/pages/admin/AdminUsers.js`

**File**: [AdminUsers.js](client/src/pages/admin/AdminUsers.js)
**Route**: `/admin/users`

User management table with filtering and search (~218 lines).

**Features:**
- **Filter buttons**: All, Hotel Owners, Influencers
- **Search input**: Debounced search (400ms) by name or email
- **Table columns**: Name, Email, Role, Status, Joined, Actions
- **Actions per user**:
  - "View" → navigates to `/admin/users/:id`
  - "Ban" → `POST /api/admin/users/:id/ban` (with confirm dialog)
  - "Unban" → `POST /api/admin/users/:id/unban`
  - Admins cannot be banned

**Backend Connection:**
- `GET /api/admin/users?role=&search=` → `adminController.getUsers`
  - Returns filtered/searched user list
- `POST /api/admin/users/:id/ban` → `adminController.banUser`
  - Sets user status to 'banned'
  - Creates BanLog record
- `POST /api/admin/users/:id/unban` → `adminController.unbanUser`
  - Restores user status to 'active'
  - Creates BanLog record (action: 'unban')

---

### `client/src/pages/admin/AdminUserPreview.js`

**File**: [AdminUserPreview.js](client/src/pages/admin/AdminUserPreview.js)
**Route**: `/admin/users/:id`

Comprehensive user detail view (~569 lines).

**Sections displayed based on user role:**

**For All Users:**
- User info: Email, Role, Status (badge), Email Verified (badge), Joined date
- Ban/Unban action button
- Recent Campaigns table (title, hotel, status, dates)
- Reviews Received (reviewer name, campaign, star rating, comment)
- Ban History table (action, admin, reason, date) - only if has ban history

**For Hotel Owners additionally:**
- Owner Profile: Company, Phone, Location, Website, Bio
- Hotels grid: Feature image, name, location, star rating, active/inactive badge

**For Influencers additionally:**
- Influencer Profile: Avatar, display name, niche, location, bio, collaboration types, linked platforms

**Backend Connection:**
- `GET /api/admin/users/:id` → `adminController.getUserDetail`
  - Returns comprehensive data: `{ user, ownerProfile?, hotels?, influencerProfile?, campaigns, reviews, banHistory }`

---

### `client/src/pages/admin/AdminCollaborations.js`

**File**: [AdminCollaborations.js](client/src/pages/admin/AdminCollaborations.js)
**Route**: `/admin/collaborations`

View all platform collaborations with filtering (~208 lines).

**Features:**
- **Status filter buttons**: All, Pending, Upcoming, Ongoing, Completed, Cancelled, Rejected
- **Search input**: Debounced search by title, hotel name, or influencer name
- **Table columns**: Title, Hotel, Influencer, Type, Status, Created, Actions
- "View" button → navigates to `/admin/collaborations/:id`

**Backend Connection:**
- `GET /api/admin/campaigns?status=&search=` → `adminController.getCampaigns`
  - Returns all campaigns (admin can see everything, unlike regular users who only see their own)

---

### `client/src/pages/admin/AdminCollaborationDetail.js`

**File**: [AdminCollaborationDetail.js](client/src/pages/admin/AdminCollaborationDetail.js)
**Route**: `/admin/collaborations/:id`

Read-only detailed view of a single campaign (~286 lines).

**Sections:**
- Status & Type badges
- Dates (start - end)
- Created by (name + role)
- Cancellation reason box (if cancelled, red-bordered)
- Two-column party cards: Hotel (image + name + location) | Influencer (avatar + name + niche)
- Campaign description

**Backend Connection:**
- `GET /api/admin/campaigns/:id` → `adminController.getCampaignDetail`
  - Returns populated campaign with hotel and influencer data

---

### `client/src/pages/admin/AdminSettings.js`

**File**: [AdminSettings.js](client/src/pages/admin/AdminSettings.js)
**Route**: `/admin/settings`

Admin management and invitation system (~238 lines).

**Sections:**

**1. Invite New Admin:**
- Email input + "Send Invite" button
- Sends email invitation to become admin

**2. All Admins:**
- Table: Name, Email, Joined, Actions
- Current admin shown with "You" badge
- Other admins have "Remove" button

**3. Pending Invitations:**
- Table: Email, Invited By, Invited date, Status (Pending/Expired), Actions
- Expired invitations have "Resend" button

**Backend Connection:**
- `POST /api/admin/invite` → `adminController.inviteAdmin`
  - Creates `AdminInviteToken` with 48h expiry
  - Sends invitation email with setup link
- `GET /api/admin/invites` → `adminController.getInvites`
  - Returns all pending/expired invite tokens
- `GET /api/admin/admins` → `adminController.getAdmins`
  - Returns all admin users
- `DELETE /api/admin/admins/:id` → `adminController.removeAdmin`
  - Deletes an admin account (cannot remove self)

---

### `client/src/pages/admin/AdminSetupPassword.js`

**File**: [AdminSetupPassword.js](client/src/pages/admin/AdminSetupPassword.js)
**Route**: `/admin/setup-password?token=...`

Admin account setup page (reached via email invitation link).

**Form Fields:** Your Name, Password, Confirm Password

**How it works:**
1. Reads `token` from URL query params
2. If no token, shows "Invalid Link" message
3. User enters name and password (min 8 chars)
4. Calls `POST /api/admin/setup-password` with `{ token, name, password }`
5. On success, shows "Account Ready!" with link to admin login

**Backend Connection:**
- `POST /api/admin/setup-password` → `adminController.setupPassword`
  - Validates `AdminInviteToken`
  - Creates new `User` with role 'admin'
  - Hashes password with bcrypt
  - Deletes used token

---

## Campaign System Components

### `client/src/components/campaigns/CampaignForm.js`

**File**: [CampaignForm.js](client/src/components/campaigns/CampaignForm.js)

Reusable campaign creation form (~470 lines). Used by BOTH hotel owners and influencers.

**Props:**
- `preSelectedHotel` - Pre-fill hotel (when coming from host detail page)
- `preSelectedInfluencer` - Pre-fill influencer (when coming from influencer profile page)
- `onSuccess` - Callback after successful creation
- `onCancel` - Callback for cancel button

**Workflow by Role:**

**Hotel Owner creating campaign:**
1. Select from own hotels (dropdown populated from `GET /api/hotels`)
2. Search and select an influencer (search input, results from `GET /api/influencer-listing?search=`)
3. Fill campaign details: type, title, description, dates

**Influencer creating campaign:**
1. Search and select a hotel (search input, results from `GET /api/hosts?search=`)
2. Influencer is auto-selected as self
3. Fill campaign details: type, title, description, dates

**Campaign Types:** Free Stay, Discount Stay, Paid Collaboration

**On Submit:**
```javascript
POST /api/campaigns
{
  hotelId: selectedHotel._id,
  influencerId: selectedInfluencer.userId,  // User._id, NOT profile._id
  campaignType: 'free_stay' | 'discount_stay' | 'paid_collaboration',
  title: 'Campaign Title',
  description: 'Details...',
  startDate: '2026-03-01',
  endDate: '2026-03-15'
}
```

**Backend Connection:**
- `POST /api/campaigns` → `campaignController.create`
  - Sets `createdBy: req.user._id`, `creatorRole: req.user.role`
  - Status starts as `pending`
  - Sends chat notification to the other party via Conversation/Message
  - Emits `campaignCreated` socket event

---

### `client/src/components/campaigns/CampaignCard.js`

**File**: [CampaignCard.js](client/src/components/campaigns/CampaignCard.js)

Campaign summary card component.

**Displayed Info:**
- Hotel thumbnail image
- Campaign title
- Opposite party (influencer name for owners, hotel name for influencers)
- Campaign type badge
- Status badge with color mapping:
  - Pending → yellow, Upcoming → blue, Ongoing → green, Done → green, Cancelled → red
- Date range
- Action buttons: Approve, Reject (conditionally), View

---

### `client/src/components/campaigns/CampaignDetail.js`

**File**: [CampaignDetail.js](client/src/components/campaigns/CampaignDetail.js)

Full campaign detail view with status management (~500+ lines).

**Sections:**
- Two-column layout: Hotel card | Influencer card
- Campaign info: Type, Title, Description, Dates
- Status badge + status action buttons
- Cancel campaign modal (with reason textarea)
- Reviews section (visible when status = done)
- Leave review form (for both parties)

**Status Flow & Actions:**
```
pending → upcoming (approve) or rejected (reject)
upcoming → ongoing (when start date reached) or cancelled
ongoing → done (complete) or cancelled
```

**Action Buttons (shown based on status + user role):**
- **Pending**: Approve/Reject (only for recipient, not creator)
- **Upcoming**: Cancel
- **Ongoing**: Mark as Done, Cancel
- **Done**: Leave Review (if not already reviewed)

**Backend Connection:**
- `GET /api/campaigns/:id` → `campaignController.getById` - Full campaign with populated hotel/influencer
- `PATCH /api/campaigns/:id/status` → `campaignController.updateStatus` - Change status with optional cancelReason
- Socket events: `campaignStatusUpdated` emitted on status changes

---

### `client/src/components/campaigns/ReviewForm.js`

**File**: [ReviewForm.js](client/src/components/campaigns/ReviewForm.js)

Form for submitting a review after campaign completion.

**Fields:**
- Star rating (1-5, required) using StarRating component
- Comment (optional textarea)

**Backend Connection:**
- `POST /api/campaigns/:id/reviews` → `reviewController.create`
  - Creates Review document: `{ campaignId, reviewerId, revieweeId, rating, comment }`
  - Emits `reviewCreated` socket event

---

### `client/src/components/campaigns/ReviewsList.js`

**File**: [ReviewsList.js](client/src/components/campaigns/ReviewsList.js)

Display component for a list of reviews.

**Props:**
- `reviews` - Array of review objects
- `averageRating` - Calculated average
- `totalReviews` - Count

**Displays:** Star rating, reviewer name, date, comment for each review

---

### `client/src/components/campaigns/StarRating.js`

**File**: [StarRating.js](client/src/components/campaigns/StarRating.js)

Interactive star rating component.

**Props:**
- `rating` - Current value (1-5)
- `interactive` - Whether stars are clickable
- `onChange` - Callback when star is clicked
- `showValue` - Show numeric value next to stars
- `size` - Star icon size

---

## Backend API Endpoints Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| POST | `/auth/register` | `authController.register` | `validate(registerSchema)` | Register new user |
| POST | `/auth/login` | `authController.login` | `validate(loginSchema)` | Login, returns tokens |
| GET | `/auth/me` | `authController.me` | `auth` | Get current user |
| POST | `/auth/refresh` | `authController.refresh` | - | Refresh access token |
| GET | `/auth/verify-email` | `authController.verifyEmail` | - | Verify email with token |
| POST | `/auth/forgot-password` | `authController.forgotPassword` | `validate` | Request password reset |
| POST | `/auth/reset-password` | `authController.resetPassword` | `validate` | Reset password with token |

### Hotels (`/api/hotels`) - Owner's Own Hotels

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/hotels` | `hotelController.getAll` | `auth`, `roleGuard('hotel_owner')` | List owner's hotels |
| POST | `/hotels` | `hotelController.create` | `auth`, `roleGuard('hotel_owner')`, `multer` | Create hotel |
| GET | `/hotels/:id` | `hotelController.getById` | `auth`, `roleGuard('hotel_owner')` | Get hotel detail |
| PUT | `/hotels/:id` | `hotelController.update` | `auth`, `roleGuard('hotel_owner')`, `multer` | Update hotel |
| DELETE | `/hotels/:id` | `hotelController.delete` | `auth`, `roleGuard('hotel_owner')` | Delete hotel |

### Hosts (`/api/hosts`) - Public Hotel Listings for Influencers

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/hosts` | `hostController.getAll` | `auth` | List all active hotels |
| GET | `/hosts/:id` | `hostController.getById` | `auth` | Get hotel detail (includes ownerId) |

### Influencer Profiles (`/api/influencer`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/influencer/profile` | `influencerController.getProfile` | `auth`, `roleGuard('influencer')` | Get own profile |
| PUT | `/influencer/profile` | `influencerController.updateProfile` | `auth`, `roleGuard('influencer')` | Update profile |
| POST | `/influencer/avatar` | `influencerController.uploadAvatar` | `auth`, `roleGuard('influencer')`, `multer` | Upload avatar |
| DELETE | `/influencer/avatar` | `influencerController.deleteAvatar` | `auth`, `roleGuard('influencer')` | Remove avatar |

### Influencer Listing (`/api/influencer-listing`) - Public Profiles for Owners

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/influencer-listing` | `influencerListingController.getAll` | `auth` | List all influencers |
| GET | `/influencer-listing/:id` | `influencerListingController.getById` | `auth` | Get influencer detail |

### Owner Profile (`/api/owner`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/owner/profile` | `ownerProfileController.getProfile` | `auth`, `roleGuard('hotel_owner')` | Get owner profile |
| PUT | `/owner/profile` | `ownerProfileController.updateProfile` | `auth`, `roleGuard('hotel_owner')` | Update owner profile |

### Campaigns (`/api/campaigns`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/campaigns` | `campaignController.getCampaigns` | `auth` | List campaigns (tab-based) |
| POST | `/campaigns` | `campaignController.create` | `auth`, `validate` | Create campaign |
| GET | `/campaigns/stats` | `campaignController.getStats` | `auth` | Campaign statistics |
| GET | `/campaigns/:id` | `campaignController.getById` | `auth` | Campaign detail |
| PATCH | `/campaigns/:id/status` | `campaignController.updateStatus` | `auth`, `validate` | Update campaign status |

### Reviews (`/api/reviews`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/reviews/user/:userId` | `reviewController.getByUser` | `auth` | Reviews for a user |
| POST | `/campaigns/:id/reviews` | `reviewController.create` | `auth`, `validate` | Submit review |

### Chat (`/api/chat`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/chat/conversations` | `chatController.getConversations` | `auth` | List conversations |
| POST | `/chat/conversations` | `chatController.createConversation` | `auth`, `validate` | Create/get conversation |
| GET | `/chat/conversations/:id/messages` | `chatController.getMessages` | `auth` | Get messages |
| GET | `/chat/unread-count` | `chatController.getUnreadCount` | `auth` | Total unread count |

### OAuth (`/api/oauth`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/oauth/:provider/start` | `oauthController.startOAuth` | `auth`, `roleGuard('influencer')` | Get OAuth URL |
| GET | `/oauth/:provider/callback` | `oauthController.handleCallback` | - | OAuth callback (from provider) |
| DELETE | `/oauth/:provider/unlink` | `oauthController.unlinkProvider` | `auth`, `roleGuard('influencer')` | Disconnect account |
| GET | `/oauth/:provider/content` | `oauthController.getContent` | `auth`, `roleGuard('influencer')` | Fetch social posts |

### Contact (`/api/contact`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| POST | `/contact` | `contactController.submitContact` | `validate` | Submit contact form |

### Admin (`/api/admin`)

| Method | Endpoint | Controller | Middleware | Description |
|---|---|---|---|---|
| GET | `/admin/stats` | `adminController.getStats` | `auth`, `roleGuard('admin')` | Platform stats |
| GET | `/admin/users` | `adminController.getUsers` | `auth`, `roleGuard('admin')` | List users |
| GET | `/admin/users/:id` | `adminController.getUserDetail` | `auth`, `roleGuard('admin')` | User detail |
| POST | `/admin/users/:id/ban` | `adminController.banUser` | `auth`, `roleGuard('admin')` | Ban user |
| POST | `/admin/users/:id/unban` | `adminController.unbanUser` | `auth`, `roleGuard('admin')` | Unban user |
| POST | `/admin/invite` | `adminController.inviteAdmin` | `auth`, `roleGuard('admin')` | Invite new admin |
| GET | `/admin/invites` | `adminController.getInvites` | `auth`, `roleGuard('admin')` | List invitations |
| GET | `/admin/admins` | `adminController.getAdmins` | `auth`, `roleGuard('admin')` | List admin users |
| DELETE | `/admin/admins/:id` | `adminController.removeAdmin` | `auth`, `roleGuard('admin')` | Remove admin |
| POST | `/admin/setup-password` | `adminController.setupPassword` | `validate` | Setup admin account |
| GET | `/admin/campaigns` | `adminController.getCampaigns` | `auth`, `roleGuard('admin')` | All campaigns |
| GET | `/admin/campaigns/:id` | `adminController.getCampaignDetail` | `auth`, `roleGuard('admin')` | Campaign detail |

---

## Database Models Reference

### User (`server/src/models/User.js`)
```
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: 'guest' | 'hotel_owner' | 'influencer' | 'admin',
  status: 'pending_verification' | 'active' | 'banned',
  isEmailVerified: Boolean,
  refreshToken: String,
  createdAt, updatedAt
}
```

### Hotel (`server/src/models/Hotel.js`)
```
{
  ownerId: ObjectId → User,
  name: String,
  location: String,
  city: String,
  description: String,
  images: [String] (file paths),
  featureImage: String (file path),
  collaborationTypes: ['free_stay' | 'discount_stay' | 'paid_collaboration'],
  availability: { status: 'available' | 'unavailable', startDate, endDate },
  starRating: Number,
  isActive: Boolean,
  createdAt, updatedAt
}
```

### InfluencerProfile (`server/src/models/InfluencerProfile.js`)
```
{
  userId: ObjectId → User,
  displayName: String,
  niche: String,
  location: String,
  bio: String,
  avatar: String (file path),
  collaborationTypes: [String],
  linkedPlatforms: [{ platform, handle, url, followers }],
  createdAt, updatedAt
}
```

### HotelOwnerProfile (`server/src/models/HotelOwnerProfile.js`)
```
{
  userId: ObjectId → User,
  companyName: String,
  phone: String,
  website: String,
  location: String,
  bio: String,
  createdAt, updatedAt
}
```

### Campaign (`server/src/models/Campaign.js`)
```
{
  hotelId: ObjectId → Hotel,
  influencerId: ObjectId → User (NOT InfluencerProfile),
  createdBy: ObjectId → User,
  creatorRole: 'hotel_owner' | 'influencer',
  campaignType: 'free_stay' | 'discount_stay' | 'paid_collaboration',
  title: String,
  description: String,
  status: 'pending' | 'upcoming' | 'ongoing' | 'done' | 'cancelled' | 'rejected',
  startDate: Date,
  endDate: Date,
  cancelReason: String,
  createdAt, updatedAt
}
```

### Review (`server/src/models/Review.js`)
```
{
  campaignId: ObjectId → Campaign,
  reviewerId: ObjectId → User,
  revieweeId: ObjectId → User,
  rating: Number (1-5),
  comment: String,
  createdAt, updatedAt
}
```

### Conversation (`server/src/models/Conversation.js`)
```
{
  participants: [ObjectId → User],
  lastMessage: { text, senderId, createdAt },
  createdAt, updatedAt
}
```

### Message (`server/src/models/Message.js`)
```
{
  conversationId: ObjectId → Conversation,
  senderId: ObjectId → User,
  text: String,
  readBy: [ObjectId → User],
  createdAt, updatedAt
}
```

### SocialAccount (`server/src/models/SocialAccount.js`)
```
{
  userId: ObjectId → User,
  provider: 'youtube' | 'instagram' | 'tiktok',
  providerUserId: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  username: String,
  followers: Number,
  createdAt, updatedAt
}
```

### Other Models:
- **EmailVerificationToken**: `{ userId, token, expiresAt }`
- **PasswordResetToken**: `{ userId, token, expiresAt }`
- **AdminInviteToken**: `{ email, token, invitedBy, invitedAt, expiresAt }`
- **BanLog**: `{ userId, adminId, action ('ban'|'unban'), reason, createdAt }`

---

## Real-Time Communication (Socket.io)

### Server Setup (`server/src/socket/index.js`)

```
Socket.io Server
├── CORS: localhost:3000 + CLIENT_URL
├── Auth Middleware: JWT verification (same as REST)
├── On Connection:
│   ├── socket.join(userId) → personal room
│   └── handleChatEvents(io, socket) → register event handlers
└── getIO() → exported for use in controllers
```

### Chat Events (`server/src/socket/chatHandler.js`)

| Event | Direction | Payload | Description |
|---|---|---|---|
| `sendMessage` | Client → Server | `{ conversationId, text }` | Send message; creates Message doc, updates Conversation, emits to all participants |
| `newMessage` | Server → Client | `{ _id, conversationId, senderId, senderName, senderRole, text, readBy, createdAt }` | New message notification to all conversation participants |
| `markAsRead` | Client → Server | `{ conversationId }` | Mark all unread messages as read by current user |
| `messagesRead` | Server → Client | `{ conversationId, readBy }` | Notification that messages were read (for "Seen" indicator) |
| `typing` | Client → Server | `{ conversationId, isTyping }` | Typing indicator |
| `userTyping` | Server → Client | `{ conversationId, userId, isTyping }` | Typing indicator for other user |

### Campaign Events (emitted from controllers)

| Event | Emitted From | Payload | When |
|---|---|---|---|
| `campaignCreated` | `campaignController.create` | Campaign object | New campaign proposed |
| `campaignStatusUpdated` | `campaignController.updateStatus` | `{ campaignId, status }` | Campaign approved/rejected/cancelled/done |
| `reviewCreated` | `reviewController.create` | Review object | New review submitted |

---

## OAuth Integration

### Architecture (`server/src/services/oauth/`)

Uses the **Adapter Pattern** with a base class and platform-specific implementations:

```
OAuthAdapter (base class)
├── YouTubeAdapter
├── InstagramAdapter
└── TikTokAdapter
```

Each adapter implements:
- `getAuthUrl(state)` - Generate OAuth authorization URL
- `exchangeCode(code)` - Exchange authorization code for tokens
- `getProfile(accessToken)` - Fetch user profile (username, followers)

### YouTube OAuth
- Uses Google OAuth 2.0
- Scopes: `youtube.readonly` (channel info + video listing)
- Content fetch: YouTube Data API v3 (`/search?part=snippet&forMine=true`)

### Instagram OAuth
- Uses Instagram Basic Display API
- Scope: `instagram_business_basic`
- Content fetch: Instagram Graph API

### TikTok OAuth
- Uses TikTok Login Kit v2
- Scopes: `user.info.basic`, `user.info.stats`
- Status: RESTRICTED (requires developer application approval)
- Falls back to mock data when credentials are missing

### Mock Fallback
All adapters include mock fallback when API credentials are not configured, returning placeholder data for development.

---

## Deployment & Environment Variables

### Server Environment Variables (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5001) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `CLIENT_URL` | Frontend URL (for CORS and email links) |
| `SERVER_URL` | Backend URL (for OAuth callbacks) |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `EMAIL_FROM` | Sender email address |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth client secret |
| `INSTAGRAM_CLIENT_ID` | Instagram OAuth client ID |
| `INSTAGRAM_CLIENT_SECRET` | Instagram OAuth client secret |
| `TIKTOK_CLIENT_KEY` | TikTok OAuth client key |
| `TIKTOK_CLIENT_SECRET` | TikTok OAuth client secret |

### Client Environment Variables (`client/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API base URL (e.g., `http://localhost:5001/api`) |

---

## Summary

The Hotel Influencer Platform is a full-stack application connecting hotels with social media influencers for marketing collaborations. It features:

- **3 User Roles**: Hotel Owners, Influencers, and Admins - each with dedicated dashboards
- **Real-time Messaging**: Socket.io-powered chat between hotels and influencers
- **Campaign Management**: Bidirectional campaign proposals with full lifecycle (pending → upcoming → ongoing → done)
- **OAuth Social Integration**: YouTube, Instagram, TikTok account linking for influencers
- **Review System**: Post-campaign reviews with star ratings
- **Admin Panel**: User management, campaign monitoring, admin invitation system
- **JWT Authentication**: Secure access with token refresh mechanism
- **File Uploads**: Hotel images and influencer avatars via Multer
- **Email Notifications**: Verification, password reset, admin invites, campaign notifications
