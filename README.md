# RozgaarSetu

Connect customers with skilled workers by profession and location.

## Stack

- **Frontend:** React + Vite (`client/`)
- **Backend:** Node.js + Express (`server/`)
- **Database:** MongoDB + Mongoose
- **Authentication:** Firebase Phone Authentication + RozgaarSetu JWT (HTTP-only cookie)

## Prerequisites

- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017/kaamsetu`)
- Firebase Project configured with Phone Authentication

## Setup

### Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with MongoDB URI, JWT Secret, and Firebase Admin credentials
npm run dev
```

Server runs at `http://localhost:5000`

### Client

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your Firebase Web SDK config
npm run dev
```

Client runs at `http://localhost:5173`

## Health Check

- API root: `GET http://localhost:5000/`
- Health: `GET http://localhost:5000/api/v1/health`

## Authentication

Worker/Customer authentication uses Firebase Phone Authentication on the frontend and token verification via Firebase Admin SDK on the backend.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/firebase` | Verify Firebase ID token, sign RozgaarSetu JWT & set HTTP-only cookie |
| POST | `/api/v1/auth/logout` | Clear session cookie |
| GET | `/api/v1/auth/me` | Get current user (requires cookie) |
| POST | `/api/v1/auth/admin/login` | Admin email + password login |

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` to seed the initial admin user on startup.

## Project Structure

```
RozgaarSetu/
├── client/          # React frontend (Vite)
└── server/          # Express backend (Node.js)
```
