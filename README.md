# TaskFlow — Django + React (Decoupled)

A full-featured task management system rebuilt with a **decoupled architecture**:
- **Backend**: Django 4.2 + Django REST Framework + SQLite
- **Frontend**: React 18 + Vite + React Router + Axios

---

## Project Structure

```
taskflow/
├── backend/          ← Django REST API (port 8000)
│   ├── config/       ← settings, urls, wsgi
│   ├── accounts/     ← User auth + profiles (Token auth)
│   ├── projects/     ← Project management
│   ├── tasks/        ← Tasks, comments, attachments
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/         ← React app (port 5173)
    ├── src/
    │   ├── api/          ← axios instance
    │   ├── context/      ← AuthContext
    │   ├── components/   ← Layout, Modal, UI
    │   ├── pages/        ← auth, dashboard, projects, tasks
    │   └── utils/        ← helpers (badges, dates)
    ├── package.json
    └── vite.config.js
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (admin)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

Backend runs at: **http://localhost:8000**
Admin panel: **http://localhost:8000/admin/**

### 2. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, returns token |
| POST | `/api/auth/logout/` | Logout (delete token) |
| GET | `/api/auth/me/` | Current user profile |
| GET | `/api/auth/users/` | All users (for assignment) |
| GET/POST | `/api/projects/` | List / Create projects |
| GET/PUT/DELETE | `/api/projects/{id}/` | Project detail |
| GET/POST | `/api/tasks/` | List / Create tasks |
| GET/PUT/DELETE | `/api/tasks/{id}/` | Task detail |
| GET | `/api/tasks/dashboard_stats/` | Dashboard statistics |
| GET/POST | `/api/tasks/{id}/comments/` | Task comments |
| DELETE | `/api/tasks/{id}/comments/{cid}/` | Delete comment |

### Filtering & Search

Tasks support URL query params:
- `?status=todo` / `in_progress` / `in_review` / `completed` / `blocked`
- `?priority=low` / `medium` / `high` / `urgent`
- `?project=<id>`
- `?search=keyword`

---

## Environment setup

### Backend
Create a `backend/.env` file for local development and keep real secrets out of version control.

Example values are provided in `backend/.env.example`.

### Frontend
Create a `frontend/.env` file with the API URL that points to your backend:

```env
VITE_API_URL=http://localhost:8000/api
VITE_API_PROXY_TARGET=http://localhost:8000
```

> In production, Netlify will use `VITE_API_URL` from its environment settings.

## Production Deployment

### Prerequisites
1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)

### Backend Deployment (Render)

1. **Create Render Web Service**:
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Set **Root Directory**: `backend`
   - Set **Runtime**: `Python 3`

2. **Configure Build & Start**:
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput --clear
     ```
   - **Start Command**:
     ```bash
     gunicorn config.wsgi --bind 0.0.0.0:$PORT
     ```

3. **Environment Variables** (in Render Dashboard):
   ```
   DJANGO_SECRET_KEY=your-generated-secret-key
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=https://your-app-name.onrender.com
   DATABASE_URL=postgresql://username:password@host:port/database
   CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
   ```

4. **Database Setup**:
   - Create a PostgreSQL database in Render
   - Copy the `DATABASE_URL` from database settings
   - Run migrations: `python manage.py migrate` (you can do this locally first)

### Frontend Deployment (Netlify)

1. **Create Netlify Site**:
   - Go to Netlify Dashboard → Add new site → Import from Git
   - Connect your GitHub repository
   - Set **Base directory**: `frontend`
   - Set **Build command**: `npm run build`
   - Set **Publish directory**: `dist`

2. **Environment Variables** (in Netlify Dashboard):
   ```
   VITE_API_URL=https://your-render-app.onrender.com/api
   ```

3. **Domain Configuration**:
   - Netlify will provide a domain (e.g., `amazing-site.netlify.app`)
   - Update your Render `CORS_ALLOWED_ORIGINS` with this domain

### Post-Deployment Steps

1. **Update CORS** in Render with your Netlify domain
2. **Test the Application**:
   - Frontend should load at your Netlify URL
   - API calls should work with your Render backend
3. **Create Admin User** (optional):
   ```bash
   # SSH into Render service or run locally with production DB
   python manage.py createsuperuser
   ```

### Troubleshooting

- **CORS Issues**: Ensure `CORS_ALLOWED_ORIGINS` includes your Netlify domain
- **API Connection**: Check that `VITE_API_URL` points to your Render backend
- **Static Files**: Run `collectstatic` during build for media files
- **Database**: Ensure PostgreSQL database is created and URL is correct

---

## Features

- ✅ Token-based authentication (login / register / logout)
- ✅ Role-based users: Admin, Manager, Developer
- ✅ Full CRUD for Projects and Tasks
- ✅ Task filtering by status, priority, project, search
- ✅ Dashboard with stats + recent/urgent tasks
- ✅ Task comments
- ✅ Progress tracking (0–100%)
- ✅ Due date tracking with overdue highlights
- ✅ Tags on tasks
- ✅ Estimated vs actual hours
- ✅ Team member management on projects
- ✅ Responsive design

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Django 4.2, DRF, SQLite |
| Auth | Token Authentication (DRF) |
| Frontend | React 18, Vite, React Router v6 |
| HTTP | Axios with interceptors |
| Styling | Custom CSS (no framework) |
