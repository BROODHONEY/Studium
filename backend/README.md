# Studi+ Backend

Node.js + Express REST API with Socket.io real-time layer, backed by Supabase (PostgreSQL).

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Real-time | Socket.io 4 |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + bcryptjs |
| File storage | Supabase Storage (via Multer) |
| Scheduler | Custom announcement scheduler |

## Getting Started

```bash
cd backend
npm install
npm run dev      # nodemon — auto-restarts on change
npm start        # production
```

## Environment Variables

Create a `.env` file in `/backend`:

```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

## API Routes

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login, returns JWT |

### Users — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:id` | ✓ | Get any user's profile |
| PATCH | `/me` | ✓ | Update own profile (name, department, year) |
| PATCH | `/me/password` | ✓ | Change own password |

### Groups — `/api/groups`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List groups the user belongs to |
| POST | `/` | ✓ | Create a group (teacher/admin) |
| POST | `/join` | ✓ | Join a group via invite code |
| GET | `/:id` | ✓ | Get group details + members |
| PATCH | `/:id` | ✓ | Update group info |
| DELETE | `/:id` | ✓ | Delete group (creator only) |
| PATCH | `/:id/admins-only` | ✓ | Toggle admins-only mode |
| DELETE | `/:id/members/me` | ✓ | Leave group |
| DELETE | `/:id/members/:userId` | ✓ | Kick a member (admin) |
| PATCH | `/:id/members/:userId/promote` | ✓ | Promote to admin |
| PATCH | `/:id/members/:userId/demote` | ✓ | Demote from admin |

### Messages — `/api/messages`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:groupId` | ✓ | List messages for a group |
| GET | `/:groupId/pinned` | ✓ | Get pinned messages |
| DELETE | `/:id` | ✓ | Delete a message |
| PATCH | `/:id/edit` | ✓ | Edit a message |
| POST | `/:id/reactions` | ✓ | React to a message |
| PATCH | `/:id/pin` | ✓ | Pin a message (admin) |
| PATCH | `/:id/unpin` | ✓ | Unpin a message (admin) |
| POST | `/reply-privately` | ✓ | Send a private reply as DM |

### Files — `/api/files`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/:groupId` | ✓ | Upload a file to a group |
| GET | `/:groupId` | ✓ | List files in a group |
| DELETE | `/:groupId/:fileId` | ✓ | Delete a file |

### Announcements — `/api/announcements`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:groupId` | ✓ | List published announcements |
| GET | `/:groupId/scheduled` | ✓ | List scheduled announcements (teacher) |
| POST | `/:groupId` | ✓ | Create announcement |
| PUT | `/:groupId/:id` | ✓ | Update announcement |
| DELETE | `/:groupId/:id` | ✓ | Delete announcement |
| POST | `/:groupId/:id/reactions` | ✓ | React to announcement |

### Dues — `/api/dues`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:groupId` | ✓ | List dues for a group |
| POST | `/:groupId` | ✓ | Create a due date |
| PUT | `/:groupId/:id` | ✓ | Update a due date |
| DELETE | `/:groupId/:id` | ✓ | Delete a due date |

### Direct Messages — `/api/dm`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search` | ✓ | Search users by email |
| GET | `/conversations` | ✓ | List conversations |
| POST | `/conversations` | ✓ | Start a conversation |
| GET | `/conversations/:id/messages` | ✓ | Get messages in a conversation |
| POST | `/online-status` | ✓ | Check online status of users |
| PATCH | `/messages/:id/edit` | ✓ | Edit a DM |
| POST | `/messages/:id/reactions` | ✓ | React to a DM |
| DELETE | `/messages/:id` | ✓ | Delete a DM |
| POST | `/upload` | ✓ | Upload a file in DM |

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_group` | `groupId` | Join a group room |
| `leave_group` | `groupId` | Leave a group room |
| `send_message` | `{ groupId, content, type, replyTo }` | Send a group message |
| `typing_start` | `{ groupId }` | Broadcast typing indicator |
| `typing_stop` | `{ groupId }` | Stop typing indicator |
| `send_dm` | `{ conversationId, content, replyTo }` | Send a DM |
| `dm_typing_start` | `{ conversationId, otherId }` | DM typing start |
| `dm_typing_stop` | `{ conversationId, otherId }` | DM typing stop |

### Server → Client
| Event | Description |
|---|---|
| `new_message` | New group message |
| `message_edited` | Message was edited |
| `message_deleted` | Message was deleted |
| `message_reaction` | Reaction updated |
| `message_pinned` | Message pinned |
| `message_unpinned` | Message unpinned |
| `system_message` | Join/leave/kick system event |
| `admins_only_changed` | Admins-only mode toggled |
| `user_typing` / `user_stopped_typing` | Typing indicators |
| `new_announcement` | New announcement posted |
| `update_announcement` | Announcement updated |
| `announcement_reaction` | Announcement reaction |
| `new_due` / `update_due` | Due date events |
| `new_file` | File uploaded to group |
| `new_dm` | New direct message |
| `dm_message_edited` | DM edited |
| `dm_message_deleted` | DM deleted |
| `dm_message_reaction` | DM reaction |
| `dm_user_typing` / `dm_user_stopped_typing` | DM typing indicators |
| `member_kicked` | User was kicked from group |
| `online_users` | List of currently online user IDs |

## Project Structure

```
backend/
├── config/
│   ├── db.js                    # Supabase client
│   ├── socket.js                # Socket.io event handlers
│   ├── announcementScheduler.js # Scheduled announcement publisher
│   └── generateCode.js          # Invite code generator
├── middleware/
│   └── auth.js                  # JWT verification middleware
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── groups.js
│   ├── messages.js
│   ├── files.js
│   ├── announcements.js
│   ├── dues.js
│   └── dm.js
├── tests/
│   ├── test-auth-login.js
│   └── test-socket.js
└── index.js                     # Entry point
```
