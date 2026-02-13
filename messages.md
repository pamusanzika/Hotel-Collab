# Real-Time Messaging System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Backend Implementation](#backend-implementation)
   - [Database Models](#database-models)
   - [REST API Endpoints](#rest-api-endpoints)
   - [Socket.io Real-Time Layer](#socketio-real-time-layer)
   - [Validation](#validation)
6. [Frontend Implementation](#frontend-implementation)
   - [Socket Context & Hook](#socket-context--hook)
   - [Messages Page](#messages-page)
   - [Chat Panel](#chat-panel)
   - [Sidebar Badge](#sidebar-badge)
   - [Profile Integration](#profile-integration)
7. [Data Flow](#data-flow)
8. [Security & Rules](#security--rules)
9. [How Everything Connects](#how-everything-connects)

---

## Overview

This is a WhatsApp/Instagram-style real-time messaging system built for the Hotel Influencer Platform. It allows **hotel owners** and **influencers** to communicate with each other through direct messages. The system supports:

- Real-time message sending and receiving (no page refresh needed)
- Conversation list with last message preview and timestamps
- Unread message count badges on the sidebar navigation
- Read/seen receipts (shows "Seen" when the other user reads your message)
- Typing indicators ("User is typing...")
- Search conversations by name
- Role-based message bubble colors (Hotel Owner = Indigo, Influencer = Teal)
- "Message Influencer" / "Message Host" buttons on profile pages
- Mobile-responsive layout with back navigation

**Key Rule:** Only Hotel Owner <-> Influencer messaging is allowed. Hotel-to-Hotel and Influencer-to-Influencer messaging is blocked.

---

## Technologies Used

| Technology | Purpose | Where Used |
|---|---|---|
| **Socket.io** (`socket.io`) | Real-time bidirectional communication | Server - handles live message delivery, typing indicators, read receipts |
| **Socket.io Client** (`socket.io-client`) | Connects frontend to Socket.io server | Client - establishes WebSocket connection |
| **MongoDB / Mongoose** | Database & ODM | Server - stores conversations and messages |
| **Express.js** | HTTP REST API | Server - conversation CRUD, message history, unread counts |
| **JSON Web Token (JWT)** | Authentication | Server - authenticates both REST API and Socket.io connections |
| **Zod** | Input validation | Server - validates request bodies |
| **React Context API** | Global state management | Client - manages socket connection and unread count |
| **React Hooks** | Component state & lifecycle | Client - `useSocket`, `useAuth`, `useState`, `useEffect`, `useCallback`, `useRef` |
| **styled-components** | CSS-in-JS styling | Client - all UI components |
| **React Router v6** | Client-side routing | Client - message page routes with optional conversationId param |
| **Axios** | HTTP client | Client - REST API calls with JWT interceptor |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │SocketProvider│  │  Messages.js │  │    ChatPanel.js       │  │
│  │  (Context)   │──│  (Conv List) │──│  (Message Bubbles)    │  │
│  └──────┬───────┘  └──────────────┘  └───────────────────────┘  │
│         │                                                       │
│    socket.io-client                                             │
│         │           Axios (REST)                                │
└─────────┼──────────────┼────────────────────────────────────────┘
          │              │
     WebSocket        HTTP/REST
          │              │
┌─────────┼──────────────┼────────────────────────────────────────┐
│         │         SERVER (Express + Socket.io)                  │
│         │              │                                        │
│  ┌──────▼───────┐  ┌──▼───────────────┐                        │
│  │ socket/      │  │ routes/chat.js   │                        │
│  │  index.js    │  │ controllers/     │                        │
│  │  chatHandler │  │  chatController  │                        │
│  └──────┬───────┘  └──────┬──────────┘                         │
│         │                 │                                     │
│         └────────┬────────┘                                     │
│                  │                                              │
│          ┌───────▼────────┐                                     │
│          │   MongoDB      │                                     │
│          │ ┌────────────┐ │                                     │
│          │ │Conversation│ │                                     │
│          │ │  Message   │ │                                     │
│          │ └────────────┘ │                                     │
│          └────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Hybrid Approach:**
- **REST API** handles: listing conversations, creating conversations, loading message history, getting unread counts
- **Socket.io** handles: sending messages in real-time, receiving messages in real-time, typing indicators, marking messages as read, read receipt notifications

This keeps the Socket.io event surface small while using REST for standard CRUD operations.

---

## File Structure

### New Files Created (11 files)

```
server/
  src/
    models/
      Conversation.js          # Mongoose schema for conversations
      Message.js               # Mongoose schema for messages
    socket/
      index.js                 # Socket.io initialization + JWT auth middleware
      chatHandler.js           # Socket event handlers (sendMessage, markAsRead, typing)
    controllers/
      chatController.js        # REST endpoints for chat operations
    routes/
      chat.js                  # Express routes for /api/chat/*
    validators/
      chatValidators.js        # Zod validation schemas

client/
  src/
    contexts/
      SocketContext.js          # React Context for socket connection + unread count
    hooks/
      useSocket.js              # Convenience hook for SocketContext
    pages/
      shared/
        Messages.js             # Full messages page (conversation list + chat area)
        ChatPanel.js            # Chat view (message bubbles, input, typing indicator)
```

### Existing Files Modified (6 files)

```
server/
  src/
    app.js                      # Added http.createServer + initializeSocket
    routes/index.js             # Added chat routes registration

client/
  src/
    App.js                      # Added SocketProvider, Messages routes, nav badges
    components/layout/
      Sidebar.js                # Added NavBadge component for unread count
    pages/
      owner/
        InfluencerProfileView.js  # Added "Message Influencer" button
      influencer/
        HostDetails.js            # Added "Message Host" button
```

---

## Backend Implementation

### Database Models

#### Conversation Model (`server/src/models/Conversation.js`)

```javascript
{
  participants: [ObjectId, ObjectId],   // Exactly 2 User references
  lastMessage: {                        // Denormalized for fast list rendering
    text: String,                       // Last message text preview
    senderId: ObjectId,                 // Who sent it
    createdAt: Date                     // When it was sent
  },
  createdAt: Date,                      // Auto-generated by timestamps: true
  updatedAt: Date                       // Auto-generated by timestamps: true
}
```

**Why denormalize `lastMessage`?**
When showing the conversation list, we need to display the last message preview for each conversation. Without denormalization, we'd need to query the Messages collection for every conversation (N+1 query problem). By storing the last message directly on the Conversation document, we get everything in a single query.

**Indexes:**
- `{ participants: 1 }` - Fast lookup of conversations by user ID

**Validation:**
- `participants` array must have exactly 2 entries (enforced by a Mongoose validator)

#### Message Model (`server/src/models/Message.js`)

```javascript
{
  conversationId: ObjectId,    // Which conversation this message belongs to
  senderId: ObjectId,          // Who sent the message
  text: String,                // Message content (max 2000 characters)
  readBy: [ObjectId],          // Array of user IDs who have read this message
  createdAt: Date,             // Auto-generated
  updatedAt: Date              // Auto-generated
}
```

**Why use `readBy` array instead of a boolean?**
An array of user IDs is more flexible. It tells us exactly who has read each message. For a 2-person chat, if `readBy` contains both participants, the message has been "seen". This design also extends to group chats in the future.

**Indexes:**
- `{ conversationId: 1, createdAt: 1 }` - Fast message retrieval sorted by time
- `{ conversationId: 1, readBy: 1 }` - Fast unread count queries

---

### REST API Endpoints

All endpoints are under `/api/chat` and require authentication + role guard (hotel_owner or influencer only).

**Route file: `server/src/routes/chat.js`**

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/api/chat/conversations` | `getConversations` | List all conversations for the logged-in user |
| POST | `/api/chat/conversations` | `createConversation` | Create a new conversation (or return existing) |
| GET | `/api/chat/conversations/:id/messages` | `getMessages` | Get paginated messages for a conversation |
| GET | `/api/chat/unread-count` | `getUnreadCount` | Get total unread message count across all conversations |

#### GET `/api/chat/conversations`

**What it does:**
1. Finds all conversations where the logged-in user is a participant
2. Populates participant details (name, role)
3. Sorts by last message time (newest first)
4. For each conversation, counts unread messages (messages where the user's ID is NOT in `readBy`)
5. Returns conversations with `unreadCount` attached

**Response:**
```json
{
  "conversations": [
    {
      "_id": "conv123",
      "participants": [
        { "_id": "user1", "name": "Grand Hotel", "role": "hotel_owner" },
        { "_id": "user2", "name": "Jane Smith", "role": "influencer" }
      ],
      "lastMessage": {
        "text": "Would you like to collaborate?",
        "senderId": "user1",
        "createdAt": "2026-02-05T10:30:00Z"
      },
      "unreadCount": 3
    }
  ]
}
```

#### POST `/api/chat/conversations`

**What it does:**
1. Validates that `participantId` is provided (Zod validation)
2. Checks you're not trying to message yourself
3. Looks up the other user and checks they exist and aren't banned
4. **Enforces the Hotel <-> Influencer rule:** Only allows conversation if one user is `hotel_owner` and the other is `influencer`
5. Checks if a conversation already exists between these two users
6. If exists, returns the existing conversation (`isNew: false`)
7. If not, creates a new conversation (`isNew: true`)

**Request body:**
```json
{
  "participantId": "user123"
}
```

**Validation rules (enforced in controller):**
- Cannot message yourself
- Other user must exist
- Other user must not be banned
- Must be hotel_owner <-> influencer pair (no hotel-to-hotel or influencer-to-influencer)

#### GET `/api/chat/conversations/:id/messages`

**What it does:**
1. Finds the conversation by ID
2. Verifies the requesting user is a participant (security check)
3. Fetches messages with optional pagination (`before` cursor, `limit` max 100)
4. Populates sender info (name, role) using Mongoose `.populate()`
5. Normalizes the response: converts ObjectIds to strings, extracts `senderRole` as a top-level field

**Query params:**
- `before` (optional) - ISO date string for cursor-based pagination
- `limit` (optional, default 50, max 100) - Number of messages to return

**Response:**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "conversationId": "conv123",
      "senderId": "user1",
      "senderName": "Grand Hotel",
      "senderRole": "hotel_owner",
      "text": "Hello!",
      "readBy": ["user1"],
      "createdAt": "2026-02-05T10:30:00Z"
    }
  ]
}
```

**Why normalize the response?**
MongoDB `populate()` turns `senderId` from a plain ObjectId into a nested object `{ _id, name, role }`. The normalization step flattens this back into simple strings (`senderId`, `senderName`, `senderRole`) so the frontend receives a consistent, flat data structure regardless of whether the message came from REST or Socket.io.

#### GET `/api/chat/unread-count`

**What it does:**
1. Finds all conversation IDs where the user is a participant
2. Counts all messages across those conversations where the user's ID is NOT in `readBy`
3. Returns the total unread count

**Response:**
```json
{
  "unreadCount": 5
}
```

This endpoint is called once when the user logs in (via `SocketContext`) to initialize the unread badge in the sidebar.

---

### Socket.io Real-Time Layer

#### Socket Initialization (`server/src/socket/index.js`)

**How the Socket server attaches to Express:**

In `app.js`, instead of the usual `app.listen()`, we create an HTTP server and attach both Express and Socket.io to it:

```javascript
const server = http.createServer(app);   // Create raw HTTP server from Express app
initializeSocket(server);                // Attach Socket.io to the same server
server.listen(PORT);                     // Both Express and Socket.io listen on same port
```

**JWT Authentication Middleware for Socket.io:**

Socket.io has its own middleware system (similar to Express). Before any socket connection is established, the JWT middleware runs:

1. Client sends the JWT token in `socket.handshake.auth.token`
2. Server verifies the token using the same `JWT_ACCESS_SECRET` used by REST API
3. Looks up the user in MongoDB
4. Rejects banned users
5. Attaches `socket.user` (same pattern as `req.user` in Express)

**User-ID Rooms:**

When a user connects, they join a Socket.io room named after their user ID:

```javascript
socket.join(socket.user._id.toString());
```

**Why user-ID rooms instead of conversation-ID rooms?**
If we used conversation rooms, a user would only receive messages for conversations they've explicitly "joined". With user-ID rooms, we can send any message to a user regardless of which conversation it belongs to. This is essential for:
- Updating the unread badge count across all conversations
- Showing new messages even when the user is viewing a different conversation

#### Chat Event Handlers (`server/src/socket/chatHandler.js`)

Three socket events are handled:

##### `sendMessage` Event

**Client emits:** `{ conversationId, text }`

**Server does:**
1. Validates `conversationId` and `text` are provided
2. Trims text and limits to 2000 characters
3. Finds the conversation and verifies the sender is a participant
4. Re-checks if the user is banned (they could have been banned AFTER connecting)
5. Creates a `Message` document in MongoDB with `readBy: [senderId]` (sender has "read" their own message)
6. Updates the conversation's `lastMessage` denormalized field
7. Builds a `messageData` object with all string IDs and `senderRole`
8. Emits `newMessage` to ALL participants' user-ID rooms (so both sender and receiver get the message)

**Why emit to the sender too?**
The sender's UI adds the message to the message list when it receives `newMessage` from the server. This confirms the message was saved successfully and provides the server-generated `_id` and `createdAt` timestamp.

##### `markAsRead` Event

**Client emits:** `{ conversationId }`

**Server does:**
1. Validates the conversation exists and user is a participant
2. Uses `Message.updateMany()` with `$addToSet` to add the user's ID to `readBy` on all unread messages in that conversation
3. Finds the other participant and emits `messagesRead` to them so their UI can show "Seen"

**When is this emitted by the client?**
- When a user opens/selects a conversation
- When a new message arrives in the conversation the user is currently viewing

##### `typing` Event

**Client emits:** `{ conversationId, isTyping: true/false }`

**Server does:**
1. Finds the conversation
2. Emits `userTyping` to the other participant with `{ conversationId, userId, isTyping }`

**How typing detection works on the client:**
- When the user types in the input, emit `typing: true`
- Set a 2-second timeout
- If no more keystrokes within 2 seconds, emit `typing: false`
- When sending a message, immediately emit `typing: false`

---

### Validation

**File: `server/src/validators/chatValidators.js`**

Uses Zod to validate the `POST /api/chat/conversations` request body:

```javascript
const createConversationSchema = z.object({
  participantId: z.string().min(1, 'participantId is required'),
});
```

This schema is applied through the `validate` middleware in the route definition:

```javascript
router.post('/conversations', validate(createConversationSchema), chat.createConversation);
```

The `validate` middleware (from `server/src/middleware/validate.js`) parses `req.body` against the Zod schema and returns a 400 error with details if validation fails.

---

## Frontend Implementation

### Socket Context & Hook

#### SocketContext (`client/src/contexts/SocketContext.js`)

This React Context manages the Socket.io connection lifecycle and global unread count.

**What it provides to the entire app:**
- `socket` - The Socket.io client instance (or `null` if not connected)
- `unreadCount` - Total unread messages across all conversations
- `setUnreadCount` - Function to update the unread count
- `decrementUnread` - Function to decrease unread count (used when reading messages)

**Connection lifecycle:**
1. When `user` is available (logged in) and has an `accessToken` in localStorage:
   - Creates a new Socket.io connection to the server
   - Passes the JWT token via `auth: { token }`
   - Prefers WebSocket transport with polling fallback
2. When `user` becomes null (logged out):
   - Disconnects the socket
   - Resets unread count to 0
3. On component unmount:
   - Disconnects the socket cleanly

**Initial unread count:**
When the user logs in, makes a REST call to `GET /api/chat/unread-count` to get the current total unread messages. This initializes the badge before any socket events arrive.

**Socket URL resolution:**
```javascript
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
```
Strips `/api` from the API URL to get the base server URL, since Socket.io connects to the root, not `/api`.

#### useSocket Hook (`client/src/hooks/useSocket.js`)

A simple convenience hook that wraps `useContext(SocketContext)` and throws a helpful error if used outside the provider:

```javascript
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
```

Used throughout the app to access `socket`, `unreadCount`, `setUnreadCount`, and `decrementUnread`.

---

### Messages Page (`client/src/pages/shared/Messages.js`)

This is the main messages page, shared between both hotel owners and influencers. It has a **two-panel layout**:

```
┌──────────────────────┬────────────────────────────────────────┐
│   Conversation List  │           Chat Panel                   │
│   (340px wide)       │           (flex: 1)                    │
│                      │                                        │
│  ┌────────────────┐  │  ┌──────────────────────────────────┐  │
│  │ Search Input   │  │  │ Chat Header (name + role)        │  │
│  ├────────────────┤  │  ├──────────────────────────────────┤  │
│  │ Conv Item 1    │  │  │                                  │  │
│  │ Conv Item 2    │  │  │  Message bubbles area            │  │
│  │ Conv Item 3    │  │  │  (scrollable)                    │  │
│  │ ...            │  │  │                                  │  │
│  │                │  │  ├──────────────────────────────────┤  │
│  │                │  │  │ Typing indicator                 │  │
│  │                │  │  ├──────────────────────────────────┤  │
│  │                │  │  │ [Message input] [Send]           │  │
│  └────────────────┘  │  └──────────────────────────────────┘  │
└──────────────────────┴────────────────────────────────────────┘
```

**Key features:**

1. **Conversation List Panel (left side):**
   - Search box to filter conversations by the other user's name
   - Each conversation shows: avatar (initials), name, last message preview, timestamp, unread badge
   - Active conversation highlighted with primary color border
   - Sorted by last message time (newest first)
   - On mobile: hides when a conversation is selected (shows chat panel instead)

2. **URL-based conversation selection:**
   - Route: `/owner/messages/:conversationId` or `/influencer/messages/:conversationId`
   - If a `conversationId` URL param exists, that conversation is auto-selected
   - This enables deep-linking from "Message Influencer"/"Message Host" buttons

3. **Real-time conversation list updates:**
   - Listens for `newMessage` socket events
   - Updates `lastMessage` preview and moves the conversation to the top
   - Increments `unreadCount` if the message is for a different conversation than the active one
   - If the message belongs to a conversation not yet in the list (brand new), reloads the full list

4. **Read receipt tracking on the list:**
   - Listens for `messagesRead` socket events
   - Sets `unreadCount: 0` for the relevant conversation

5. **Unread management:**
   - When selecting a conversation: subtracts that conversation's `unreadCount` from the global count and resets the conversation's count to 0

**Mobile responsiveness:**
- Uses `$hideOnMobile` prop to toggle between conversation list and chat panel
- "Back to conversations" button appears on mobile to return to the list

---

### Chat Panel (`client/src/pages/shared/ChatPanel.js`)

This component handles the actual chat interface within a selected conversation.

**Features:**

1. **Message Loading:**
   - When `conversationId` changes, fetches message history via REST (`GET /api/chat/conversations/:id/messages`)
   - Auto-scrolls to the bottom after loading
   - Emits `markAsRead` to mark all messages as read

2. **Real-time Message Receiving:**
   - Listens for `newMessage` socket events
   - Only processes messages for the current `conversationId`
   - Appends new messages and scrolls down
   - If the message is from the other user, immediately marks as read and decrements unread count

3. **Real-time Read Receipts:**
   - Listens for `messagesRead` socket events
   - Updates the `readBy` array on messages
   - Shows "Seen" label below messages that have been read by the other user

4. **Typing Indicator:**
   - Listens for `userTyping` socket events
   - Shows "{Name} is typing..." below the messages area

5. **Sending Messages:**
   - On form submit, emits `sendMessage` via socket
   - Clears the input and stops the typing indicator

6. **Typing Detection:**
   - On every keystroke, emits `typing: true`
   - Sets a 2-second debounce timeout
   - After 2 seconds of no typing, emits `typing: false`

7. **Message Bubbles:**
   - User's own messages aligned to the right
   - Other user's messages aligned to the left
   - **Color coding by role:**
     - Hotel Owner messages: Indigo (`#6366F1`)
     - Influencer messages: Teal (`#14B8A6`)
   - Colors are consistent regardless of who is viewing (a hotel owner's message is ALWAYS indigo, whether viewed by the owner or the influencer)
   - Tail/corner styling: sender's bubble has a small corner on bottom-right, receiver's on bottom-left

8. **Date Separators:**
   - Groups messages by date
   - Shows "Today", "Yesterday", or formatted date between message groups

9. **Role determination for colors:**
   ```javascript
   const role = msg.senderRole || (mine ? user.role : otherUser?.role) || '';
   const bubbleColor = role === 'hotel_owner' ? '#6366F1' : '#14B8A6';
   ```
   - Primary: uses `msg.senderRole` from the server (set in both REST and Socket responses)
   - Fallback: if `senderRole` is missing, computes it from `user.role` (if mine) or `otherUser.role` (if theirs)
   - Applied as inline `style={{ background: bubbleColor }}` for reliable rendering

---

### Sidebar Badge (`client/src/components/layout/Sidebar.js`)

The sidebar was modified to support a `badge` property on navigation items:

```javascript
{item.badge > 0 && (
  <NavBadge>{item.badge > 99 ? '99+' : item.badge}</NavBadge>
)}
```

**NavBadge styled component:**
- Red accent background (`theme.colors.accent`)
- White text, small font (0.65rem)
- Pill shape with full border radius
- Positioned to the right of the nav label using `margin-left: auto`
- Shows "99+" for counts over 99

**How the badge gets its count:**
In `App.js`, the `OwnerLayout` and `InfluencerLayout` components use the `useSocket()` hook to get `unreadCount` and pass it as the `badge` property on the Messages nav item:

```javascript
const OwnerLayout = () => {
  const { unreadCount } = useSocket();
  const navItems = [
    // ...
    { to: '/owner/messages', label: 'Messages', badge: unreadCount },
    // ...
  ];
  return <DashboardLayout logoText="Influspark" navItems={navItems} />;
};
```

---

### Profile Integration

#### "Message Influencer" Button (`client/src/pages/owner/InfluencerProfileView.js`)

Added to the `ActionBar` on the influencer profile page (visible to hotel owners):

```javascript
<Button
  $variant="primary"
  disabled={msgLoading}
  onClick={async () => {
    setMsgLoading(true);
    try {
      const { data } = await api.post('/chat/conversations', {
        participantId: influencer.userId,
      });
      navigate(`/owner/messages/${data.conversation._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversation');
      setMsgLoading(false);
    }
  }}
>
  {msgLoading ? 'Opening...' : 'Message Influencer'}
</Button>
```

**How it works:**
1. Calls `POST /api/chat/conversations` with the influencer's `userId`
2. The server either creates a new conversation or returns the existing one
3. Navigates to `/owner/messages/:conversationId` which opens the Messages page with that conversation pre-selected

**Where does `influencer.userId` come from?**
The influencer listing controller returns the full InfluencerProfile document (via `.toObject()`), which includes the `userId` field that references the User model.

#### "Message Host" Button (`client/src/pages/influencer/HostDetails.js`)

Same pattern, but on the hotel details page (visible to influencers):

```javascript
<Button
  $variant="primary"
  disabled={msgLoading}
  onClick={async () => {
    setMsgLoading(true);
    try {
      const { data } = await api.post('/chat/conversations', {
        participantId: hotel.ownerId,
      });
      navigate(`/influencer/messages/${data.conversation._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversation');
      setMsgLoading(false);
    }
  }}
>
  {msgLoading ? 'Opening...' : 'Message Host'}
</Button>
```

**Where does `hotel.ownerId` come from?**
The host controller returns the full Hotel document, which includes the `ownerId` field that references the hotel owner's User model.

---

## Data Flow

### Flow 1: User Opens Messages Page

```
1. User navigates to /owner/messages
2. Messages.js mounts
3. useEffect calls GET /api/chat/conversations
4. Server returns conversation list with unread counts
5. Conversations rendered in left panel
6. If URL has :conversationId param, that conversation is auto-selected
```

### Flow 2: User Selects a Conversation

```
1. User clicks on a conversation in the list
2. handleSelectConv(convId) is called
3. activeConvId state is updated
4. ChatPanel receives new conversationId prop
5. ChatPanel useEffect fires:
   a. Calls GET /api/chat/conversations/:id/messages
   b. Messages loaded into state and rendered
   c. Scrolls to bottom
   d. Emits 'markAsRead' via socket
6. Server processes markAsRead:
   a. Adds user ID to readBy on all unread messages
   b. Emits 'messagesRead' to the other participant
7. handleSelectConv also:
   a. Decrements global unreadCount by this conversation's unreadCount
   b. Sets this conversation's unreadCount to 0 in local state
```

### Flow 3: Sending a Message

```
1. User types in input and presses Send
2. ChatPanel emits 'sendMessage' via socket: { conversationId, text }
3. Server chatHandler:
   a. Validates text and conversation
   b. Re-checks banned status
   c. Creates Message document in MongoDB
   d. Updates conversation's lastMessage
   e. Builds messageData with senderRole
   f. Emits 'newMessage' to both participants' rooms
4. Both clients receive 'newMessage':
   a. ChatPanel: appends message to messages array, scrolls down
   b. Messages.js: updates conversation's lastMessage preview, moves to top
   c. If receiver is viewing a different conversation: increments unreadCount
5. Receiver's ChatPanel (if viewing same conversation):
   a. Emits 'markAsRead'
   b. Decrements unread count
```

### Flow 4: Starting a New Conversation from Profile

```
1. Hotel owner views influencer profile
2. Clicks "Message Influencer"
3. POST /api/chat/conversations with { participantId: influencer.userId }
4. Server:
   a. Validates hotel_owner <-> influencer pair
   b. Checks if conversation exists
   c. Creates new or returns existing
5. Client navigates to /owner/messages/:conversationId
6. Messages page loads with that conversation pre-selected
7. ChatPanel loads (empty messages for new conversation)
```

### Flow 5: Typing Indicator

```
1. User types in input
2. handleInputChange fires:
   a. Emits 'typing' { conversationId, isTyping: true }
   b. Clears previous timeout
   c. Sets 2-second timeout to emit isTyping: false
3. Server receives 'typing':
   a. Finds the other participant
   b. Emits 'userTyping' to them
4. Other user's ChatPanel:
   a. Receives 'userTyping' event
   b. Sets isOtherTyping state
   c. Shows "{Name} is typing..." text
5. After 2 seconds of no typing:
   a. Timeout fires, emits isTyping: false
   b. Other user's typing indicator disappears
```

### Flow 6: Read Receipts

```
1. User A sends a message to User B
2. Message created with readBy: [User A's ID]
3. User B opens the conversation
4. ChatPanel emits 'markAsRead'
5. Server:
   a. Adds User B's ID to readBy on all unread messages
   b. Emits 'messagesRead' to User A
6. User A's ChatPanel receives 'messagesRead':
   a. Updates readBy arrays on all messages
   b. Messages where readBy.length > 1 show "Seen" label
```

---

## Security & Rules

### Authentication
- **REST API:** Every chat endpoint requires the `authenticate` middleware (JWT in `Authorization: Bearer <token>` header)
- **Socket.io:** JWT token verified in the Socket.io middleware before any connection is established. Token is passed via `socket.handshake.auth.token`
- Both use the same `JWT_ACCESS_SECRET` for verification

### Authorization
- **Role Guard:** All chat REST endpoints use `roleGuard('hotel_owner', 'influencer')` - only these two roles can access the chat system. Admins and guests cannot.
- **Hotel <-> Influencer Only:** `createConversation` enforces that one participant must be `hotel_owner` and the other must be `influencer`. No same-role messaging allowed.
- **Participant Check:** Both `getMessages` and `sendMessage` verify the requesting user is a participant in the conversation before allowing access.

### Banned User Protection
- **REST:** The `authenticate` middleware checks `user.status === 'banned'`
- **Socket Connection:** The socket auth middleware rejects banned users
- **Socket Messages:** `sendMessage` handler re-checks banned status from the database on every message send (user could be banned after connecting)

### Input Sanitization
- Message text is trimmed and limited to 2000 characters (enforced in both the Mongoose schema and the socket handler)
- Express uses `express-mongo-sanitize` to prevent NoSQL injection
- Zod validates request bodies on REST endpoints

### Data Access
- Users can only see conversations they are a participant in
- Users can only read messages from conversations they are a participant in
- Users cannot impersonate other senders (senderId is always set server-side from the authenticated user)

---

## How Everything Connects

### Server Startup Chain

```
app.js
  └── connectDB()                    # Connect to MongoDB
  └── http.createServer(app)         # Create HTTP server from Express app
  └── initializeSocket(server)       # Attach Socket.io to HTTP server
       └── io.use(JWT middleware)    # Authenticate socket connections
       └── io.on('connection')       # Handle new connections
            └── socket.join(userId)  # Join personal room
            └── handleChatEvents()   # Register event handlers
  └── server.listen(PORT)            # Start listening
```

### Client Startup Chain

```
App.js
  └── ThemeProvider                  # styled-components theme
  └── AuthProvider                   # Authentication context (JWT tokens, user state)
       └── SocketProvider            # Socket.io connection (depends on auth)
            └── BrowserRouter
                 └── OwnerLayout     # Uses useSocket() for unread badge
                 └── InfluencerLayout # Uses useSocket() for unread badge
                      └── Messages   # Uses useSocket() for real-time updates
                           └── ChatPanel  # Uses useSocket() for messaging
```

### Route Registration

**Server (`routes/index.js`):**
```
/api/auth          → authRoutes
/api/oauth         → oauthRoutes
/api/hotels        → hotelRoutes
/api/admin         → adminRoutes
/api/influencer    → influencerRoutes
/api/hosts         → hostRoutes
/api/influencer-listing → influencerListingRoutes
/api/chat          → chatRoutes          ← NEW
```

**Client (`App.js`):**
```
/owner/messages              → Messages component
/owner/messages/:conversationId → Messages component (with pre-selected conversation)
/influencer/messages          → Messages component
/influencer/messages/:conversationId → Messages component (with pre-selected conversation)
```

Both hotel owners and influencers use the same `Messages` component - the different route prefixes (`/owner` vs `/influencer`) only determine which layout wrapper (and thus which sidebar navigation) is displayed.
