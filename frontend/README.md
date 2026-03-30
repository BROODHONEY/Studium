# Studi+ Frontend

React + Vite SPA for the Studi+ classroom communication platform.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3 + inline styles |
| HTTP | Axios |
| Real-time | Socket.io client |
| Markdown | react-markdown + remark-gfm |
| QR codes | qrcode |

## Getting Started

```bash
cd frontend
npm install
npm run dev      # Vite dev server — http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Environment Variables

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

For local development:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

> All Vite env variables must be prefixed with `VITE_` to be exposed to the client.

## Project Structure

```
frontend/src/
├── assets/              # Static images (logo, hero)
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── ConfirmDialog.jsx
│   │   ├── FilePickerPopover.jsx
│   │   ├── FormatToolbar.jsx
│   │   ├── MessageContent.jsx
│   │   ├── MessageMenu.jsx
│   │   └── Modal.jsx
│   ├── ChatHeader.jsx   # Group tab bar + title
│   ├── ChatPanel.jsx    # Group chat messages + input
│   ├── DMList.jsx       # DM conversation list
│   ├── DMPanel.jsx      # DM chat messages + input
│   ├── DuesPanel.jsx    # Due dates panel
│   ├── FilesPanel.jsx   # File uploads + categories
│   ├── GroupList.jsx    # Group list + folders
│   ├── GroupModal.jsx   # Create / join group modal
│   ├── GroupOverview.jsx # Announcements panel
│   ├── KickNotification.jsx
│   ├── MembersPanel.jsx # Group members + admin controls
│   ├── NotificationBell.jsx
│   ├── OnlineDot.jsx    # Online presence indicator
│   ├── ProfileModal.jsx # User profile view/edit
│   └── SettingsPanel.jsx
├── context/
│   ├── AuthContext.jsx      # JWT auth state
│   ├── NotificationContext.jsx # Unread counts
│   ├── OnlineContext.jsx    # Online user IDs
│   ├── SocketContext.jsx    # Socket.io connection
│   ├── ThemeContext.jsx     # Dark/light mode
│   └── ToastContext.jsx     # Toast notifications
├── pages/
│   ├── DashboardPage.jsx    # Main app shell
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── services/
│   └── api.js               # Axios instance + all API calls
├── utils/
│   └── time.js              # Date/time formatting helpers
├── App.jsx                  # Routes
├── main.jsx                 # Entry point
└── index.css                # Tailwind + global styles
```

## Key Features

- **Groups** — create, join via invite code, folder organisation, pin/archive, drag-and-drop reorder
- **Chat** — real-time messaging, @mentions, markdown formatting, file attachments, reactions, reply, private reply, message pinning
- **Announcements** — tagged announcements (General, Urgent, Exam, Assignment, Event), scheduled posting, file references
- **Dues** — due date tracking with IST timezone support
- **Files** — upload, categorise into named folders, grid view
- **Direct Messages** — 1-to-1 chat, pin messages (max 4), file upload, reactions
- **Members** — role management (admin/teacher/student), kick, promote/demote, QR invite code
- **Settings** — profile edit, password change, dark/light mode, notification preferences
- **Real-time** — typing indicators, online presence dots, live unread badges

## Theming

The app uses a dark-first design system defined in `index.css` and `tailwind.config.js`:

- Background layers: `#050505` → `#080808` → `#0d0d0d` → `#111111`
- Accent: `#7c3aed` (purple)
- Text opacity scale: `0.88` / `0.6` / `0.35` / `0.2`
- Frosted glass: `backdrop-filter: blur(20px) saturate(150%)`
- All fixed chrome (rail, list panel, header) uses frosted glass with `rgba` backgrounds
