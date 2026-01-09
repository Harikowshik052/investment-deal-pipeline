# Investment Management Frontend

React frontend for the investment deal pipeline management system.

## Features

✅ **Authentication & Authorization**
- Email/password login
- Role-based access (Admin, Analyst, Partner)
- Protected routes

✅ **Kanban Board**
- Drag & drop deals between stages
- 6 stages: Sourced → Screen → Diligence → IC → Invested → Passed
- Real-time updates
- Activity tracking

✅ **IC Memo System**
- 6 fixed sections (Summary, Market, Product, Traction, Risks, Open Questions)
- Markdown support
- Full version history
- View/restore old versions

✅ **Collaboration**
- Comments on deals
- Partner voting (Approve/Decline)
- Activity timeline

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

For production (Vercel):
```env
VITE_API_URL=https://your-backend.vercel.app
```

### 3. Run Development Server

```bash
npm run dev
```

App runs at http://localhost:5173

## Build for Production

```bash
npm run build
```

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variable: `VITE_API_URL`
4. Deploy

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout with nav
│   ├── DealCard.jsx    # Draggable deal card
│   ├── KanbanColumn.jsx # Kanban column with drop zone
│   ├── ICMemoEditor.jsx # Memo editor with versioning
│   ├── CommentSection.jsx
│   └── VoteSection.jsx
├── pages/              # Route pages
│   ├── Login.jsx
│   ├── Dashboard.jsx   # Main Kanban board
│   ├── DealDetail.jsx
│   └── UserManagement.jsx
├── lib/                # Utilities
│   ├── api.js         # API client
│   └── utils.js       # Helper functions
├── stores/             # State management
│   └── authStore.js   # Auth with Zustand
├── App.jsx            # Route configuration
└── main.jsx           # Entry point
```

## Tech Stack

- **React 18** - UI library
- **React Router** - Navigation
- **TanStack Query** - Server state
- **Zustand** - Client state
- **@dnd-kit** - Drag and drop
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Markdown** - Markdown rendering
- **Lucide React** - Icons

## Features by Role

### Admin
- ✅ Manage users (create/update/delete)
- ✅ Full deal access (create/edit/delete)
- ✅ Edit IC memos
- ✅ Comment and vote

### Analyst
- ✅ Create and edit deals
- ✅ Edit IC memos
- ✅ Comment on deals
- ❌ Cannot manage users
- ❌ Cannot vote

### Partner
- ✅ View all deals
- ✅ Comment on deals
- ✅ Vote (approve/decline)
- ❌ Cannot create/edit deals
- ❌ Cannot edit memos
- ❌ Cannot manage users

## Demo Credentials

- **Admin**: admin@investment.com / admin123
- **Analyst**: analyst@investment.com / analyst123
- **Partner**: partner@investment.com / partner123

## Key Features Explained

### Drag & Drop
Using `@dnd-kit`, deals can be dragged between stages. Stage changes automatically:
- Update the deal
- Create an activity record
- Refresh the board

### Version Control
Every memo save creates a new version:
- Old versions are preserved
- View history anytime
- Compare versions side-by-side

### Real-time Activity
All actions are tracked:
- Deal creation
- Stage changes
- Memo updates
- Comments
- Votes

## Performance

- Code splitting with React lazy loading
- Optimistic UI updates
- Cached API responses with TanStack Query
- Debounced search inputs
