# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend Won't Start

#### Issue: ModuleNotFoundError
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution:**
```bash
pip install -r requirements.txt
```

#### Issue: Database connection error
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Solution:**
- Check `.env` file exists in backend folder
- Verify `DATABASE_URL` is correct
- Make sure Supabase project is active (not paused)
- Test connection from Supabase dashboard

#### Issue: Permission denied on port 8000
```
Error: [Errno 48] Address already in use
```
**Solution:**
```bash
# Kill process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9

# Or use different port:
uvicorn main:app --reload --port 8001
```

---

### 2. Frontend Won't Start

#### Issue: npm install fails
```
npm ERR! code ERESOLVE
```
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Module not found
```
Error: Cannot find module '@tanstack/react-query'
```
**Solution:**
```bash
npm install
```

#### Issue: Port 5173 in use
```
Port 5173 is in use
```
**Solution:**
- Click "y" to use different port, OR
```bash
# Kill process on port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

---

### 3. Login Issues

#### Issue: Can't login - 401 Unauthorized
**Possible Causes:**
1. Backend not running
2. Wrong credentials
3. Database not initialized

**Solutions:**
```bash
# 1. Check backend is running
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# 2. Re-initialize database
cd backend
python seed_db.py

# 3. Verify credentials
# Admin: admin@investment.com / admin123
# Analyst: analyst@investment.com / analyst123
# Partner: partner@investment.com / partner123
```

#### Issue: Login successful but immediately logged out
**Solution:**
```bash
# Clear browser storage
# Open DevTools (F12) → Application → Storage → Clear site data

# Or in browser console:
localStorage.clear()
```

---

### 4. CORS Errors

#### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:**

1. Check frontend `.env`:
```env
VITE_API_URL=http://localhost:8000
```

2. Check backend `.env`:
```env
FRONTEND_URL=http://localhost:5173
```

3. Restart both servers

4. If still not working, update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 5. Drag and Drop Not Working

#### Issue: Cards won't drag
**Possible Causes:**
1. JavaScript error
2. Library not installed
3. Browser compatibility

**Solutions:**
```bash
# 1. Check browser console (F12) for errors

# 2. Reinstall @dnd-kit
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 3. Try different browser (Chrome recommended)

# 4. Clear browser cache
# DevTools (F12) → Network → Disable cache
```

---

### 6. Database Issues

#### Issue: Tables don't exist
```
relation "users" does not exist
```
**Solution:**
```bash
cd backend
python seed_db.py
```

#### Issue: Demo users don't exist
```
Incorrect email or password
```
**Solution:**
```bash
cd backend
# Delete database (in Supabase dashboard SQL editor):
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Recreate tables and users:
python seed_db.py
```

#### Issue: Can't connect to Supabase
**Solutions:**
1. Check project is not paused (Supabase dashboard)
2. Verify DATABASE_URL format:
```
postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```
3. Test connection in Supabase SQL Editor
4. Check firewall settings

---

### 7. Deployment Issues

#### Issue: Vercel deployment fails
**Solutions:**

1. **Build fails:**
```bash
# Test build locally first
cd frontend
npm run build

cd backend
# No build needed, but test:
python -c "import fastapi; print('OK')"
```

2. **Environment variables missing:**
- Go to Vercel Dashboard
- Project → Settings → Environment Variables
- Add all variables from `.env.example`
- Redeploy

3. **Function timeout:**
- Increase timeout in `vercel.json`
```json
{
  "functions": {
    "main.py": {
      "maxDuration": 60
    }
  }
}
```

#### Issue: API works locally but not on Vercel
**Solutions:**

1. Check environment variables are set in Vercel
2. Check CORS settings include production URL
3. View logs: Vercel Dashboard → Deployments → Click deployment → View logs
4. Test endpoint: `https://your-backend.vercel.app/health`

---

### 8. Performance Issues

#### Issue: Slow page load
**Solutions:**
```bash
# 1. Build for production
npm run build

# 2. Check bundle size
npm run build -- --report

# 3. Clear browser cache
```

#### Issue: Slow API responses
**Solutions:**
1. Check Supabase location (choose closest region)
2. Add database indexes (already done in models.py)
3. Enable caching in TanStack Query (already done)
4. Check Supabase performance metrics in dashboard

---

### 9. UI Issues

#### Issue: Styles not loading
**Solutions:**
```bash
# 1. Rebuild Tailwind
npm run dev

# 2. Check tailwind.config.js exists
# 3. Verify postcss.config.js exists

# 4. Reinstall dependencies
npm install tailwindcss postcss autoprefixer
```

#### Issue: Icons not showing (Lucide)
**Solutions:**
```bash
# Reinstall lucide-react
npm uninstall lucide-react
npm install lucide-react
```

#### Issue: Markdown not rendering
**Solutions:**
```bash
# Reinstall react-markdown
npm uninstall react-markdown
npm install react-markdown
```

---

### 10. Development Workflow Issues

#### Issue: Hot reload not working
**Solutions:**
```bash
# Frontend:
# Stop server (Ctrl+C)
# Clear cache
rm -rf node_modules/.vite
# Restart
npm run dev

# Backend:
# Make sure using --reload flag
uvicorn main:app --reload
```

#### Issue: Changes not reflecting
**Solutions:**
```bash
# 1. Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 2. Clear localStorage
localStorage.clear()

# 3. Restart servers
```

---

## Debugging Tips

### Backend Debugging

```bash
# 1. Check if server is running
curl http://localhost:8000/health

# 2. View API docs
open http://localhost:8000/docs

# 3. Test endpoint directly
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@investment.com","password":"admin123"}'

# 4. Check Python version
python --version
# Need 3.9+

# 5. View logs
# Logs appear in terminal running uvicorn
```

### Frontend Debugging

```javascript
// 1. Check API connection
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)

// 2. Check auth state
localStorage.getItem('auth-storage')

// 3. Check current user
// In React DevTools → Components → Find useAuthStore

// 4. Network tab
// DevTools (F12) → Network → Filter: Fetch/XHR

// 5. Console errors
// DevTools (F12) → Console
```

### Database Debugging

```sql
-- In Supabase SQL Editor:

-- 1. Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 2. Check users
SELECT id, email, role FROM users;

-- 3. Check deals
SELECT id, name, stage, owner_id FROM deals;

-- 4. Check activities
SELECT * FROM activities ORDER BY created_at DESC LIMIT 10;

-- 5. Reset database
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run: python seed_db.py
```

---

## Environment Variable Checklist

### Backend `.env`
```bash
✅ SUPABASE_URL - starts with https://
✅ SUPABASE_KEY - long JWT string
✅ SUPABASE_SERVICE_KEY - longer JWT string
✅ JWT_SECRET - at least 32 characters
✅ DATABASE_URL - postgresql:// connection string
✅ FRONTEND_URL - http://localhost:5173 (dev) or https://... (prod)
```

### Frontend `.env`
```bash
✅ VITE_API_URL - http://localhost:8000 (dev) or https://... (prod)
```

---

## Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Backend health
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# 2. Frontend loading
curl http://localhost:5173
# Expected: HTML content

# 3. Login API
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@investment.com","password":"admin123"}'
# Expected: JSON with access_token

# 4. Database connection
# In backend terminal, you should see:
# INFO:     Application startup complete.
# (No database connection errors)
```

---

## Still Stuck?

1. **Read error messages carefully** - They usually tell you exactly what's wrong
2. **Check the console** - Browser DevTools (F12) → Console tab
3. **Check network tab** - See what API calls are failing
4. **Verify environment variables** - Most issues are missing or wrong env vars
5. **Restart everything** - Sometimes a fresh start fixes it
6. **Check file locations** - Make sure you're in the right directory

---

## Getting Help

If none of the above works:

1. Note the exact error message
2. Check which step failed (backend/frontend/database)
3. Verify all prerequisites are installed:
   - Python 3.9+
   - Node.js 16+
   - Supabase project active
4. Check the README.md for setup instructions
5. Review SETUP_GUIDE.md step by step

---

## Emergency Reset

If everything is broken, start fresh:

```bash
# 1. Stop all servers (Ctrl+C in terminals)

# 2. Backend reset
cd backend
rm -rf __pycache__
rm -rf .env
cp .env.example .env
# Edit .env with correct values
pip install -r requirements.txt
python seed_db.py

# 3. Frontend reset
cd frontend
rm -rf node_modules
rm -rf .vite
rm .env
cp .env.example .env
# Edit .env with correct values
npm install

# 4. Browser reset
# Clear all site data in DevTools
# Or use incognito/private mode

# 5. Start fresh
# Terminal 1:
cd backend && uvicorn main:app --reload

# Terminal 2:
cd frontend && npm run dev

# 6. Test
# Open http://localhost:5173
# Login with: admin@investment.com / admin123
```

---

**Remember:** Most issues are environment variables or missing dependencies!
