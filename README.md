# Investment Management Web App

Full-stack investment deal pipeline management system built with FastAPI and React.

## Overview

A professional deal tracking application for investment teams to manage startup deals from sourcing to investment decision. Features board-based workspace management, role-based permissions, IC memo system with version control, and comprehensive collaboration tools.

### Key Features

- 📋 **Multi-Board System** - Create and manage multiple investment boards (workspaces)
- 🔐 **Board-Specific Roles** - Each user can have different roles on different boards
- 📊 **Kanban Board** - Drag-and-drop deal pipeline management
- 📝 **IC Memo System** - Version-controlled investment committee memos
- 💬 **Collaboration** - Comments, voting, and activity tracking
- ☁️ **Cloud-Ready** - Deployable to Supabase + Vercel

## Tech Stack

### Backend
- **FastAPI** - High-performance Python API framework
- **SQLAlchemy** - ORM for database operations
- **Supabase** - PostgreSQL database (free tier)
- **JWT** - Secure authentication
- **Pydantic** - Data validation

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **@dnd-kit** - Drag and drop
- **Tailwind CSS** - Styling
- **Zustand** - Client state management

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- Supabase account (free at [supabase.com](https://supabase.com))

### 1. Setup Supabase

1. Create account at https://supabase.com
2. Create new project
3. Get credentials from **Settings → API**:
   - `Project URL`
   - `anon public` key
   - `service_role` key
4. Get database URL from **Settings → Database → Connection String**

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Supabase credentials
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_KEY=your-anon-key
# SUPABASE_SERVICE_KEY=your-service-key
# JWT_SECRET=your-secret-key-min-32-chars
# DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Initialize database with demo data
python seed_db.py

# Run server
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`  
API Docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# VITE_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Login

**Demo Credentials:**
- **Admin**: `admin@investment.com` / `admin123`
- **Analyst**: `analyst@investment.com` / `analyst123`
- **Partner**: `partner@investment.com` / `partner123`

Or create a new account via the signup page.

## Deployment

### Backend to Vercel

```bash
cd backend
vercel
```

**Required Environment Variables:**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-production-secret-min-32-chars
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend to Vercel

```bash
cd frontend
vercel
```

**Required Environment Variable:**
```env
VITE_API_URL=https://your-backend.vercel.app
```

### Post-Deployment
1. Initialize database: Run `python seed_db.py` with production credentials
2. Test API docs at `https://your-backend.vercel.app/docs`
3. Test frontend login and board creation

## Project Structure

```
investment_management_web_app/
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── auth.py        # Authentication
│   │   ├── database.py    # DB connection
│   │   └── config.py      # Settings
│   ├── main.py           # FastAPI app
│   ├── seed_db.py        # DB initialization
│   ├── requirements.txt  # Python deps
│   └── vercel.json       # Vercel config
│
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/        # Route pages
    │   ├── lib/          # Utilities
    │   └── stores/       # State management
    ├── package.json      # Node deps
    └── vercel.json       # Vercel config
```

## Features Overview

### Multi-Board System

**Create Multiple Workspaces:**
- Each user can create and manage multiple boards
- Board creator automatically becomes Admin of that board
- Add members to boards with specific roles
- Each board has its own deals, memos, and activity logs

### Board-Specific Roles

Users can have different roles on different boards:

**Admin** - Full board control
- Add/remove board members
- Create, edit, delete deals
- Edit IC memos
- Vote on deals
- Comment on deals

**Analyst** - Deal management
- Create, edit, delete deals
- Edit IC memos
- Comment on deals
- Cannot vote or manage members

**Partner** - Voting and collaboration
- Vote on deals (approve/decline)
- Comment on deals
- Cannot edit deals or memos

**No Role** - Read-only access
- View deals on boards where they're members
- Cannot perform any actions

### Deal Pipeline (Kanban)

**6 Deal Stages:**
1. **Sourced** - Initial sourcing
2. **Screen** - Initial screening
3. **Diligence** - Due diligence
4. **IC** - Investment Committee review
5. **Invested** - Deal closed
6. **Passed** - Deal declined

**Features:**
- Drag & drop deals between stages
- Color-coded columns
- Deal cards display: name, company, round, check size, owner
- Stage changes tracked in activity log
- Board-specific deal filtering

### IC Memo System

**6 Fixed Sections:**
1. Summary
2. Market
3. Product
4. Traction
5. Risks
6. Open Questions

**Version Control:**
- Every save creates a new version
- Full history preserved
- View and compare old versions
- Read-only access to historical versions

**Markdown Support:**
- Write in plain text or Markdown
- Live preview
- Support for links, lists, formatting

### Collaboration Tools

**Comments:**
- All board members can comment
- Threaded discussions
- User attribution and timestamps

**Voting (Partners/Admins only):**
- Approve or Decline deals
- Optional comment with vote
- Vote summary displayed on deals

**Activity Timeline:**
- All changes tracked automatically
- Shows who did what and when
- Full audit trail per board

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login
- `GET /auth/me` - Current user

### Boards
- `GET /boards` - List user's boards
- `POST /boards` - Create board
- `GET /boards/{id}` - Get board details
- `PUT /boards/{id}` - Update board
- `DELETE /boards/{id}` - Delete board
- `POST /boards/{id}/members` - Add member
- `DELETE /boards/{id}/members/{user_id}` - Remove member

### Deals
- `GET /deals?board_id={id}` - List deals for board
- `POST /deals` - Create deal
- `GET /deals/{id}` - Get deal
- `PUT /deals/{id}` - Update deal
- `DELETE /deals/{id}` - Delete deal
- `GET /deals/{id}/activities` - Deal activities

### Interactions
- `POST /interactions/comment` - Add comment
- `POST /interactions/vote` - Vote on deal
- `GET /interactions/deal/{id}/comments` - Get comments
- `GET /interactions/deal/{id}/votes` - Get votes

### Memos
- `GET /memos/deal/{id}` - Get memo
- `PUT /memos/deal/{id}` - Update memo (creates new version)
- `GET /memos/deal/{id}/versions` - Version history
- `GET /memos/version/{id}` - Specific version

## Database Schema

**Core Tables:**
- `users` - User accounts
- `boards` - Investment boards/workspaces
- `board_members` - Board membership with roles
- `deals` - Investment deals (linked to boards)
- `activities` - Activity log (board-scoped)
- `ic_memos` - Memo metadata
- `memo_versions` - Memo version history
- `comments` - Deal comments
- `votes` - Partner/Admin votes

**Key Relationships:**
- Users can be members of multiple boards
- Each board has multiple deals
- Deals belong to one board
- Activities are scoped to boards
- Memos are linked to deals

## Environment Variables

### Backend
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:5173
```

### Frontend
```env
VITE_API_URL=http://localhost:8000
```

## Development Tips

### Backend Development
```bash
# Auto-reload on code changes
uvicorn main:app --reload

# View interactive API docs (Swagger)
open http://localhost:8000/docs

# View alternative API docs (ReDoc)
open http://localhost:8000/redoc

# Run specific port
uvicorn main:app --reload --port 8001
```

### Frontend Development
```bash
# Dev server with Hot Module Replacement
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

### Database Management
```bash
# Reset database with fresh demo data
cd backend
python seed_db.py

# Initialize with boards support
python init_db_with_boards.py

# Check board roles
python check_board_roles.py
```

## Troubleshooting

### Common Issues

**Database connection fails:**
- Verify Supabase credentials in `.env`
- Check `DATABASE_URL` format
- Ensure Supabase project is active (not paused)
- Test connection from Supabase dashboard

**CORS errors:**
- Update `FRONTEND_URL` in backend `.env`
- Check `VITE_API_URL` in frontend `.env`
- Ensure both URLs match your deployment

**Authentication errors:**
- Verify `JWT_SECRET` is set and at least 32 characters
- Clear browser localStorage and try again
- Check token expiration (default 7 days)

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
uvicorn main:app --reload --port 8001
```

For more detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## License

MIT

---

**Built with:**
- FastAPI for high-performance backend
- React + Vite for modern frontend
- Supabase for managed PostgreSQL
- TanStack Query for server state
- Tailwind CSS for styling
- @dnd-kit for drag-and-drop

**Features:**
- Clean architecture and code organization
- RESTful API design with OpenAPI docs
- Real-world investment workflow
- Production-ready deployment
- Comprehensive error handling
- Role-based access control
