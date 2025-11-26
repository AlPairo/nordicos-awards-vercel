# Nordicos Awards - Vercel Serverless Migration

**Serverless architecture** using Vercel Functions, Supabase Postgres, and Supabase Storage.

## 🚀 Migration Summary

This project has been migrated from Express.js to Vercel serverless functions:

### What Changed
- ✅ **Backend**: Express → Vercel Serverless Functions (18 endpoints)
- ✅ **File Storage**: Local disk → Supabase Storage
- ✅ **Database**: Supabase Postgres (unchanged)
- ✅ **Frontend**: React 19 (minimal changes)
- ✅ **Deployment**: Single server → Vercel (auto-scaling)

### What Stayed the Same
- ✅ Database schema (no SQL changes)
- ✅ Business logic (services 100% reusable)
- ✅ JWT authentication
- ✅ React frontend components

---

## 📁 Project Structure

```
nordicos-awards-vercel/
├── api/                    # Vercel serverless functions
│   ├── auth/              # 4 authentication endpoints
│   ├── categories/        # 2 category endpoints
│   ├── nominees/          # 2 nominee endpoints
│   ├── votes/             # 4 voting endpoints
│   └── media/             # 6 media endpoints
├── services/              # Business logic (ES modules)
│   ├── users.js
│   ├── categories.js
│   ├── nominees.js
│   ├── votes.js
│   └── media.js
├── utils/                 # Shared utilities
│   ├── db.js             # Postgres connection
│   ├── auth.js           # JWT helpers
│   ├── supabase.js       # Supabase client
│   └── mappers.js        # DB row mappers
├── frontend/              # React app
│   ├── src/
│   │   ├── services/api.ts
│   │   └── utils/supabase.ts
│   └── package.json
├── vercel.json            # Vercel configuration
├── package.json           # Root dependencies
└── .env.example           # Environment variables template
```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
npm install @supabase/supabase-js
cd ..
```

### 2. Set Up Environment Variables

Create `.env.local` in the **root**:

```env
# Database
SUPABASE_DB_URL=postgresql://user:password@db.supabase.co:5432/postgres

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=30d

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin user (for initial setup)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@nordicosawards.com
ADMIN_PASSWORD=admin123

# Bcrypt
BCRYPT_ROUNDS=12
```

Create `frontend/.env.local`:

```env
REACT_APP_API_URL=/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Supabase Storage

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Storage
2. Create a new bucket named `media`
3. Set bucket to **Public** (or use signed URLs for private access)
4. Optional: Set up storage policies for access control

### 4. Migrate Existing Files (if applicable)

If you have existing files in `backend/uploads/`, run this migration script:

```javascript
// migrate-files.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const uploadDir = '../nordicos_awards-main/backend/uploads';
const files = fs.readdirSync(uploadDir);

for (const file of files) {
  const filePath = path.join(uploadDir, file);
  const fileBuffer = fs.readFileSync(filePath);
  
  const { error } = await supabase.storage
    .from('media')
    .upload(`uploads/legacy/${file}`, fileBuffer);
  
  if (error) {
    console.error(`Failed to upload ${file}:`, error);
  } else {
    console.log(`✓ Uploaded: ${file}`);
  }
}
```

Run with: `node migrate-files.js`

---

## 🧪 Local Development

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Start local development server
vercel dev
```

This starts:
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api/*`

### Option 2: Separate Processes

```bash
# Terminal 1: Start API (using Vercel dev)
vercel dev

# Terminal 2: Start frontend
cd frontend
npm start
```

### Testing Endpoints

All endpoints are available at `/api/*`:

- **Auth**: `/api/auth/register`, `/api/auth/token`, `/api/auth/me`
- **Categories**: `/api/categories`, `/api/categories/:id`
- **Nominees**: `/api/nominees`, `/api/nominees/:id`
- **Votes**: `/api/votes`, `/api/votes/my`, `/api/votes/results`
- **Media**: `/api/media/upload`, `/api/media/review`, `/api/media/pending`, `/api/media/my`

---

## 🚀 Deployment to Vercel

### Method 1: Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Method 2: Git Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Migrated to Vercel serverless"
   git remote add origin https://github.com/yourusername/nordicos-awards.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `SUPABASE_DB_URL`
     - `JWT_SECRET`
     - `JWT_EXPIRE`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `REACT_APP_API_URL` = `/api`
     - `REACT_APP_SUPABASE_URL`
     - `REACT_APP_SUPABASE_ANON_KEY`

4. **Deploy**:
   - Vercel will automatically deploy on every `git push`
   - Preview deployments for every PR
   - Production deployment on `main` branch

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain: `nordicosawards.com`
3. Update DNS records as instructed by Vercel
4. Vercel handles SSL automatically

---

## 📊 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/token` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout | No |

### Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories | No |
| GET | `/api/categories/:id` | Get category by ID | No |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Nominees

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/nominees` | List nominees | No |
| GET | `/api/nominees/:id` | Get nominee | No |
| POST | `/api/nominees` | Create nominee | Admin |
| PUT | `/api/nominees/:id` | Update nominee | Admin |
| DELETE | `/api/nominees/:id` | Delete nominee | Admin |

### Votes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/votes` | Cast vote | Yes |
| GET | `/api/votes/my` | Get user's votes | Yes |
| GET | `/api/votes/results` | Get results | No |
| DELETE | `/api/votes/:id` | Delete vote | Yes |

### Media

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/media/upload` | Upload file | Yes |
| POST | `/api/media/review` | Review media | Admin |
| GET | `/api/media/pending` | Get pending | Admin |
| GET | `/api/media/my` | Get user media | Yes |
| DELETE | `/api/media/:id` | Delete media | Yes/Admin |

---

## 🔑 Key Differences from Original

### Backend

| Feature | Original | Serverless |
|---------|----------|------------|
| Framework | Express.js | Vercel Functions |
| File Storage | Local disk | Supabase Storage |
| Module System | CommonJS | ES Modules |
| Routing | Express Router | File-based (`/api/*`) |
| Middleware | Express middleware | Inline auth checks |
| Deployment | Single server | Auto-scaling serverless |

### Frontend

| Feature | Original | Serverless |
|---------|----------|------------|
| API URL | `http://localhost:8000/api` | `/api` |
| Media URLs | Local paths | Supabase CDN URLs |
| Supabase | Not used | Client added |

---

## 💰 Cost Estimate

### Vercel (Hobby Plan - Free)
- ✅ 100GB bandwidth/month
- ✅ Unlimited serverless invocations
- ✅ Unlimited deployments
- ✅ Automatic HTTPS & CDN

**Expected cost**: $0/month for small-medium traffic

### Supabase (Free Tier)
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth

**Expected cost**: $0-5/month (or $25/month for Pro)

**Total**: $0-30/month vs $40+/month for traditional hosting

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module"
**Solution**: Make sure all imports use `.js` extension:
```javascript
import { query } from '../utils/db.js';  // ✅ Correct
import { query } from '../utils/db';    // ❌ Wrong
```

### Issue: File upload fails
**Solution**: 
1. Check Supabase Storage bucket exists and is named `media`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check bucket permissions/policies

### Issue: Database connection errors
**Solution**: Verify `SUPABASE_DB_URL` is correct and includes password

### Issue: CORS errors
**Solution**: Vercel handles CORS automatically when frontend + API are on same domain

---

## 📚 Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Original Project](../nordicos_awards-main)

---

## ✅ Migration Checklist

- [x] Project structure created
- [x] All 18 API endpoints migrated
- [x] Services converted to ES modules
- [x] Supabase Storage integrated
- [x] Frontend updated
- [x] Vercel configuration created
- [ ] Environment variables configured
- [ ] Local testing completed
- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Existing files migrated (if applicable)

---

## 🎉 Ready to Deploy!

Your Nordicos Awards platform is now ready for serverless deployment on Vercel!

**Next Steps**:
1. Set up environment variables
2. Test locally with `vercel dev`
3. Deploy to Vercel with `vercel --prod`
4. Configure custom domain (optional)

For questions or issues, refer to the troubleshooting section above.
