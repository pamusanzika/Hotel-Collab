# Admin Settings — Feature Documentation

## Overview

The Admin Settings feature allows existing administrators to manage other admins on the Influspark platform. Admins can invite new admins by email, view all current admins, remove admins, and track pending invitations.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| **Express.js** | Backend REST API framework for handling HTTP requests |
| **MongoDB / Mongoose** | Database and ODM for storing users, tokens, and data modeling |
| **bcrypt** | Password hashing (12 salt rounds) for secure credential storage |
| **crypto** (Node.js built-in) | Generating secure random tokens for invitation links |
| **nodemailer** | Sending invitation emails via SMTP (Gmail) |
| **Zod** | Request body validation schemas on the backend |
| **React 18** | Frontend UI library |
| **React Router v6** | Client-side routing (`useSearchParams`, `useNavigate`) |
| **styled-components** | CSS-in-JS styling following the existing design system |
| **Axios** | HTTP client with JWT interceptors for API calls |
| **JWT (JSON Web Tokens)** | Authentication — protected routes require valid admin tokens |

---

## Files Created

### 1. `server/src/models/AdminInviteToken.js`

**Purpose:** Mongoose model that stores invitation tokens sent to new admins.

**Schema Fields:**

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | The invited user this token belongs to |
| `token` | String (unique) | Random 64-character hex string used in the invitation URL |
| `invitedBy` | ObjectId (ref: User) | The admin who sent the invitation |
| `expiresAt` | Date | When the token expires (48 hours after creation) |
| `createdAt` | Date | When the token was created |

**Key Feature:** A TTL (Time-To-Live) index on `expiresAt` automatically deletes expired tokens from the database. This follows the same pattern used by `PasswordResetToken.js`.

---

### 2. `server/src/validators/adminValidators.js`

**Purpose:** Zod validation schemas that validate request bodies before they reach controller logic.

**Schemas:**

- **`inviteAdminSchema`** — Validates the invite request body
  - `email`: Must be a valid email, trimmed and lowercased

- **`setupAdminPasswordSchema`** — Validates the password setup request body
  - `token`: Required, non-empty string
  - `name`: Required, 2–100 characters, trimmed
  - `password`: Required, 8–128 characters

These schemas are used with the `validate()` middleware in the routes, which returns a 400 error with field-level details if validation fails.

---

### 3. `client/src/pages/admin/AdminSettings.js`

**Purpose:** The main admin settings page with three sections.

**Sections:**

#### Section 1: Invite New Admin
- A form with an email input field and "Send Invite" button
- On submit, calls `POST /api/admin/invite`
- Shows success or error messages below the form
- The button shows "Sending..." while the request is in progress

#### Section 2: All Admins
- A table listing all active admins on the platform
- Columns: Name, Email, Joined date, Actions
- The currently logged-in admin sees a green "You" badge instead of a remove button (prevents self-removal)
- Other admins have a red "Remove" button that triggers a confirmation dialog before deletion
- Uses `useAuth()` hook to get the current user's ID for the self-detection comparison (`admin._id === user?.id`)

#### Section 3: Pending Invitations
- A table listing admins who have been invited but haven't set up their account yet
- Columns: Email, Invited By, Invited date, Status, Actions
- Status shows "Pending" (yellow badge) or "Expired" (red badge)
- Expired invitations have a "Resend" button to send a new invitation email

**Functions:**

| Function | Description |
|---|---|
| `fetchData()` | Fetches both admin list and pending invites in parallel using `Promise.all` |
| `onSubmit(e)` | Handles the invite form submission — sends email to backend |
| `handleResend(email)` | Re-sends an invitation for an expired invite |
| `handleRemove(id)` | Shows confirmation dialog, then calls DELETE endpoint to remove an admin |

---

### 4. `client/src/pages/admin/AdminSetupPassword.js`

**Purpose:** A public page (no login required) where invited admins set up their account by choosing a name and password.

**URL:** `/admin/setup-password?token=<invitation-token>`

**States:**

1. **No token in URL** → Shows "Invalid Link" message
2. **Form state** → Shows a form with three fields:
   - Your Name (text input)
   - Password (minimum 8 characters)
   - Confirm Password (must match)
3. **Success state** → Shows "Account Ready!" message with a button to go to admin login

**Validation:**
- Client-side: Checks passwords match and are at least 8 characters
- Server-side: Zod schema validates token, name length, and password length

**Flow:** On form submit, calls `POST /api/admin/setup-password` with the token, name, and password. The backend verifies the token, hashes the password, activates the account, and deletes the token.

---

## Files Modified

### 5. `server/src/services/emailService.js`

**What was added:** A new exported function `sendAdminInviteEmail`.

#### `sendAdminInviteEmail(user, invitedByUserId)`

**Purpose:** Creates an invitation token and sends an email to the invited admin.

**Steps:**
1. Deletes any existing invite tokens for this user (ensures single-use)
2. Generates a random 32-byte hex token using `crypto.randomBytes(32)`
3. Creates an `AdminInviteToken` document with 48-hour expiry
4. Constructs the setup URL: `{CLIENT_URL}/admin/setup-password?token={token}`
5. Sends an HTML email with:
   - Subject: "You have been invited as an Admin - Influspark"
   - Body: Greeting, explanation, teal-colored CTA button linking to the setup URL
   - Fallback text link for email clients that don't render HTML
6. In development mode (no SMTP configured), logs the setup URL to the console with `[DEV]` prefix

**Returns:** `{ token, setupUrl }` for potential use by the caller.

---

### 6. `server/src/controllers/adminController.js`

**What was added:** Four new controller methods and required imports (`crypto`, `bcrypt`, `AdminInviteToken`, `sendAdminInviteEmail`).

#### `exports.inviteAdmin(req, res)`

**Purpose:** Handles the admin invitation process.

**Logic:**
1. Extracts `email` from the validated request body
2. Checks if a user with that email already exists:
   - If the user is an **active admin** (verified) → Returns 409 error: "This email already belongs to an active admin"
   - If the user is a **pending admin** (not yet verified) → Re-sends the invitation email and returns success
   - If the user exists with a **different role** (hotel_owner, influencer) → Returns 409 error: "This email is already registered with a different role"
3. If no user exists:
   - Generates a random temporary password (32-byte hex), hashes it with bcrypt (12 rounds)
   - Creates a new User with `role: 'admin'`, `status: 'pending_verification'`, `name: 'Pending Admin'`, `isEmailVerified: false`
   - Sends the invitation email via `sendAdminInviteEmail`
   - Returns 201 with success message

**Why a temporary password?** The User model requires `passwordHash` to be set. The temporary password is a cryptographically random string that is hashed and never shared — the invited admin sets their real password via the setup page.

---

#### `exports.setupAdminPassword(req, res)`

**Purpose:** Allows an invited admin to set their name and password to activate their account. This is a **public endpoint** (no authentication required) because the invited person doesn't have login credentials yet.

**Logic:**
1. Extracts `token`, `name`, and `password` from the validated request body
2. Finds the `AdminInviteToken` by token string
3. Validates: token must exist and not be expired (`expiresAt < now`)
4. Finds the associated user by `record.userId`
5. Updates the user:
   - `name` → The name they chose
   - `passwordHash` → Their chosen password, hashed with bcrypt (12 rounds)
   - `status` → Changed from `'pending_verification'` to `'active'`
   - `isEmailVerified` → Set to `true`
6. Deletes all invite tokens for this user (single-use enforcement)
7. Returns success message: "Account set up successfully. Please log in."

---

#### `exports.listAdmins(req, res)`

**Purpose:** Returns all active, verified admins for the "All Admins" table.

**Logic:**
1. Queries users where `role: 'admin'`, `isEmailVerified: true`, `status: 'active'`
2. Selects only `name`, `email`, `createdAt` fields (excludes sensitive data)
3. Sorts by `createdAt` ascending (oldest admins first)
4. Returns `{ admins: [...] }`

---

#### `exports.removeAdmin(req, res)`

**Purpose:** Removes an admin from the platform.

**Logic:**
1. Extracts `id` from route params
2. **Self-removal check:** Compares `req.user._id` (logged-in admin) with the target `id` — if they match, returns 400 error: "You cannot remove yourself"
3. Finds the user by ID, validates they exist and have `role: 'admin'`
4. Deletes any associated `AdminInviteToken` documents (cleanup)
5. Deletes the user from the database using `User.findByIdAndDelete`
6. Returns success message: "Admin removed successfully"

---

#### `exports.listPendingInvites(req, res)`

**Purpose:** Returns all pending (not yet activated) admin invitations for the "Pending Invitations" table.

**Logic:**
1. Queries users where `role: 'admin'`, `isEmailVerified: false`, `status: 'pending_verification'`
2. For each pending admin, looks up their `AdminInviteToken` to get:
   - `invitedBy` — Populated with the inviting admin's `name` and `email`
   - `expiresAt` — Token expiration time
   - `expired` — Boolean: `true` if token has expired
3. Returns `{ invites: [...] }` with combined user + token data

---

### 7. `server/src/routes/admin.js`

**What was added:** Three new routes and required imports (`validate`, `adminValidators`).

| Method | Route | Auth | Middleware | Controller | Description |
|---|---|---|---|---|---|
| POST | `/api/admin/setup-password` | Public | `validate(setupAdminPasswordSchema)` | `setupAdminPassword` | Invited admin sets up their account |
| POST | `/api/admin/invite` | Admin only | `validate(inviteAdminSchema)` | `inviteAdmin` | Send invitation to a new admin |
| GET | `/api/admin/invites` | Admin only | — | `listPendingInvites` | List pending invitations |
| GET | `/api/admin/admins` | Admin only | — | `listAdmins` | List all active admins |
| DELETE | `/api/admin/admins/:id` | Admin only | — | `removeAdmin` | Remove an admin |

**Critical:** The `POST /setup-password` route is placed **before** the `router.use(authenticate, roleGuard('admin'))` middleware. This is necessary because invited admins don't have credentials yet — they need this public endpoint to create their password.

---

### 8. `client/src/App.js`

**What was added:**

1. **Imports:** `AdminSettings` and `AdminSetupPassword` page components
2. **Navigation:** Added `{ to: '/admin/settings', label: 'Settings' }` to the `adminNav` array — this adds a "Settings" link in the admin sidebar
3. **Public route:** `<Route path="/admin/setup-password" element={<AdminSetupPassword />} />` — accessible without login
4. **Protected route:** `<Route path="settings" element={<AdminSettings />} />` — nested inside the admin protected layout, requires admin authentication

---

## Complete User Flow

### Inviting a New Admin

```
Admin logs in → Settings page → Enters email → Clicks "Send Invite"
     ↓
Backend creates User (role=admin, status=pending_verification)
     ↓
Backend creates AdminInviteToken (48h expiry)
     ↓
Email sent with setup link → /admin/setup-password?token=abc123
```

### New Admin Setting Up Account

```
New admin clicks email link → Setup Password page
     ↓
Enters name + password + confirm password → Clicks "Set Up Account"
     ↓
Backend validates token → Hashes password → Updates user (status=active)
     ↓
Deletes invite token → Shows success → Redirects to /admin login
```

### Removing an Admin

```
Admin logs in → Settings page → All Admins table
     ↓
Clicks "Remove" on another admin → Confirmation dialog → Confirms
     ↓
Backend validates not self-removal → Deletes user + tokens
     ↓
Table refreshes → Removed admin can no longer log in
```

---

## Security Measures

| Measure | Description |
|---|---|
| **Self-removal prevention** | Backend rejects self-removal (400 error) + frontend hides Remove button for current user |
| **Token expiration** | Invite tokens expire after 48 hours, auto-deleted by MongoDB TTL index |
| **Single-use tokens** | Previous tokens are deleted before creating new ones; tokens deleted after use |
| **Temporary password** | Placeholder password is a 32-byte random hex, hashed with bcrypt — cannot be guessed |
| **Role validation** | All admin endpoints (except setup) are protected by `authenticate` + `roleGuard('admin')` |
| **Input validation** | Zod schemas validate email format, name length (2-100), password length (8-128) |
| **No email enumeration** | Only authenticated admins can call the invite endpoint, so specific error messages are acceptable |
| **Password hashing** | bcrypt with 12 salt rounds for all passwords |
