# Django-React Full Stack App

A modern full-stack web application combining Django REST Framework backend with React frontend. Features user authentication with JWT tokens, note management, and a responsive UI.

## 📋 Project Structure

```
Django-React-Full-Stack-App/
├── backend/                 # Django REST API
│   ├── api/                 # Main application
│   │   ├── models.py        # Database models
│   │   ├── serializers.py   # DRF serializers
│   │   ├── views.py         # API views
│   │   ├── urls.py          # API routes
│   │   └── migrations/      # Database migrations
│   ├── backend/             # Django project settings
│   │   ├── settings.py      # Configuration
│   │   ├── urls.py          # Main URL routing
│   │   ├── asgi.py          # ASGI config
│   │   └── wsgi.py          # WSGI config
│   ├── manage.py            # Django management CLI
│   ├── db.sqlite3           # SQLite database
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── README.md            # Backend documentation
│
└── frontend/                # React application
    ├── src/
    │   ├── components/      # Reusable React components
    │   │   ├── Form.jsx     # Note form component
    │   │   ├── Note.jsx     # Note display component
    │   │   ├── ProtectedRoute.jsx    # Auth wrapper
    │   │   ├── LoadingIndicator.jsx  # Loading UI
    │   │   └── LogoutButton.jsx      # Logout control
    │   ├── pages/           # Page-level components
    │   │   ├── Home.jsx     # Main notes page
    │   │   ├── Login.jsx    # Login page
    │   │   ├── Register.jsx # Registration page
    │   │   └── NotFound.jsx # 404 page
    │   ├── styles/          # CSS stylesheets
    │   ├── api.js           # API client (Axios)
    │   ├── constants.js     # App-wide constants
    │   ├── App.jsx          # Root component with routing
    │   └── main.jsx         # Application entry point
    ├── package.json         # Node.js dependencies
    ├── vite.config.js       # Vite build configuration
    ├── index.html           # HTML template
    └── README.md            # Frontend documentation
```

## ✨ Features

- **🔐 User Authentication** - Register, login, and secure sessions with JWT tokens
- **🛡️ Protected Routes** - Access control for authenticated-only pages
- **📝 Note Management** - Full CRUD operations (Create, Read, Update, Delete)
- **📱 Responsive UI** - Mobile-friendly design with loading indicators
- **⚡ Fast Development** - Vite for instant HMR and optimized builds
- **REST API** - Clean RESTful API with proper serialization

## 🛠️ Tech Stack

### Backend
- **Django 3.2+** - Web framework
- **Django REST Framework** - REST API development
- **Django CORS Headers** - Cross-origin support
- **Django Simple JWT** - Token authentication
- **SQLite** - Database (development)
- **Python 3.8+** - Backend language

### Frontend
- **React 18+** - UI library
- **Vite** - Next-generation build tool
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **JavaScript (ES6+)** - Frontend language

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- pip (Python package manager)
- npm or yarn (Node package manager)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\Activate.ps1

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Windows
copy .env.example .env
# macOS/Linux
cp .env.example .env
```

5. Apply database migrations:
```bash
python manage.py migrate
```

6. Create a superuser for admin access (optional):
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT token
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/user/` - Get current user info

### Notes
- `GET /api/notes/` - List all user notes
- `POST /api/notes/` - Create a new note
- `GET /api/notes/{id}/` - Get specific note
- `PUT /api/notes/{id}/` - Update note
- `DELETE /api/notes/{id}/` - Delete note

## 🔧 Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend
python manage.py collectstatic
```

**Frontend:**
```bash
cd frontend
npm run build
```

The production build will be in `dist/` directory.

## 🔐 Authentication Details

The app uses JWT (JSON Web Token) authentication:
1. **Registration** - Users create an account with username, email, and password
2. **Login** - Users receive a JWT token upon successful login
3. **Token Storage** - Token is stored in browser localStorage
4. **Protected Routes** - Frontend checks token validity before accessing protected pages
5. **API Requests** - All API requests include token in Authorization header

## 📖 Documentation

For detailed documentation on each component:
- [Backend Documentation](backend/README.md) - Django API setup and endpoints
- [Frontend Documentation](frontend/README.md) - React app structure and components

## 🐛 Troubleshooting

### CORS Errors
- Ensure frontend URL is in Django `CORS_ALLOWED_ORIGINS`
- Check `backend/backend/settings.py` for proper CORS configuration
- Common fix: Add `http://localhost:5173` to CORS whitelist

### API Connection Issues
- Verify Django backend is running on `http://localhost:8000`
- Check `frontend/src/constants.js` for correct API base URL
- Ensure firewall allows local connections

### Database Issues
- Run migrations: `python manage.py migrate`
- Reset database: `rm backend/db.sqlite3` then `python manage.py migrate`
- Check database file permissions

### Token/Authentication Issues
- Verify token is in localStorage (DevTools > Application > Storage)
- Ensure Authorization header is being sent correctly
- Check token expiration time

## 📦 Project Dependencies

### Backend
See `backend/requirements.txt`:
- Django
- djangorestframework
- django-cors-headers
- djangorestframework-simplejwt

### Frontend
See `frontend/package.json`:
- React
- React-Router-DOM
- Axios
- Vite

## 🚢 Deployment

### Backend Deployment (e.g., Heroku)
1. Set environment variables in your hosting platform
2. Use PostgreSQL instead of SQLite for production
3. Run: `python manage.py collectstatic`
4. Use Gunicorn or similar WSGI server

### Frontend Deployment (e.g., Vercel, Netlify)
1. Run: `npm run build`
2. Deploy the `dist/` folder to your hosting service
3. Update API base URL for production environment

See `backend/Procfile` for deployment configuration example.
