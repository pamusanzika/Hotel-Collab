# Influencers Tab — Full Implementation Documentation

## Overview

Added an **Influencers** tab to the Hotel Owner (Host) dashboard that allows hosts to browse all registered influencers on the platform. This mirrors the existing "Hosts" tab on the influencer side, but in reverse — hotel owners can now discover and view influencer profiles.

---

## What Was Built

### Feature Summary

| Feature | Description |
|---------|-------------|
| Influencers sidebar item | New navigation link visible only to `hotel_owner` users |
| Influencer Listing page | Card grid showing all registered influencers with search |
| Influencer Profile page | Detailed view of a single influencer's full profile |
| Backend API | Two new endpoints protected by `hotel_owner` role guard |

---

## Files Created (4 new files)

### 1. `server/src/controllers/influencerListingController.js`

**Purpose:** Backend logic for fetching influencer data.

**Two exported functions:**

- **`listAll(req, res)`**
  - Finds all users with `role: 'influencer'` and `status: 'active'`
  - Queries `InfluencerProfile` documents belonging to those active users
  - Supports optional `?search=` query parameter that filters by `displayName`, `niche`, and `location` using case-insensitive regex
  - Returns `{ influencers: [...] }` sorted by newest first

- **`getById(req, res)`**
  - Finds a single `InfluencerProfile` by its `_id`
  - Verifies the associated user is still active
  - Joins basic user info (`name`, `email`) from the `User` model
  - Returns `{ influencer: { ...profileData, userName, userEmail } }`
  - Returns 404 if profile not found or user is inactive

---

### 2. `server/src/routes/influencerListing.js`

**Purpose:** Express route definitions for the influencer listing API.

- Applies `authenticate` middleware (JWT verification) to all routes
- Applies `roleGuard('hotel_owner')` — only hotel owners can access these endpoints
- `GET /` → calls `listAll` controller
- `GET /:id` → calls `getById` controller

**API Endpoints (after mounting):**
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/influencer-listing` | List all influencers (with optional `?search=`) |
| GET | `/api/influencer-listing/:id` | Get single influencer by profile ID |

---

### 3. `client/src/pages/owner/InfluencersListing.js`

**Purpose:** The Influencer Listing page shown when a host clicks "Influencers" in the sidebar.

**Features:**
- **Page header** with title "Influencers" and subtitle
- **Search bar** at the top — filters influencers by name and type/niche in real time (client-side filtering using `useMemo`)
- **Card grid layout** — responsive grid using `repeat(auto-fill, minmax(300px, 1fr))`
- **Each influencer card displays:**
  - Profile picture (or "No Photo" placeholder if no avatar)
  - Display name
  - Type/niche
- **Card hover effect** — lifts up with shadow on hover
- **Click behavior** — clicking any card navigates to `/owner/influencers/:id`
- **States handled:**
  - Loading state while fetching data
  - Error state if API call fails
  - Empty state if no influencers exist or none match the search

**Data flow:**
1. On mount, calls `GET /api/influencer-listing`
2. Stores all influencers in state
3. Search input filters the stored list client-side (no additional API calls)

---

### 4. `client/src/pages/owner/InfluencerProfileView.js`

**Purpose:** Detailed profile page shown when a host clicks on an influencer card.

**Layout sections (top to bottom):**
1. **Page header** — "Influencer Profile" title
2. **Avatar hero** — large circular profile picture (160px), centered
3. **Name & niche** — centered display name, niche/type, and location
4. **Bio section** — card with the influencer's bio text (if available)
5. **Details grid** — 2-column responsive grid showing:
   - **Collaboration Types** — badges for Free Stay, Discount Stay, Paid Collaboration
   - **Location** — text display
   - **Linked Platforms** — badges showing connected social platforms (YouTube, Instagram, TikTok) with usernames
6. **Back button** — "Back to Influencers" navigates to the listing page

**Data flow:**
1. Reads `:id` from URL params
2. Calls `GET /api/influencer-listing/:id`
3. Renders the full influencer profile

---

## Files Modified (2 existing files)

### 5. `server/src/routes/index.js`

**Changes made:**
- Added import: `const influencerListingRoutes = require('./influencerListing');`
- Added route mount: `router.use('/influencer-listing', influencerListingRoutes);`

This makes the API accessible at `/api/influencer-listing` and `/api/influencer-listing/:id`.

---

### 6. `client/src/App.js`

**Three changes made:**

1. **Added imports** (after existing owner page imports):
   ```javascript
   import InfluencersListing from './pages/owner/InfluencersListing';
   import InfluencerProfileView from './pages/owner/InfluencerProfileView';
   ```

2. **Added navigation item** to `ownerNav` array (between Hotels and Collaborations):
   ```javascript
   { to: '/owner/influencers', label: 'Influencers' },
   ```
   This makes "Influencers" appear in the sidebar for hotel owners.

3. **Added two routes** inside the `/owner` route group:
   ```jsx
   <Route path="influencers" element={<InfluencersListing />} />
   <Route path="influencers/:id" element={<InfluencerProfileView />} />
   ```

---

## How It Works End-to-End

### User Flow

1. A hotel owner logs into the platform
2. They see "Influencers" in the left sidebar navigation
3. Clicking it loads the Influencer Listing page at `/owner/influencers`
4. The page fetches all influencer profiles from the API
5. Influencer cards appear in a grid — each showing photo, name, and type
6. The host can type in the search bar to filter by name or type
7. Clicking any card navigates to `/owner/influencers/:id`
8. The full influencer profile loads showing all details
9. The "Back to Influencers" button returns to the listing

### Security

- The sidebar item only appears for users with the `hotel_owner` role (handled by `ProtectedRoute` in App.js)
- The API endpoints are protected by JWT authentication and `roleGuard('hotel_owner')` middleware
- Only profiles of active influencer users are returned (inactive/banned users are excluded)

---

## Patterns Followed

This implementation mirrors the existing **Hosts** feature on the influencer side:

| Influencer Side (existing) | Owner Side (new) |
|---------------------------|------------------|
| `HostsListing.js` | `InfluencersListing.js` |
| `HostDetails.js` | `InfluencerProfileView.js` |
| `hostController.js` | `influencerListingController.js` |
| `routes/hosts.js` | `routes/influencerListing.js` |
| `GET /api/hosts` | `GET /api/influencer-listing` |
| `GET /api/hosts/:id` | `GET /api/influencer-listing/:id` |
| `roleGuard('influencer')` | `roleGuard('hotel_owner')` |

All styling uses **styled-components** with the existing theme system. All UI components (`Card`, `Badge`, `Button`, `Input`, `PageHeader`) are reused from the shared component library. No new dependencies were added.
