# Hosts Dashboard Feature — Full Implementation Documentation

## Overview

This document describes the complete implementation of the **Hosts** feature for the Influencer role in the Hotel-Influencer Platform. The feature allows influencers to browse all registered hotels/hosts, search through them, and view detailed information about each host.

---

## Table of Contents

1. [Feature Requirements](#feature-requirements)
2. [Architecture Decisions](#architecture-decisions)
3. [Backend Changes](#backend-changes)
4. [Frontend Changes](#frontend-changes)
5. [File Summary](#file-summary)
6. [How It Works End-to-End](#how-it-works-end-to-end)
7. [API Reference](#api-reference)
8. [Search Functionality](#search-functionality)
9. [Security & Access Control](#security--access-control)

---

## Feature Requirements

- Add a **"Hosts"** navigation item visible **only** to users logged in with the **Influencer** role.
- Clicking "Hosts" opens a **Hosts Listing Page** displaying all registered hotels/hosts in a **card view**.
- A **search bar** filters hosts dynamically by: name, city, location, and availability.
- Each host card shows: feature image, name, location, and availability status.
- Clicking a host card navigates to a **Host Details Page** showing: description, images, location details, and collaboration information.

---

## Architecture Decisions

### Why a separate `/api/hosts` endpoint instead of reusing `/api/hotels`?

The existing `/api/hotels` route is locked down to `hotel_owner` role only (via `roleGuard('hotel_owner')` applied to the entire router). It also scopes queries to `ownerId: req.user._id`, meaning owners can only see their own hotels. Creating a new `/api/hosts` endpoint with `roleGuard('influencer')` keeps the separation of concerns clean — owners manage their hotels, influencers browse all active hosts.

### Why client-side filtering instead of server-side search?

The initial data fetch retrieves all active hotels from `GET /api/hosts`. The search/filter is performed client-side using `useMemo` for instant, responsive filtering as the user types. This avoids a network request on every keystroke. For a platform with thousands of hotels, this could be moved to server-side search with debounced API calls, but for the current scale, client-side filtering provides the best user experience.

---

## Backend Changes

### 1. Host Controller — `server/src/controllers/hostController.js` (NEW)

This is a new controller file with two exported functions:

#### `listAll(req, res)`

- Queries the `Hotel` model for all documents where `isActive: true`.
- Supports an optional `search` query parameter.
- If `search` is provided, it builds a MongoDB `$or` query with case-insensitive regex matching across four fields: `name`, `city`, `location`, and `availability.status`.
- Returns only the fields needed for the listing cards: `name`, `description`, `location`, `city`, `featureImage`, `images`, `collaborationTypes`, `availability`, `starRating`.
- Results are sorted by `createdAt` descending (newest first).

#### `getById(req, res)`

- Finds a single hotel by `_id` where `isActive: true`.
- Returns the full hotel document (all fields).
- Returns 404 if no matching active hotel is found.

```javascript
// Example: listAll with search
const filter = { isActive: true };
if (search) {
  const regex = new RegExp(search, 'i');
  filter.$or = [
    { name: regex },
    { city: regex },
    { location: regex },
    { 'availability.status': regex },
  ];
}
const hotels = await Hotel.find(filter).select('name description location city featureImage images collaborationTypes availability starRating').sort({ createdAt: -1 });
```

### 2. Host Routes — `server/src/routes/hosts.js` (NEW)

This is a new route file that:

- Imports the `authenticate` middleware (JWT verification) and `roleGuard` middleware.
- Applies `authenticate` and `roleGuard('influencer')` to **all routes** in the router — only authenticated influencers can access these endpoints.
- Defines two routes:
  - `GET /` → `hosts.listAll` — List all active hotels
  - `GET /:id` → `hosts.getById` — Get a single hotel's full details

```javascript
router.use(authenticate, roleGuard('influencer'));
router.get('/', hosts.listAll);
router.get('/:id', hosts.getById);
```

### 3. Route Registration — `server/src/routes/index.js` (MODIFIED)

Two lines were added to the existing route index file:

- **Line 7**: `const hostRoutes = require('./hosts');` — Import the new hosts route module.
- **Line 16**: `router.use('/hosts', hostRoutes);` — Mount it at `/api/hosts`.

This means:
- `GET /api/hosts` → Lists all active hotels (influencer only)
- `GET /api/hosts/:id` → Gets hotel details (influencer only)

---

## Frontend Changes

### 4. Hosts Listing Page — `client/src/pages/influencer/HostsListing.js` (NEW)

A full React page component for browsing all hosts. Here's what it contains:

#### Styled Components

| Component | Purpose |
|-----------|---------|
| `SearchBar` | Wrapper for the search input with bottom margin |
| `SearchInput` | Extends the existing `Input` component, max-width 480px |
| `Grid` | CSS Grid with `auto-fill`, min column width 300px |
| `HostCard` | Extends `Card` with zero padding, hover lift effect (translateY + shadow) |
| `CardImage` | 200px tall container for the feature image |
| `NoImage` | Placeholder shown when no image is available |
| `CardBody` | Padded content area below the image |
| `HostName` | Hotel name in semibold, large font |
| `LocationText` | Location in secondary color, smaller font |
| `CardFooter` | Bottom section with availability badge |
| `LoadingState` | Centered loading text |
| `ErrorState` | Centered error text in red |
| `EmptyState` | Message when no hosts are found |

#### State Management

```javascript
const [hotels, setHotels] = useState([]);    // All fetched hotels
const [loading, setLoading] = useState(true); // Loading state
const [error, setError] = useState('');        // Error message
const [search, setSearch] = useState('');       // Search input value
```

#### Data Fetching

On component mount (`useEffect` with empty dependency array), it calls `GET /api/hosts` via the axios instance. The response populates the `hotels` state.

#### Client-Side Search Filtering

Uses `useMemo` to efficiently filter hotels whenever `search` or `hotels` changes:

```javascript
const filtered = useMemo(() => {
  if (!search.trim()) return hotels;
  const term = search.toLowerCase();
  return hotels.filter(
    (h) =>
      h.name?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.location?.toLowerCase().includes(term) ||
      h.availability?.status?.toLowerCase().includes(term)
  );
}, [hotels, search]);
```

This provides instant filtering as the user types — no API calls needed.

#### Card Rendering

Each card displays:
- **Feature image** (or first image, or "No image available" placeholder)
- **Hotel name**
- **Location** (combines `location` and `city` fields)
- **Availability badge** — green "Available" or yellow "Unavailable"

Clicking a card navigates to `/influencer/hosts/:id`.

#### Image URL Resolution

Images are stored as relative paths (e.g., `/uploads/hotels/123.jpg`). The component prepends the API base URL:

```javascript
const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
// Result: http://localhost:5001/uploads/hotels/123.jpg
```

### 5. Host Details Page — `client/src/pages/influencer/HostDetails.js` (NEW)

A full React page for viewing detailed information about a single host. The design mirrors the existing `HotelPreview.js` page (used by hotel owners) but adapted for the influencer context.

#### Layout Sections

1. **Hero Image** — Full-width 340px tall image display with "Feature Image" badge
2. **Thumbnail Strip** — Horizontal scrollable row of clickable thumbnails (shown when 2+ images exist)
3. **Title & Location** — Hotel name (bold, 2xl) and location text
4. **Photos Gallery** — Grid of all images with feature badge indicator, clickable to change hero image
5. **Description** — "About this Hotel" card with pre-wrapped text
6. **Details Grid** — 2-column grid with:
   - **Collaboration Types** — Badges for each type (Free Stay, Discount Stay, Paid Collaboration)
   - **Availability** — Status badge + date range if available
   - **Location** — Full address and city
   - **Star Rating** — Visual star display (★★★☆☆ format)
7. **Back Button** — Ghost-style button navigating back to `/influencer/hosts`

#### Data Fetching

Reads the `:id` param from the URL and calls `GET /api/hosts/:id`:

```javascript
const { id } = useParams();
useEffect(() => {
  const { data } = await api.get(`/hosts/${id}`);
  setHotel(data.hotel);
}, [id]);
```

#### Image Navigation

Users can click thumbnails or gallery photos to change the hero image:

```javascript
const [activeImg, setActiveImg] = useState(0);
// Clicking a thumbnail: onClick={() => setActiveImg(idx)}
```

#### Collaboration Type Labels

Maps internal enum values to human-readable labels:

```javascript
const COLLAB_LABEL_MAP = {
  free_stay: 'Free Stay',
  discount_stay: 'Discount Stay',
  paid_collaboration: 'Paid Collaboration',
};
```

### 6. App.js Updates — `client/src/App.js` (MODIFIED)

Three changes were made to the main application file:

#### a) Imports (Lines 36-37)

```javascript
import HostsListing from './pages/influencer/HostsListing';
import HostDetails from './pages/influencer/HostDetails';
```

#### b) Navigation Config (Line 56)

Added `{ to: '/influencer/hosts', label: 'Hosts' }` to the `influencerNav` array:

```javascript
const influencerNav = [
  { to: '/influencer', label: 'Dashboard', end: true },
  { to: '/influencer/profile', label: 'Profile' },
  { to: '/influencer/hosts', label: 'Hosts' },          // ← NEW
  { to: '/influencer/campaigns', label: 'Campaigns' },
  { to: '/influencer/applications', label: 'Applications' },
  { to: '/influencer/settings', label: 'Settings' },
];
```

This array is passed to `<DashboardLayout navItems={influencerNav} />`, which renders the sidebar. The "Hosts" link only appears for influencers because the entire influencer route group is wrapped in `<ProtectedRoute role="influencer">`.

#### c) Routes (Lines 113-114)

Added two nested routes inside the influencer route group:

```jsx
<Route path="hosts" element={<HostsListing />} />
<Route path="hosts/:id" element={<HostDetails />} />
```

These resolve to:
- `/influencer/hosts` → Hosts listing page
- `/influencer/hosts/:id` → Host details page

---

## File Summary

| File | Status | Description |
|------|--------|-------------|
| `server/src/controllers/hostController.js` | NEW | Controller with `listAll` and `getById` functions |
| `server/src/routes/hosts.js` | NEW | Route definitions with auth + influencer role guard |
| `server/src/routes/index.js` | MODIFIED | Registered `/hosts` route (+2 lines) |
| `client/src/pages/influencer/HostsListing.js` | NEW | Card grid listing page with search |
| `client/src/pages/influencer/HostDetails.js` | NEW | Full host details page |
| `client/src/App.js` | MODIFIED | Added nav item, imports, and routes (+5 lines) |

---

## How It Works End-to-End

### User Flow

1. **Influencer logs in** → JWT tokens stored in localStorage, user object with `role: 'influencer'` loaded into AuthContext.
2. **Sidebar renders** → `DashboardLayout` receives `influencerNav` array, renders "Hosts" as a `<NavLink>` in the sidebar.
3. **Influencer clicks "Hosts"** → React Router navigates to `/influencer/hosts`, renders `<HostsListing />`.
4. **HostsListing mounts** → `useEffect` fires, calls `GET /api/hosts` with JWT in Authorization header.
5. **Server processes request** → `authenticate` middleware validates JWT, `roleGuard('influencer')` checks role, `hostController.listAll` queries MongoDB for all active hotels.
6. **Cards render** → Hotels displayed in responsive grid cards with images, names, locations, and availability badges.
7. **Influencer searches** → Typing in search bar triggers `useMemo` re-computation, filtering cards instantly.
8. **Influencer clicks a card** → `navigate('/influencer/hosts/:id')` triggers, `<HostDetails />` mounts.
9. **HostDetails fetches data** → Calls `GET /api/hosts/:id`, renders full hotel information with images, description, collaboration types, availability, and location.
10. **Influencer clicks "Back to Hosts"** → Returns to the listing page.

### Request Flow Diagram

```
[Browser]                    [Express Server]              [MongoDB]
    |                              |                           |
    |-- GET /api/hosts ----------->|                           |
    |   Authorization: Bearer xxx  |                           |
    |                              |-- authenticate() -------->|
    |                              |   verify JWT              |
    |                              |   find user by ID ------->|
    |                              |<-- user document ---------|
    |                              |                           |
    |                              |-- roleGuard('influencer') |
    |                              |   check user.role         |
    |                              |                           |
    |                              |-- hostController.listAll  |
    |                              |   Hotel.find({ isActive }) |
    |                              |-------------------------->|
    |                              |<-- hotel documents -------|
    |                              |                           |
    |<-- { hotels: [...] } --------|                           |
    |                              |                           |
```

---

## API Reference

### List All Hosts

```
GET /api/hosts
```

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**
- `search` (optional) — Search term to filter by name, city, location, or availability status

**Response (200):**
```json
{
  "hotels": [
    {
      "_id": "64f...",
      "name": "Grand Hotel",
      "description": "A luxury hotel...",
      "location": "123 Main St",
      "city": "New York",
      "featureImage": "/uploads/hotels/123.jpg",
      "images": ["/uploads/hotels/123.jpg", "/uploads/hotels/456.jpg"],
      "collaborationTypes": ["free_stay", "paid_collaboration"],
      "availability": {
        "status": "available",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-06-30T00:00:00.000Z"
      },
      "starRating": 4
    }
  ]
}
```

**Error Responses:**
- `401` — Not authenticated or token expired
- `403` — User is not an influencer or account is banned
- `500` — Server error

### Get Host Details

```
GET /api/hosts/:id
```

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**URL Parameters:**
- `id` — MongoDB ObjectId of the hotel

**Response (200):**
```json
{
  "hotel": {
    "_id": "64f...",
    "ownerId": "64e...",
    "name": "Grand Hotel",
    "description": "A luxury hotel in the heart of the city...",
    "location": "123 Main St",
    "city": "New York",
    "starRating": 4,
    "amenities": ["wifi", "pool", "spa"],
    "images": ["/uploads/hotels/123.jpg", "/uploads/hotels/456.jpg"],
    "featureImage": "/uploads/hotels/123.jpg",
    "collaborationTypes": ["free_stay", "paid_collaboration"],
    "availability": {
      "status": "available",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-06-30T00:00:00.000Z"
    },
    "contactEmail": "info@grandhotel.com",
    "isActive": true,
    "createdAt": "2024-12-01T10:30:00.000Z",
    "updatedAt": "2025-01-15T14:20:00.000Z"
  }
}
```

**Error Responses:**
- `401` — Not authenticated
- `403` — Not an influencer
- `404` — Hotel not found or inactive
- `500` — Server error

---

## Search Functionality

The search works in two layers:

### Server-Side (Optional)

The `listAll` controller accepts a `search` query parameter. If provided, it builds a MongoDB query:

```javascript
const regex = new RegExp(search, 'i'); // case-insensitive
filter.$or = [
  { name: regex },
  { city: regex },
  { location: regex },
  { 'availability.status': regex },
];
```

### Client-Side (Primary)

The `HostsListing` component fetches all hotels once, then filters locally using `useMemo`:

```javascript
const filtered = useMemo(() => {
  if (!search.trim()) return hotels;
  const term = search.toLowerCase();
  return hotels.filter(
    (h) =>
      h.name?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.location?.toLowerCase().includes(term) ||
      h.availability?.status?.toLowerCase().includes(term)
  );
}, [hotels, search]);
```

**Searchable fields:**
| Field | Example Match |
|-------|--------------|
| Hotel/Host Name | "Grand Hotel", "Marriott" |
| City | "New York", "London" |
| Location | "123 Main Street" |
| Availability Status | "available", "unavailable" |

The search updates results **dynamically** as the user types — no button press or debounce delay needed.

---

## Security & Access Control

### Authentication

- All `/api/hosts` endpoints require a valid JWT access token in the `Authorization` header.
- The `authenticate` middleware (`server/src/middleware/auth.js`) verifies the token, looks up the user in MongoDB, and rejects banned accounts.

### Role-Based Access

- The `roleGuard('influencer')` middleware ensures only users with `role: 'influencer'` can access these endpoints.
- On the frontend, the entire influencer route group is wrapped in `<ProtectedRoute role="influencer">`, which redirects unauthorized users.

### Data Visibility

- Only hotels with `isActive: true` are returned — inactive/deactivated listings are hidden from influencers.
- The `getById` endpoint also enforces the `isActive: true` filter, preventing direct URL access to inactive listings.

### No Write Access

- The hosts routes only define `GET` endpoints — influencers cannot create, update, or delete hotel listings through these endpoints.
