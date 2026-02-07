# Admin User Preview Feature - Documentation

## Overview

Added a "View" button to the admin dashboard Users tab that opens a detailed preview page for any user account. This allows admins to inspect user profiles, hotels, campaigns, reviews, and ban history without leaving the admin panel.

---

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `server/src/controllers/adminController.js` | Modified | Added `getUserById` controller function |
| `server/src/routes/admin.js` | Modified | Registered `GET /users/:id` route |
| `client/src/pages/admin/AdminUserPreview.js` | Created | New user preview page component |
| `client/src/pages/admin/AdminUsers.js` | Modified | Added "View" button to each table row |
| `client/src/App.js` | Modified | Registered `/admin/users/:id` route |

---

## Backend Implementation

### 1. Controller: `getUserById` (`server/src/controllers/adminController.js`)

New function added to fetch comprehensive data about a single user.

**New Model Imports Added:**
- `Hotel` - to fetch hotels owned by hotel_owner users
- `HotelOwnerProfile` - to fetch owner profile details (company, phone, bio)
- `Review` - to fetch reviews received by the user

**Function Logic:**

```
exports.getUserById = async (req, res) => { ... }
```

The function performs the following steps:

1. **Fetch base user info** - Uses `User.findById()` with `.select('-passwordHash -refreshToken')` to exclude sensitive fields.

2. **Fetch role-specific profile data:**
   - If `hotel_owner`:
     - Queries `HotelOwnerProfile.findOne({ userId })` for owner profile (companyName, phone, bio, website, location)
     - Queries `Hotel.find({ ownerId })` for all hotels (name, city, starRating, isActive, featureImage, location)
   - If `influencer`:
     - Queries `InfluencerProfile.findOne({ userId })` for influencer profile (displayName, bio, niche, location, avatar, collaborationTypes, linkedPlatforms)

3. **Fetch recent campaigns (limit 10):**
   - For `hotel_owner`: first finds all hotel IDs via `Hotel.find({ ownerId })`, then queries `Campaign.find({ hotelId: { $in: hotelIds } })`
   - For `influencer`: queries `Campaign.find({ influencerId: userId })`
   - Uses `.populate('hotelId', 'name city')` and `.populate('influencerId', 'name')` to include related names

4. **Fetch reviews received** - Uses `Review.find({ revieweeId: userId })` with `.populate('reviewerId', 'name')` and `.populate('campaignId', 'title')` to show reviewer name and campaign title.

5. **Fetch ban history** - Uses `BanLog.find({ userId })` with `.populate('adminId', 'name')` to show which admin performed each action.

**Response Shape:**
```json
{
  "user": { "name", "email", "role", "status", "isEmailVerified", "createdAt" },
  "ownerProfile": { "companyName", "phone", "bio", "website", "location" },
  "hotels": [{ "name", "city", "starRating", "isActive", "featureImage" }],
  "influencerProfile": { "displayName", "bio", "niche", "avatar", ... },
  "campaigns": [{ "title", "status", "startDate", "endDate", "hotelId", ... }],
  "reviews": [{ "rating", "comment", "reviewerId", "campaignId", "createdAt" }],
  "banHistory": [{ "action", "reason", "adminId", "createdAt" }]
}
```

### 2. Route Registration (`server/src/routes/admin.js`)

Added one line after the existing `GET /users` route:

```
router.get('/users/:id', admin.getUserById);
```

This route is protected by `authenticate` and `roleGuard('admin')` middleware (applied via `router.use()` above it), so only authenticated admin users can access it.

---

## Frontend Implementation

### 3. AdminUserPreview Page (`client/src/pages/admin/AdminUserPreview.js`)

New React component that displays the full user preview. Follows the same pattern as `AdminCollaborationDetail.js`.

**React Hooks Used:**
- `useParams()` - extracts the `:id` parameter from the URL
- `useNavigate()` - for the "Back to Users" button navigation
- `useState()` - manages `data`, `loading`, and `error` states
- `useEffect()` - triggers data fetch on mount
- `useCallback()` - memoizes the `load` function to prevent unnecessary re-renders

**API Call:**
```js
const { data: res } = await api.get(`/admin/users/${id}`);
```

**Page Sections:**

| Section | What It Shows |
|---------|--------------|
| Back Button | Navigates to `/admin/users` |
| PageHeader | User name + "User Details" subtitle |
| User Info Card | Email, role, status badge, email verified badge, join date |
| Ban/Unban Actions | Ban button (for non-admin active users) or Unban button (for banned users) |
| Owner Profile | Company name, phone, location, website, bio (only for hotel_owner) |
| Hotels Grid | 2-column grid of hotel cards with image, name, city, star rating, active status (only for hotel_owner) |
| Influencer Profile | Avatar, display name, niche, location, bio, collaboration types as tags, linked platforms as tags (only for influencer) |
| Recent Campaigns | Table with title, hotel name, status badge, date range |
| Reviews Received | Cards with reviewer name, campaign title, star rating, comment, date |
| Ban History | Table with action badge (ban/unban), admin name, reason, date |

**Styled Components Used:**
- `BackRow` - margin wrapper for back button
- `Grid` - 2-column responsive grid (collapses to 1 column on mobile)
- `Section`, `SectionTitle` - section wrapper with heading
- `InfoRow`, `InfoLabel`, `InfoValue` - key-value display rows
- `Avatar` - circular image container (64px)
- `ProfileHeader`, `ProfileName`, `ProfileMeta` - profile header layout
- `HotelCard`, `HotelImage`, `HotelInfo`, `HotelName`, `HotelMeta` - hotel card layout
- `Table`, `Th`, `Td` - data tables for campaigns and ban history
- `TagList`, `Tag` - tag/chip display for collaboration types and platforms
- `Stars` - golden star rating display
- `ReviewCard`, `ReviewHeader`, `ReviewerName`, `ReviewDate`, `ReviewComment` - review card layout
- `ActionRow` - flex container for action buttons
- `EmptyText` - centered placeholder text for empty sections

**Reused UI Components (from `components/ui/`):**
- `Card` - container with border and shadow
- `Button` - with variants: `ghost` (back, view), `primary` (unban), `danger` (ban)
- `Badge` - status indicators with variants: `active`, `banned`, `pending`, `info`
- `PageHeader` - page title and subtitle

**Helper Functions:**
- `statusVariant(status)` - maps user status to Badge variant
- `campaignStatusVariant` - object mapping campaign status to Badge variant
- `formatDate(d)` - formats dates as "Jan 1, 2025" format
- `renderStars(rating)` - renders filled/empty star characters for ratings

**Ban/Unban Functions:**
- `handleBan()` - confirms with `window.confirm()`, then calls `POST /admin/users/:id/ban`, reloads data
- `handleUnban()` - calls `POST /admin/users/:id/unban`, reloads data

### 4. AdminUsers Table Update (`client/src/pages/admin/AdminUsers.js`)

**Changes:**
- Added `import { useNavigate } from 'react-router-dom'`
- Added `const navigate = useNavigate()` inside the component
- Added a "View" `<Button>` in the Actions column before Ban/Unban buttons
- Added `style={{ display: 'flex', gap: '4px', alignItems: 'center' }}` on the Actions `<Td>` for spacing between buttons

**View Button:**
```jsx
<Button $variant="ghost" $size="sm" onClick={() => navigate(`/admin/users/${u._id}`)}>
  View
</Button>
```

### 5. Route Registration (`client/src/App.js`)

**Changes:**
- Added import: `import AdminUserPreview from './pages/admin/AdminUserPreview'`
- Added route inside the admin route group:
```jsx
<Route path="users/:id" element={<AdminUserPreview />} />
```

This is placed after `<Route path="users" ...>` so React Router matches the specific `:id` route correctly.

---

## User Flow

1. Admin logs in and navigates to **Users** tab
2. Each user row now has a **View** button alongside Ban/Unban
3. Clicking **View** navigates to `/admin/users/:id`
4. The preview page loads and displays all user information in organized sections
5. Admin can **Ban** or **Unban** the user directly from the preview page
6. Clicking **Back to Users** returns to the users list

---

## Mongoose Functions Used

| Function | Where Used | Purpose |
|----------|-----------|---------|
| `Model.findById(id)` | getUserById | Find user by MongoDB ObjectId |
| `Model.findOne(filter)` | getUserById | Find single profile document |
| `Model.find(filter)` | getUserById | Find multiple documents (hotels, campaigns, reviews, ban logs) |
| `.select('field1 field2')` | getUserById | Include only specific fields in query results |
| `.select('-field')` | getUserById | Exclude specific fields (passwordHash, refreshToken) |
| `.populate('ref', 'fields')` | getUserById | Join referenced documents and include specific fields |
| `.sort({ field: -1 })` | getUserById | Sort results descending by field |
| `.limit(n)` | getUserById | Limit number of results returned |
| `.toObject()` | getUserById | Convert Mongoose document to plain JavaScript object |
