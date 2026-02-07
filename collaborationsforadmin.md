# Admin Collaborations Feature - Implementation Documentation

## Overview

Added a **Collaborations** section to the Admin Panel that allows admins to view all platform collaborations (campaigns) between hotel owners and influencers. The feature includes a searchable, filterable list view and a detailed read-only view for each collaboration.

---

## Files Modified

### 1. `server/src/controllers/adminController.js`

**What changed:** Added two new controller methods and two new model imports.

**New imports at the top:**

```js
const Campaign = require('../models/Campaign');
const InfluencerProfile = require('../models/InfluencerProfile');
```

These were needed because the admin needs to query campaigns and enrich them with influencer profile data (display name, avatar, niche, location).

**New method: `exports.listCampaigns`**

- Accepts query parameters: `status`, `search`, `page`, `limit`
- Builds a MongoDB filter object — if a `status` is provided (e.g., `pending`, `ongoing`), it filters campaigns by that status
- Fetches campaigns using `Campaign.find(filter)` with three `.populate()` calls:
  - `hotelId` → pulls in hotel `name`, `city`, `location`, `featureImage`
  - `influencerId` → pulls in user `name`, `email`
  - `createdBy` → pulls in creator `name`
- Results are sorted by `createdAt: -1` (newest first) and paginated via `.skip()` and `.limit()`
- **Enrichment step:** For each campaign, queries `InfluencerProfile` by `userId` to get the influencer's `displayName`, `avatar`, `niche`, and `location`. This is necessary because the `influencerId` field on Campaign points to the User model, not the InfluencerProfile model, so profile data must be fetched separately.
- **Search step:** If a `search` query is provided, filters the enriched results using a case-insensitive regex against the campaign `title`, `hotelId.name`, `influencerDisplayName`, and `influencerId.name`. Search is applied after enrichment so it can match against influencer profile display names.
- Returns `{ campaigns, total, page, limit }`

**New method: `exports.getCampaignById`**

- Finds a single campaign by `req.params.id`
- Same populate and enrichment logic as `listCampaigns` but for a single document
- Returns `404` if campaign not found
- Returns `{ campaign }` with all enriched data

---

### 2. `server/src/routes/admin.js`

**What changed:** Added two new route definitions after the existing admin routes.

```js
router.get('/campaigns', admin.listCampaigns);
router.get('/campaigns/:id', admin.getCampaignById);
```

These routes sit under the `router.use(authenticate, roleGuard('admin'))` middleware, so they are protected — only authenticated admin users can access them. No additional middleware was needed since the existing auth + role guard chain covers them.

**API endpoints created:**
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/admin/campaigns` | List all campaigns with optional `status`, `search`, `page`, `limit` query params |
| GET | `/api/admin/campaigns/:id` | Get a single campaign's full details |

---

## Files Created

### 3. `client/src/pages/admin/AdminCollaborations.js`

**Purpose:** The main list page for admin collaborations, accessible at `/admin/collaborations`.

**How it works:**

- **State management:** Uses React `useState` for `campaigns`, `statusFilter`, `search`, `debouncedSearch`, and `loading`
- **Debounced search:** When the user types in the search input, a `useEffect` with a 400ms `setTimeout` delays updating `debouncedSearch`. This prevents firing an API call on every keystroke — the request only goes out 400ms after the user stops typing.
- **Data fetching:** A `useCallback`-wrapped `fetchCampaigns` function calls `GET /admin/campaigns` with the current `statusFilter` and `debouncedSearch` as query params. It runs whenever either value changes (via a `useEffect` dependency).
- **Status filter buttons:** Renders a row of `FilterBtn` components for each possible status: All, Pending, Upcoming, Ongoing, Completed, Cancelled, Rejected. The active filter uses `$variant="primary"`, others use `$variant="ghost"`. Clicking a button sets `statusFilter` which triggers a re-fetch.
- **Search input:** A styled `<input>` element that searches by campaign title, hotel name, or influencer name.
- **Table:** Displays campaigns in a table with columns:
  - **Title** — campaign title
  - **Hotel** — hotel name from populated `hotelId`
  - **Influencer** — influencer display name from enriched profile, falls back to user name
  - **Type** — campaign type displayed with human-readable labels (Free Stay, Paid Collaboration, Discount Stay)
  - **Status** — shown as a colored `Badge` component using the same variant mapping as the rest of the platform (pending=yellow, upcoming=blue, ongoing/done=green, cancelled/rejected=red)
  - **Created** — formatted creation date
  - **Actions** — a "View" button that navigates to `/admin/collaborations/:id`
- **Empty state:** Shows "Loading..." while fetching, "No collaborations found" when no results match

**Styled components used:** All styled components (`ToolbarRow`, `Filters`, `FilterBtn`, `SearchInput`, `Table`, `Th`, `Td`, `TypeLabel`) follow the exact same patterns used in `AdminUsers.js` to maintain visual consistency across the admin panel. They use theme tokens for spacing, colors, typography, and border radius.

---

### 4. `client/src/pages/admin/AdminCollaborationDetail.js`

**Purpose:** A read-only detail view for a single collaboration, accessible at `/admin/collaborations/:id`.

**How it works:**

- **Route params:** Uses `useParams()` to extract the campaign `id` from the URL
- **Data fetching:** Calls `GET /admin/campaigns/:id` on mount via a `useCallback` + `useEffect` pattern
- **Loading/error states:** Shows a centered loading message or error message inside a `Card` component
- **Back navigation:** A "Back to Collaborations" ghost button at the top that navigates to `/admin/collaborations`
- **Page header:** Displays the campaign title as the page heading

**Sections displayed:**

1. **Status & Type Card** — Shows:
   - Status as a colored Badge
   - Campaign type as an info Badge
   - Date range (start — end) formatted as "Month Day, Year"
   - Created by name with their role (hotel owner / influencer)
   - Creation date

2. **Cancellation Reason** — Only shown when `status === 'cancelled'` and a `cancelReason` exists. Rendered in a red-tinted box (`CancelReasonBox`) with an uppercase label, matching the style used in the existing `CampaignDetail` component.

3. **Parties Grid** — A two-column responsive grid showing:
   - **Hotel card** — Hotel feature image (thumbnail), name, city/location
   - **Influencer card** — Avatar (round), display name, niche/location
   - On mobile (below `breakpoints.sm`), collapses to a single column

4. **Campaign Description** — Shown in a Card with `white-space: pre-wrap` to preserve line breaks from the original text

**Key difference from user-facing CampaignDetail:** This admin version is read-only. It does not include:
- Action buttons (approve, reject, start, cancel, mark as done)
- Review section
- Cancel modal
- Any status change functionality

This is intentional — admins should be able to view and monitor collaborations, but status changes remain the responsibility of the participating hotel owner and influencer.

**Styled components:** Reuses the same component patterns from the existing `CampaignDetail.js` component (`Grid`, `InfoRow`, `InfoLabel`, `InfoValue`, `PartyCard`, `Avatar`, `Description`, `CancelReasonBox`, etc.) to maintain visual consistency.

---

### 5. `client/src/App.js`

**What changed:** Three modifications to wire everything together.

**a) New imports added:**

```js
import AdminCollaborations from './pages/admin/AdminCollaborations';
import AdminCollaborationDetail from './pages/admin/AdminCollaborationDetail';
```

**b) Admin navigation updated:**

```js
const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/collaborations', label: 'Collaborations' },  // NEW
  { to: '/admin/settings', label: 'Settings' },
];
```

The "Collaborations" nav item is placed between "Users" and "Settings" in the sidebar. The `DashboardLayout` component passes this array to the `Sidebar`, which renders each item as a `NavLink` with active state highlighting.

**c) New routes registered:**

```jsx
<Route path="collaborations" element={<AdminCollaborations />} />
<Route path="collaborations/:id" element={<AdminCollaborationDetail />} />
```

These sit inside the existing admin `ProtectedRoute` wrapper, so they inherit the `role="admin"` guard — only authenticated admin users can access them.

---

## Data Flow Summary

```
Admin clicks "Collaborations" in sidebar
  → Navigates to /admin/collaborations
  → AdminCollaborations component mounts
  → Calls GET /api/admin/campaigns
  → Backend: authenticate → roleGuard('admin') → adminController.listCampaigns
  → Queries Campaign collection with optional status filter
  → Populates hotelId, influencerId, createdBy references
  → Enriches each campaign with InfluencerProfile data
  → Applies search filter if provided
  → Returns paginated results
  → Frontend renders table with status badges and View buttons

Admin clicks "View" on a campaign
  → Navigates to /admin/collaborations/:id
  → AdminCollaborationDetail component mounts
  → Calls GET /api/admin/campaigns/:id
  → Backend returns single enriched campaign
  → Frontend renders read-only detail view
```

---

## Status Badge Color Mapping

| Status | Badge Variant | Color |
|--------|--------------|-------|
| Pending | `pending` | Yellow/amber |
| Upcoming | `info` | Blue |
| Ongoing | `active` | Green |
| Completed | `active` | Green |
| Cancelled | `banned` | Red |
| Rejected | `banned` | Red |

---

## Campaign Type Labels

| Database Value | Display Label |
|---------------|---------------|
| `free_stay` | Free Stay |
| `paid_collaboration` | Paid Collaboration |
| `discount_stay` | Discount Stay |
