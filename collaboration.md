# Collaboration System - Complete Technical Documentation

This document explains the entire **Collaboration (Campaign & Review)** system of the Hotel Influencer Platform. It covers every file, function, model, route, validator, component, and real-time socket event used to make the collaboration feature work end-to-end.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Models](#2-database-models)
3. [Validation Schemas (Zod)](#3-validation-schemas-zod)
4. [Backend Routes](#4-backend-routes)
5. [Backend Controller Functions](#5-backend-controller-functions)
6. [Real-Time Socket Events](#6-real-time-socket-events)
7. [Frontend Components](#7-frontend-components)
8. [Frontend Pages](#8-frontend-pages)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [File Reference Map](#10-file-reference-map)

---

## 1. System Overview

The Collaboration system allows **Hotel Owners** and **Influencers** to propose, manage, and review campaigns with each other. It is **bidirectional** - either party can initiate a campaign proposal.

### Key Concepts
- **Campaign**: A collaboration proposal between a hotel and an influencer (e.g., a free stay in exchange for social media content).
- **Review**: A rating + comment left by either party after a campaign is completed.
- **Application**: An incoming campaign proposal that the recipient has not yet approved/rejected.
- **Status Flow**: `pending` → `upcoming` → `ongoing` → `done` (or `cancelled`/`rejected` at various stages).

### Campaign Types
| Value | Label |
|---|---|
| `free_stay` | Free Stay |
| `paid_collaboration` | Paid Collaboration |
| `discount_stay` | Discount Stay |

### Who Can Do What
| Action | Hotel Owner | Influencer |
|---|---|---|
| Create a campaign | Yes (selects influencer) | Yes (selects hotel) |
| Approve/Reject a campaign | Only if they are the **recipient** (didn't create it) | Only if they are the **recipient** (didn't create it) |
| Change status (start, complete, cancel) | Yes (if participant) | Yes (if participant) |
| Leave a review | Yes (after campaign is `done`) | Yes (after campaign is `done`) |

---

## 2. Database Models

### 2.1 Campaign Model

**File**: `server/src/models/Campaign.js`

```
campaignSchema {
  hotelId:       ObjectId → ref: 'Hotel'      (required)
  influencerId:  ObjectId → ref: 'User'       (required) — the influencer's User._id, NOT InfluencerProfile._id
  createdBy:     ObjectId → ref: 'User'       (required) — which user created this campaign
  creatorRole:   String   enum: ['hotel_owner', 'influencer']  (required)
  campaignType:  String   enum: ['free_stay', 'paid_collaboration', 'discount_stay']  (required)
  title:         String   (required, max 200 chars)
  description:   String   (max 2000 chars, default '')
  startDate:     Date     (required)
  endDate:       Date     (required)
  status:        String   enum: ['pending', 'upcoming', 'ongoing', 'done', 'cancelled', 'rejected']  default: 'pending'
  cancelReason:  String   (max 500 chars, default '')
  timestamps:    true     — adds createdAt, updatedAt
}
```

**Database Indexes**:
- `{ hotelId: 1, status: 1 }` — fast queries filtering campaigns by hotel and status
- `{ influencerId: 1, status: 1 }` — fast queries filtering campaigns by influencer and status
- `{ createdBy: 1 }` — fast queries filtering by who created the campaign

**Important**: `influencerId` stores the influencer's `User._id`, not the `InfluencerProfile._id`. This is critical for correct data relationships.

### 2.2 Review Model

**File**: `server/src/models/Review.js`

```
reviewSchema {
  campaignId:    ObjectId → ref: 'Campaign'   (required)
  reviewerId:    ObjectId → ref: 'User'       (required) — who wrote the review
  revieweeId:    ObjectId → ref: 'User'       (required) — who is being reviewed
  reviewerRole:  String   enum: ['hotel_owner', 'influencer']  (required)
  rating:        Number   (required, min 1, max 5)
  comment:       String   (max 1000 chars, default '')
  timestamps:    true
}
```

**Database Indexes**:
- `{ campaignId: 1, reviewerId: 1 }` — **unique compound index** — ensures one review per user per campaign
- `{ revieweeId: 1, createdAt: -1 }` — fast lookup of reviews received by a user, sorted newest first

---

## 3. Validation Schemas (Zod)

**File**: `server/src/validators/campaignValidators.js`

Three Zod schemas are exported and used by the `validate` middleware to validate request bodies before they reach the controller.

### 3.1 `createCampaignSchema`

Validates the body of `POST /api/campaigns`.

| Field | Rule |
|---|---|
| `hotelId` | `z.string().min(1)` — required MongoDB ObjectId as string |
| `influencerId` | `z.string().min(1)` — required |
| `campaignType` | `z.enum(['free_stay', 'paid_collaboration', 'discount_stay'])` |
| `title` | `z.string().min(2).max(200).trim()` |
| `description` | `z.string().max(2000).optional().default('')` |
| `startDate` | `z.string().min(1)` — ISO date string |
| `endDate` | `z.string().min(1)` — ISO date string |

**Custom refinement**: `.refine()` ensures `endDate` is after `startDate`.

### 3.2 `updateCampaignStatusSchema`

Validates the body of `PATCH /api/campaigns/:id/status`.

| Field | Rule |
|---|---|
| `status` | `z.enum(['upcoming', 'ongoing', 'done', 'cancelled', 'rejected'])` |
| `cancelReason` | `z.string().max(500).optional()` |

### 3.3 `createReviewSchema`

Validates the body of `POST /api/campaigns/:id/reviews`.

| Field | Rule |
|---|---|
| `rating` | `z.number().int().min(1).max(5)` |
| `comment` | `z.string().max(1000).optional().default('')` |

---

## 4. Backend Routes

### 4.1 Campaign Routes

**File**: `server/src/routes/campaigns.js`

All routes require authentication (`authenticate` middleware) and the role `hotel_owner` or `influencer` (`roleGuard` middleware).

| Method | Path | Validator | Controller | Description |
|---|---|---|---|---|
| `POST` | `/api/campaigns` | `createCampaignSchema` | `campaigns.create` | Create a new campaign |
| `GET` | `/api/campaigns` | — | `campaigns.listMine` | List campaigns for the logged-in user (supports `?tab=` query) |
| `GET` | `/api/campaigns/stats` | — | `campaigns.getStats` | Get campaign statistics (counts by status) |
| `GET` | `/api/campaigns/:id` | — | `campaigns.getById` | Get a single campaign with full details |
| `PATCH` | `/api/campaigns/:id/status` | `updateCampaignStatusSchema` | `campaigns.updateStatus` | Change campaign status (approve, reject, start, complete, cancel) |
| `POST` | `/api/campaigns/:id/reviews` | `createReviewSchema` | `reviews.create` | Create a review for a completed campaign |
| `GET` | `/api/campaigns/:id/reviews` | — | `reviews.getByCampaign` | Get all reviews for a campaign |

### 4.2 Review Routes

**File**: `server/src/routes/reviews.js`

| Method | Path | Middleware | Controller | Description |
|---|---|---|---|---|
| `GET` | `/api/reviews/user/:userId` | `authenticate` | `reviews.getByUser` | Get all reviews received by a specific user (for profile pages) |

### 4.3 Route Registration

**File**: `server/src/routes/index.js`

```javascript
router.use('/campaigns', campaignRoutes);  // → /api/campaigns/*
router.use('/reviews', reviewRoutes);      // → /api/reviews/*
```

---

## 5. Backend Controller Functions

### 5.1 Campaign Controller

**File**: `server/src/controllers/campaignController.js`

#### Helper: `sendCampaignNotification(senderId, recipientId, text)`

- **Purpose**: Sends an automated chat message to notify the other party about campaign events.
- **How it works**:
  1. Finds or creates a `Conversation` between the two users.
  2. Creates a `Message` document with the notification text.
  3. Updates the conversation's `lastMessage` denormalized field.
  4. Looks up the sender's name and role.
  5. Emits a `newMessage` socket event to both participants' personal rooms.
- **Used by**: `create()` and `updateStatus()` to send chat notifications automatically.

#### Helper: `getUserIdForHotel(hotelId)`

- **Purpose**: Looks up the `ownerId` of a hotel.
- **How it works**: Queries `Hotel.findById(hotelId).select('ownerId')` and returns `hotel.ownerId`.
- **Used by**: `create()` when an influencer creates a campaign (to determine who the hotel owner is for notification).

#### Helper: `enrichCampaigns(campaigns)`

- **Purpose**: Adds influencer profile data (display name, avatar) to campaign objects.
- **How it works**:
  1. Collects all unique `influencerId` values from the campaigns.
  2. Batch-queries `InfluencerProfile.find({ userId: { $in: influencerIds } })` for `displayName` and `avatar`.
  3. Builds a map of `userId → profile`.
  4. Merges `influencerDisplayName` and `influencerAvatar` into each campaign object.
- **Used by**: `listMine()` to enrich campaign list items with influencer info.

---

#### `exports.create` — Create a new campaign

**Route**: `POST /api/campaigns`

**Step-by-step**:
1. Extracts `hotelId`, `influencerId`, `campaignType`, `title`, `description`, `startDate`, `endDate` from `req.body`.
2. Gets `userId` and `role` from `req.user` (set by auth middleware).
3. **Ownership validation**:
   - If **hotel_owner**: Verifies the hotel belongs to them (`Hotel.findOne({ _id: hotelId, ownerId: userId })`). Verifies the influencer exists and is active.
   - If **influencer**: Verifies `influencerId` matches their own user ID. Verifies the hotel exists and is active.
4. Creates the `Campaign` document with `status: 'pending'`.
5. **Determines the recipient** for notifications:
   - If owner created it → recipient is the influencer.
   - If influencer created it → recipient is the hotel owner (looked up via `getUserIdForHotel()`).
6. **Sends a chat notification** using `sendCampaignNotification()` with message: `New campaign proposal: "{title}" ({type}). Check your applications tab to review it.`
7. **Emits socket event** `campaignCreated` to the recipient's room with campaign data.
8. Returns `201` with the created campaign.

#### `exports.listMine` — List campaigns for the current user

**Route**: `GET /api/campaigns?tab=campaigns|applications|history&status=...`

**Step-by-step**:
1. Builds a filter based on the user's role:
   - **hotel_owner**: Finds all hotels owned by the user, then filters campaigns by `hotelId: { $in: hotelIds }`.
   - **influencer**: Filters campaigns by `influencerId: userId`.
2. Applies **tab-based filtering**:
   - `tab=applications`: Shows incoming proposals (`createdBy: { $ne: userId }` AND `status: 'pending'`).
   - `tab=campaigns`: Shows active campaigns + own pending proposals (`upcoming`, `ongoing`, or `pending` where `createdBy: userId`).
   - `tab=history`: Shows finished campaigns (`done`, `cancelled`, `rejected`).
3. Queries campaigns with `populate('hotelId', 'name featureImage city location')` and `populate('createdBy', 'name')`.
4. Sorts by `createdAt: -1` (newest first).
5. Enriches results with influencer profile data via `enrichCampaigns()`.
6. Returns `{ campaigns: [...] }`.

#### `exports.getById` — Get a single campaign with full details

**Route**: `GET /api/campaigns/:id`

**Step-by-step**:
1. Finds the campaign by ID with populated hotel details (`name, featureImage, city, location, description, starRating, ownerId`) and creator details (`name, role`).
2. **Authorization check**: Verifies the requesting user is either the influencer or the hotel owner of this campaign.
3. Fetches the influencer's profile from `InfluencerProfile` for `displayName, avatar, niche, location`.
4. Fetches the influencer's user record for `name` as fallback.
5. Builds an enriched campaign object with `influencerDisplayName`, `influencerAvatar`, `influencerNiche`, `influencerLocation`.
6. Fetches all reviews for this campaign from the `Review` model, populated with reviewer `name` and `role`.
7. Returns `{ campaign: {...}, reviews: [...] }`.

#### `exports.updateStatus` — Change campaign status

**Route**: `PATCH /api/campaigns/:id/status`

**Step-by-step**:
1. Extracts `status` (new status) and `cancelReason` from `req.body`.
2. Finds the campaign and populates `hotelId` with `name` and `ownerId`.
3. **Authorization check**: Verifies the requesting user is either the influencer or the hotel owner.
4. Determines if the user is the campaign creator.
5. **Transition validation** — only these transitions are allowed:
   ```
   pending  →  upcoming, rejected
   upcoming →  ongoing, cancelled
   ongoing  →  done, cancelled
   ```
6. **Creator restriction**: If the campaign is `pending`, only the **recipient** (non-creator) can approve or reject. The creator cannot approve their own proposal.
7. Updates the campaign status (and `cancelReason` if cancelling).
8. Saves the campaign.
9. **Determines the other party** for notification.
10. **Sends a chat notification** with a status-specific message:
    - `upcoming` → `"Campaign "{title}" has been approved! Status is now Upcoming."`
    - `rejected` → `"Campaign "{title}" has been declined."`
    - `ongoing` → `"Campaign "{title}" is now Ongoing."`
    - `done` → `"Campaign "{title}" is now marked as Done. You can now leave a review!"`
    - `cancelled` → `"Campaign "{title}" has been cancelled. Reason: {cancelReason}"`
11. **Emits socket event** `campaignStatusUpdated` to both participants' rooms.
12. Returns the updated campaign.

#### `exports.getStats` — Get campaign statistics

**Route**: `GET /api/campaigns/stats`

**Step-by-step**:
1. Builds a filter based on user role (same as `listMine`).
2. Queries all campaigns matching the filter, selecting only `status` and `createdBy`.
3. Iterates through campaigns and counts:
   - Each status (`pending`, `upcoming`, `ongoing`, `done`, `cancelled`, `rejected`).
   - `pendingApplications`: Pending campaigns where `createdBy !== userId` (incoming proposals).
   - `waitingForApproval`: Pending campaigns where `createdBy === userId` (own proposals waiting for response).
   - `total`: Total campaign count.
4. Returns the stats object. Used by the frontend for navigation badges.

---

### 5.2 Review Controller

**File**: `server/src/controllers/reviewController.js`

#### Helper: `sendReviewNotification(senderId, recipientId, text)`

- Identical pattern to `sendCampaignNotification` in campaignController.
- Finds/creates a conversation, creates a message, updates `lastMessage`, emits `newMessage` socket event.

#### `exports.create` — Create a review

**Route**: `POST /api/campaigns/:id/reviews`

**Step-by-step**:
1. Extracts `rating` and `comment` from `req.body`, and `campaignId` from `req.params.id`.
2. Finds the campaign and populates `hotelId` with `ownerId` and `name`.
3. **Status check**: Only allows reviews when campaign `status === 'done'`.
4. **Authorization check**: Verifies the user is the influencer or hotel owner of this campaign.
5. **Duplicate check**: Queries `Review.findOne({ campaignId, reviewerId: userId })` to prevent double reviews.
6. **Determines the reviewee**:
   - If the reviewer is the owner → reviewee is the influencer.
   - If the reviewer is the influencer → reviewee is the hotel owner.
7. Creates the `Review` document.
8. Sends a chat notification: `"A review has been submitted for campaign "{title}"."`.
9. Emits socket event `reviewCreated` to the reviewee's room.
10. Returns `201` with the created review.

#### `exports.getByCampaign` — Get reviews for a campaign

**Route**: `GET /api/campaigns/:id/reviews`

- Queries `Review.find({ campaignId })` with populated reviewer info (`name, role`).
- Sorts by `createdAt: -1`.
- Returns `{ reviews: [...] }`.

#### `exports.getByUser` — Get reviews for a user's profile

**Route**: `GET /api/reviews/user/:userId`

**Step-by-step**:
1. Queries `Review.find({ revieweeId: userId })` — all reviews where this user is the reviewee.
2. Populates reviewer info (`name, role`) and campaign info (`title, campaignType`).
3. Sorts by `createdAt: -1`.
4. Calculates `averageRating` (rounded to 1 decimal) and `totalReviews`.
5. Returns `{ reviews: [...], averageRating, totalReviews }`.

---

## 6. Real-Time Socket Events

**File**: `server/src/socket/index.js`

### How Socket Authentication Works
1. Client connects to Socket.io with `auth: { token: accessToken }`.
2. Server middleware verifies the JWT, loads the user, checks they're not banned.
3. On connection, the user joins a personal room keyed by their `user._id` (as a string).
4. This room is used to deliver targeted events to specific users.

### Campaign Socket Events

These events are emitted from the **controllers** (not the socket handler) using `getIO()`:

| Event | Emitted By | Emitted To | Payload | When |
|---|---|---|---|---|
| `campaignCreated` | `campaignController.create` | Recipient's room | `{ campaignId, title, campaignType, createdBy }` | A new campaign proposal is created |
| `campaignStatusUpdated` | `campaignController.updateStatus` | Both participants' rooms | `{ campaignId, title, newStatus, updatedBy }` | A campaign status changes (approve, reject, start, complete, cancel) |
| `reviewCreated` | `reviewController.create` | Reviewee's room | `{ campaignId, reviewerId }` | A review is submitted |
| `newMessage` | `sendCampaignNotification` / `sendReviewNotification` | Both participants' rooms | Full message data object | Automated chat notification for any campaign event |

### newMessage Payload Structure
```javascript
{
  _id: "messageId",
  conversationId: "conversationId",
  senderId: "userId",
  senderName: "User Name",
  senderRole: "hotel_owner" | "influencer",
  text: "Notification text...",
  readBy: ["senderId"],
  createdAt: Date
}
```

---

## 7. Frontend Components

### 7.1 CampaignForm

**File**: `client/src/components/campaigns/CampaignForm.js`

**Props**:
| Prop | Type | Description |
|---|---|---|
| `preSelectedHotel` | Object or null | Pre-fills the hotel (used when navigating from a hotel detail page) |
| `preSelectedInfluencer` | Object or null | Pre-fills the influencer (used when navigating from an influencer profile page) |
| `onSuccess` | Function | Called after successful campaign creation |
| `onCancel` | Function | Called when Cancel button is clicked |

**How it works**:

1. **Detects user role** from `useAuth()` → determines whether to show hotel selector or influencer selector.

2. **Hotel Selection**:
   - **Owner flow**: Loads their own hotels via `GET /api/hotels` and shows a `<Select>` dropdown. If `preSelectedHotel` is provided, shows it as a fixed chip.
   - **Influencer flow**: Shows a search input. Debounced API call to `GET /api/hosts?search=...` (300ms delay). Results shown in a dropdown. Selected hotel shown as a chip with remove button.

3. **Influencer Selection** (owner only):
   - Shows a search input. Debounced API call to `GET /api/influencer-listing?search=...` (300ms delay). Results shown in a dropdown with avatar and display name. If `preSelectedInfluencer` is provided, shows it as a fixed chip.

4. **Form Fields**: Campaign type (`<Select>`), title (`<Input>`), description (`<Textarea>`), start date and end date (`<Input type="date">` with `min` attribute preventing past dates).

5. **`handleSubmit()`**:
   - Validates all required fields client-side.
   - Determines `influencerId`: if owner, uses `selectedInfluencer.userId`; if influencer, uses `user.id`.
   - Calls `POST /api/campaigns` with the form data.
   - Calls `onSuccess()` on success.

### 7.2 CampaignCard

**File**: `client/src/components/campaigns/CampaignCard.js`

**Props**:
| Prop | Type | Description |
|---|---|---|
| `campaign` | Object | The enriched campaign object |
| `currentUserRole` | String | `'hotel_owner'` or `'influencer'` |
| `currentUserId` | String | The logged-in user's ID |
| `onViewDetails` | Function(id) | Called when View button is clicked |
| `onApprove` | Function(id) | Called when Approve button is clicked (optional) |
| `onReject` | Function(id) | Called when Reject button is clicked (optional) |

**How it works**:

1. **Determines context**:
   - `isRecipient`: Whether the current user is NOT the creator (by comparing `campaign.createdBy` with `currentUserId`).
   - `isWaitingForApproval`: Pending + user is the creator (they're waiting for the other party).

2. **Displays the other party's info**:
   - Owner view → shows influencer name and avatar.
   - Influencer view → shows hotel name and feature image.

3. **Status display**:
   - Uses `STATUS_VARIANT` map to pick Badge color (e.g., `pending` → yellow, `done` → green, `cancelled` → red).
   - If waiting for approval, shows "Waiting for Approval" instead of "Pending".

4. **Action buttons**:
   - Approve/Reject buttons only appear when: campaign is `pending` AND user is the recipient AND callback props are provided.
   - View button always appears.

### 7.3 CampaignDetail

**File**: `client/src/components/campaigns/CampaignDetail.js`

**Props**:
| Prop | Type | Description |
|---|---|---|
| `campaignId` | String | The campaign ID to display |
| `onStatusChange` | Function(newStatus) | Optional callback when status changes |

**How it works**:

1. **`load()`** — Fetches campaign details via `GET /api/campaigns/:id`. Stores `campaign` and `reviews` in state.

2. **Displays**:
   - Status badge, campaign type badge, date range, creator name.
   - **Cancel reason box** (red background) if campaign was cancelled with a reason.
   - **Hotel info card** with image, name, and location.
   - **Influencer info card** with avatar, display name, niche, and location.
   - **Description section** if provided.

3. **`handleStatusChange(newStatus, extra)`**:
   - Calls `PATCH /api/campaigns/:id/status` with the new status.
   - Reloads the campaign data.
   - Calls `onStatusChange` callback.

4. **Action buttons** (conditional based on status and role):
   - `pending` + recipient → **Approve Campaign** / **Reject Campaign**
   - `upcoming` → **Start Campaign** / **Cancel Campaign**
   - `ongoing` → **Mark as Done** / **Cancel Campaign**

5. **Cancel flow**:
   - `handleCancelClick()` opens a modal.
   - User must enter a cancellation reason.
   - `handleCancelConfirm()` sends the cancel request with the reason.

6. **Reviews section**:
   - Lists existing reviews with StarRating, reviewer name, date, and comment.
   - If campaign is `done` and user hasn't reviewed yet → shows the `ReviewForm` component.

### 7.4 ReviewForm

**File**: `client/src/components/campaigns/ReviewForm.js`

**Props**:
| Prop | Type | Description |
|---|---|---|
| `campaignId` | String | The campaign to review |
| `onSuccess` | Function | Called after successful review submission |

**How it works**:

1. Shows an interactive `StarRating` (1-5) and a comment textarea (max 1000 chars).
2. **`handleSubmit()`**:
   - Validates that a rating is selected.
   - Calls `POST /api/campaigns/:id/reviews` with `{ rating, comment }`.
   - On success, shows a success message and calls `onSuccess()` to refresh the parent.
3. After successful submission, replaces the form with a "Review submitted successfully!" message.

### 7.5 ReviewsList

**File**: `client/src/components/campaigns/ReviewsList.js`

**Props**:
| Prop | Type | Description |
|---|---|---|
| `reviews` | Array | Array of review objects |
| `averageRating` | Number | Calculated average rating |
| `totalReviews` | Number | Total review count |

**How it works**:

1. If no reviews, shows "No reviews yet." empty state.
2. **Header**: Shows average rating (large number), star visualization, and review count.
3. **Review list**: Each review shows:
   - Reviewer name and campaign title.
   - Star rating visualization.
   - Review date.
   - Comment text (if provided).

Used on **profile pages** (InfluencerProfileView, HostDetails) to show reviews received by a user. Data comes from `GET /api/reviews/user/:userId`.

### 7.6 StarRating

**File**: `client/src/components/campaigns/StarRating.js`

**Props**:
| Prop | Type | Default | Description |
|---|---|---|---|
| `rating` | Number | 0 | Current rating value |
| `max` | Number | 5 | Maximum number of stars |
| `size` | String | — | CSS font-size for stars |
| `interactive` | Boolean | false | If true, stars are clickable |
| `onChange` | Function | — | Called with the selected star value (1-based) |
| `showValue` | Boolean | false | If true, shows "X/5" text next to stars |

**How it works**:

- Renders `max` star characters (`★`).
- Filled stars (index < rating) are colored with `theme.colors.warning` (gold/yellow).
- Empty stars use `theme.colors.borderLight`.
- In interactive mode, clicking a star calls `onChange(starIndex + 1)`.

---

## 8. Frontend Pages

### 8.1 Owner Pages

#### OwnerCollaborations

**File**: `client/src/pages/owner/OwnerCollaborations.js`
**Route**: `/owner/collaborations`

The main collaboration hub for hotel owners.

**How it works**:

1. **Tab system** with three tabs:
   - **Campaigns** (default): Active campaigns + own pending proposals.
   - **Applications**: Incoming proposals from influencers (pending, created by others). Shows a badge with count.
   - **History**: Completed, cancelled, or rejected campaigns.

2. **`load()`**: Calls `GET /api/campaigns?tab={currentTab}` and updates the campaign list.

3. **Application badge count**: On mount, calls `GET /api/campaigns/stats` to get `pendingApplications` count for the Applications tab badge.

4. **`handleApprove(id)`**: Calls `PATCH /api/campaigns/:id/status` with `{ status: 'upcoming' }`. Reloads the list and decrements the badge count.

5. **`handleReject(id)`**: Calls `PATCH /api/campaigns/:id/status` with `{ status: 'rejected' }`. Reloads the list and decrements the badge count.

6. **"Create Campaign" button**: Navigates to `/owner/collaborations/create`.

7. Renders a list of `CampaignCard` components. Approve/Reject callbacks only passed when on the Applications tab.

#### OwnerCampaignCreate

**File**: `client/src/pages/owner/OwnerCampaignCreate.js`
**Route**: `/owner/collaborations/create`

- Reads `location.state?.preSelectedInfluencer` from React Router navigation state (passed when clicking "Create Campaign" on an influencer's profile page).
- Renders the `CampaignForm` with the pre-selected influencer.
- On success/cancel, navigates back to `/owner/collaborations`.

#### OwnerCampaignDetail

**File**: `client/src/pages/owner/OwnerCampaignDetail.js`
**Route**: `/owner/collaborations/:id`

- Reads the campaign `id` from URL params.
- Renders a "Back to Collaborations" button and the `CampaignDetail` component.

### 8.2 Influencer Pages

#### InfluencerCampaigns

**File**: `client/src/pages/influencer/InfluencerCampaigns.js`
**Route**: `/influencer/campaigns`

The main campaigns page for influencers. Nearly identical to `OwnerCollaborations` but:
- Uses `currentUserRole="influencer"`.
- Navigates to `/influencer/campaigns/:id` for details.
- Navigates to `/influencer/campaigns/create` for creation.
- No application badge count (simpler version).

Has the same three tabs: Campaigns, Applications, History.

#### InfluencerApplications

**File**: `client/src/pages/influencer/InfluencerApplications.js`
**Route**: `/influencer/applications`

A dedicated page showing only incoming applications (pending campaigns created by hotel owners).

**How it works**:
1. Calls `GET /api/campaigns?tab=applications` on mount.
2. Shows each application as a `CampaignCard` with Approve/Reject buttons.
3. `handleApprove(id)` and `handleReject(id)` call the status update API and reload.

#### InfluencerCampaignCreate

**File**: `client/src/pages/influencer/InfluencerCampaignCreate.js`
**Route**: `/influencer/campaigns/create`

- Reads `location.state?.preSelectedHotel` from navigation state (passed when clicking "Create Campaign" on a hotel detail page).
- Renders the `CampaignForm` with the pre-selected hotel.
- On success/cancel, navigates back to `/influencer/campaigns`.

#### InfluencerCampaignDetail

**File**: `client/src/pages/influencer/InfluencerCampaignDetail.js`
**Route**: `/influencer/campaigns/:id`

- Reads the campaign `id` from URL params.
- Renders a "Back to Campaigns" button and the `CampaignDetail` component.

---

## 9. Data Flow Diagrams

### 9.1 Campaign Creation Flow

```
User (Owner or Influencer)
  │
  ├── Fills out CampaignForm component
  │     ├── Selects hotel (owner: dropdown from own hotels / influencer: search)
  │     ├── Selects influencer (owner: search / influencer: auto-set to self)
  │     ├── Chooses campaign type, title, description, dates
  │     └── Clicks "Create Campaign"
  │
  ├── POST /api/campaigns
  │     ├── validate(createCampaignSchema)  ← Zod validation
  │     ├── authenticate                    ← JWT verification
  │     ├── roleGuard('hotel_owner', 'influencer')
  │     └── campaignController.create()
  │           ├── Ownership validation
  │           ├── Campaign.create() → MongoDB
  │           ├── sendCampaignNotification() → Creates chat message
  │           │     ├── Conversation.findOne or .create
  │           │     ├── Message.create
  │           │     └── io.emit('newMessage') → Socket.io
  │           └── io.emit('campaignCreated') → Socket.io
  │
  └── Recipient receives real-time notification
        ├── campaignCreated event
        └── newMessage event (chat notification)
```

### 9.2 Campaign Status Update Flow

```
pending ──[recipient approves]──→ upcoming ──[any participant]──→ ongoing ──[any participant]──→ done
   │                                  │                              │
   └──[recipient rejects]──→ rejected │                              │
                                      └──[cancelled]──→ cancelled ←──┘
```

Each transition:
1. `PATCH /api/campaigns/:id/status`
2. Validates transition is allowed
3. Validates user is authorized (recipient for pending, any participant for others)
4. Updates database
5. Sends chat notification
6. Emits `campaignStatusUpdated` socket event

### 9.3 Review Flow

```
Campaign status = 'done'
  │
  ├── CampaignDetail shows "Leave a Review" form
  │     └── ReviewForm component
  │           ├── User selects 1-5 stars
  │           ├── Optionally writes a comment
  │           └── Clicks "Submit Review"
  │
  ├── POST /api/campaigns/:id/reviews
  │     ├── validate(createReviewSchema)
  │     └── reviewController.create()
  │           ├── Verifies campaign status === 'done'
  │           ├── Verifies user is a participant
  │           ├── Checks for duplicate review
  │           ├── Determines reviewee (the other party)
  │           ├── Review.create() → MongoDB
  │           ├── sendReviewNotification() → Chat message
  │           └── io.emit('reviewCreated') → Socket.io
  │
  └── Review appears on:
        ├── Campaign detail page (CampaignDetail → reviews list)
        └── User profile pages via GET /api/reviews/user/:userId (ReviewsList component)
```

---

## 10. File Reference Map

### Backend Files

| File | Purpose |
|---|---|
| `server/src/models/Campaign.js` | Campaign Mongoose schema and model |
| `server/src/models/Review.js` | Review Mongoose schema and model |
| `server/src/controllers/campaignController.js` | Campaign CRUD + stats + notification logic |
| `server/src/controllers/reviewController.js` | Review CRUD + notification logic |
| `server/src/routes/campaigns.js` | Campaign & campaign-review route definitions |
| `server/src/routes/reviews.js` | User review route definitions |
| `server/src/validators/campaignValidators.js` | Zod validation schemas |
| `server/src/routes/index.js` | Route registration (`/campaigns`, `/reviews`) |
| `server/src/socket/index.js` | Socket.io setup, JWT auth, room joining |

### Frontend Files

| File | Purpose |
|---|---|
| `client/src/components/campaigns/CampaignForm.js` | Reusable campaign creation form with search |
| `client/src/components/campaigns/CampaignCard.js` | Campaign list item card with approve/reject |
| `client/src/components/campaigns/CampaignDetail.js` | Full campaign detail view with actions & reviews |
| `client/src/components/campaigns/ReviewForm.js` | Star rating + comment review submission form |
| `client/src/components/campaigns/ReviewsList.js` | Reviews display with average rating |
| `client/src/components/campaigns/StarRating.js` | Interactive/static 1-5 star rating component |
| `client/src/pages/owner/OwnerCollaborations.js` | Owner's main collaboration hub (tabbed) |
| `client/src/pages/owner/OwnerCampaignCreate.js` | Owner's campaign creation page |
| `client/src/pages/owner/OwnerCampaignDetail.js` | Owner's campaign detail page |
| `client/src/pages/influencer/InfluencerCampaigns.js` | Influencer's main campaigns page (tabbed) |
| `client/src/pages/influencer/InfluencerCampaignCreate.js` | Influencer's campaign creation page |
| `client/src/pages/influencer/InfluencerCampaignDetail.js` | Influencer's campaign detail page |
| `client/src/pages/influencer/InfluencerApplications.js` | Influencer's incoming applications page |

### API Endpoints Summary

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/campaigns` | Create a campaign |
| `GET` | `/api/campaigns` | List user's campaigns (with tab filtering) |
| `GET` | `/api/campaigns/stats` | Get campaign count statistics |
| `GET` | `/api/campaigns/:id` | Get single campaign details |
| `PATCH` | `/api/campaigns/:id/status` | Update campaign status |
| `POST` | `/api/campaigns/:id/reviews` | Create a review for a campaign |
| `GET` | `/api/campaigns/:id/reviews` | Get reviews for a campaign |
| `GET` | `/api/reviews/user/:userId` | Get reviews received by a user |
