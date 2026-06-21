# Hotel Influencer Platform

A full-stack web application that connects hotel owners with social media influencers for collaboration opportunities.

## Features

- **Hotel Owners** can list properties, browse influencers, create campaigns and collaboration opportunities, and manage partnerships
- **Influencers** can build profiles, browse hotels and opportunities, apply for collaborations, and manage campaigns
- **Admin Panel** for user management, collaboration oversight, and payment tracking
- **Real-time Messaging** between hotel owners and influencers via Socket.io
- **Campaign Management** with status tracking (pending, upcoming, ongoing, done)
- **Reviews & Ratings** after completed collaborations
- **Stripe Payments** integration for campaign transactions

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, React Router v6, styled-components |
| Backend    | Node.js, Express.js                     |
| Database   | MongoDB with Mongoose                   |
| Auth       | JWT (access + refresh tokens)           |
| Real-time  | Socket.io                               |
| Payments   | Stripe                                  |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Stripe account (for payments)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/pamusanzika/Hotel-Collab.git
   cd Hotel-Collab
   ```

2. Install dependencies
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. Configure environment variables
   ```bash
   cp server/.env.example server/.env
   ```
   Update `server/.env` with your MongoDB URI, JWT secret, Stripe keys, and email config.

4. Start the application
   ```bash
   # Terminal 1 - Backend
   cd server && npm start

   # Terminal 2 - Frontend
   cd client && npm start
   ```

The client runs on `http://localhost:3000` and the server on `http://localhost:5000`.

## Project Structure

```
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # Auth & Socket contexts
│       ├── pages/          # Route pages (admin, owner, influencer)
│       └── styles/         # Theme & global styles
├── server/                 # Express backend
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── models/         # Mongoose schemas
│       ├── routes/         # API routes
│       ├── middleware/     # Auth, validation, role guards
│       ├── services/       # Email, Stripe, OAuth
│       └── validators/    # Zod validation schemas
```
