# Studi+

A real-time classroom communication platform for students and teachers — group chat, announcements, due dates, file sharing, and direct messaging.

## Overview

Studi+ is a full-stack web app built for academic groups. Teachers can create groups, post announcements, manage due dates, and share files. Students can chat, react, reply privately, and stay on top of their coursework.

```
studi+/
├── backend/    Node.js + Express + Socket.io + Supabase
└── frontend/   React + Vite + Tailwind CSS
```

## Tech Stack

| | Backend | Frontend |
|---|---|---|
| Language | Node.js | React 19 |
| Framework | Express 5 | Vite 8 |
| Real-time | Socket.io 4 | Socket.io client |
| Database | Supabase (PostgreSQL) | — |
| Auth | JWT + bcryptjs | Context API |
| Styling | — | Tailwind CSS + inline styles |
| Deployment | Render | Render / Vercel |

## Quick Start

### 1. Clone

```bash
git clone https://github.com/your-org/studi-plus.git
cd studi-plus
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

### Groups
- Create groups with name, subject, and description
- Join via 6-character invite code or QR code
- Organise groups into folders (drag-and-drop)
- Pin, archive, colour-label groups
- Admins-only mode — restricts messaging to admins

### Chat
- Real-time group messaging with Socket.io
- @mention members with autocomplete
- Markdown formatting (bold, italic, underline, lists, links)
- Reply, reply privately (sends as DM), react with emoji
- Pin messages with optional auto-unpin timer
- File attachments with inline preview
- Typing indicators, online presence

### Announcements
- Tagged posts: General, Urgent, Exam, Assignment, Event
- Schedule announcements for future delivery
- Attach file references that link to the Files tab
- Emoji reactions

### Dues
- Create and track due dates per group
- IST timezone display

### Files
- Upload PDFs, documents, images
- Organise into named categories
- Grid card view with hover actions (download, move, delete)

### Direct Messages
- 1-to-1 real-time chat
- Pin up to 4 messages per conversation
- File upload, reactions, edit, delete with confirmation
- Typing indicators, online status

### Members
- Role hierarchy: admin → teacher → student
- Kick, promote, demote members
- QR code invite sharing

### Settings
- Edit profile (name, department, year)
- Change password
- Dark / light mode toggle
- Notification preferences (sound, badge, desktop push)

## Architecture

```
Client (React SPA)
    │
    ├── REST API (Axios)  ──→  Express routes  ──→  Supabase DB
    │
    └── WebSocket (Socket.io)  ──→  Socket.io server  ──→  Supabase DB
```

- **Auth**: JWT issued on login, stored in `localStorage`, attached to every request via Axios interceptor.
- **Real-time**: Socket.io rooms per group (`join_group`). DMs use per-conversation rooms.
- **Files**: Uploaded via Multer, stored in Supabase Storage, URLs stored in DB.
- **Scheduled announcements**: A server-side interval checks for due scheduled announcements and publishes them, emitting `new_announcement` via Socket.io.

## Deployment

### Backend (Render)
- Build command: `npm install`
- Start command: `node index.js`
- Set all env vars from `backend/.env`
- Update CORS origins in `backend/index.js` to include your frontend URL

### Frontend (Render / Vercel)
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` and `VITE_SOCKET_URL` to your backend URL

## Detailed Docs

- [Backend README](./backend/README.md) — API reference, Socket.io events, project structure
- [Frontend README](./frontend/README.md) — Component map, theming, environment setup
