# Investment Management Backend

FastAPI backend for investment deal pipeline management.

## Setup

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Configure Supabase**

Create a `.env` file based on `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

**Getting Supabase Credentials:**
- Go to https://supabase.com/dashboard
- Create a new project
- Go to Settings → API
  - Copy `Project URL` → `SUPABASE_URL`
  - Copy `anon public` key → `SUPABASE_KEY`
  - Copy `service_role` key → `SUPABASE_SERVICE_KEY`
- Go to Settings → Database
  - Copy connection string → `DATABASE_URL`

3. **Initialize Database**

```bash
python seed_db.py
```

This creates all tables and demo users:
- **Admin**: admin@investment.com / admin123
- **Analyst**: analyst@investment.com / analyst123
- **Partner**: partner@investment.com / partner123

4. **Run Development Server**

```bash
uvicorn main:app --reload
```

API will be available at http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `GET /auth/users` - List users (Admin)
- `POST /auth/users` - Create user (Admin)
- `PUT /auth/users/{id}` - Update user (Admin)
- `DELETE /auth/users/{id}` - Delete user (Admin)

### Deals
- `GET /deals` - List all deals
- `GET /deals/{id}` - Get deal
- `POST /deals` - Create deal (Analyst/Admin)
- `PUT /deals/{id}` - Update deal (Analyst/Admin)
- `DELETE /deals/{id}` - Delete deal (Analyst/Admin)
- `GET /deals/{id}/activities` - Get deal activities

### IC Memos
- `GET /memos/deal/{deal_id}` - Get memo
- `PUT /memos/deal/{deal_id}` - Update memo (creates new version)
- `GET /memos/deal/{deal_id}/versions` - Get version history
- `GET /memos/deal/{deal_id}/version/{num}` - Get specific version

### Comments & Votes
- `POST /deals/{id}/comments` - Add comment
- `GET /deals/{id}/comments` - Get comments
- `POST /deals/{id}/votes` - Vote (Partner)
- `GET /deals/{id}/votes` - Get votes
