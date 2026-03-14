# Student Management System

A complete full-stack (SQLite, Express, React, Node.js) application for managing student information with a modern UI and secure authentication.

## Features

- **Secure Authentication**: JWT-based login system with protected routes
- **First-Run Account Setup**: Create admin username/password on first launch
- **Student Dashboard**: View all students in a responsive grid layout
- **Search Functionality**: Filter students by full name or GR number
- **Detailed View**: Click on any student to view complete information in a modal
- **Modern UI**: Built with Tailwind CSS and Glassmorphism effects
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Desktop App Support**: Run the full app as a local Electron desktop app
- **Data Safety**: Automated SQLite backups, integrity checks, and one-click restore tools

## Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Axios** for API calls
- **Lucide React** for icons

### Desktop
- **Electron** wrapper for full local desktop usage

### Backend
- **Node.js** with Express
- **SQLite3** local database
- **JWT** for authentication
- **CORS** for cross-origin requests
- **BCryptjs** for password hashing

## Project Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

4. Seed the database with sample students (optional):
```bash
node seed.js
```

5. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be accessible at `http://localhost:5173`

### Electron Desktop Setup

1. Install root dependencies:
```bash
npm install
```

2. Ensure backend and frontend dependencies are installed:
```bash
npm --prefix backend install
npm --prefix frontend install
```

3. Seed local SQLite data (optional):
```bash
npm run seed
```

4. Run Electron in development mode (starts backend + frontend + desktop window):
```bash
npm run desktop:dev
```

5. Run Electron in production-style mode (uses built frontend files):
```bash
npm run desktop
```

## API Endpoints

### Authentication
- `GET /api/auth/status` - Check whether first-time setup is required
- `POST /api/auth/setup` - Create first admin account (one-time)
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/init-admin` - Initialize admin user (run once)
- `POST /api/auth/update-credentials` - Change username/password (requires login)

### Students (Protected - Requires JWT)
- `GET /api/students` - Fetch all students
- `GET /api/students/:id` - Fetch specific student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### System Safety (Protected - Requires JWT)
- `GET /api/system/db/status` - Run database quick/integrity checks
- `GET /api/system/backups` - List available backups
- `POST /api/system/backups` - Create a new backup now
- `POST /api/system/backups/restore` - Restore from selected backup

## Default Admin Credentials

```
Username: admin
Password: admin123
```

**Important**: Change these credentials in production!

## Project Structure

```
Student Database Management/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   └── students.js
│   ├── middleware/
│   │   └── auth.js
│   ├── data/
│   │   └── student_management.db
│   ├── .env
│   ├── .env.example
│   ├── db.js
│   ├── Index.js
│   ├── seed.js
│   └── package.json
├── electron/
│   └── main.cjs
├── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   └── StudentModal.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   └── Dashboard.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── App.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

## Usage

1. **Login**: Navigate to the login page and enter admin credentials
2. **View Students**: After login, you'll see the student dashboard with all students
3. **Search**: Use the search bar to filter students by name or GR number
4. **View Details**: Click on any student card to view their complete information

## Features Breakdown

### Login Page
- Minimalist Windows startup-inspired design
- Glassmorphism effect for the login card
- Smooth animations and transitions
- Form validation and error handling

### Student Dashboard
- Grid layout that's responsive (1 column on mobile, 2 on tablet, 3 on desktop)
- Search functionality with real-time filtering
- Student cards showing key information
- Hover effects and smooth transitions

### Student Detail Modal
- Centered modal covering 80% of the screen
- Complete student information display
- Organized information in sections
- Parent details in separate colored cards

## Security Features

- JWT token-based authentication
- Protected API endpoints
- Token expiration (24 hours)
- Automatic logout on token expiration
- Password hashing with bcryptjs

## Backup & Recovery

- SQLite runs in WAL mode with durable sync settings to reduce corruption risk.
- Backups are created automatically on interval (`BACKUP_INTERVAL_MINUTES`).
- Old backups are pruned using retention (`BACKUP_RETENTION_COUNT`).
- Dashboard provides manual backup, health-check, and restore controls.
- For desktop mode, database and backups are stored in Electron user data directory.

## Error Handling

- Comprehensive error messages
- Validation at both frontend and backend
- Unique constraint handling for GR No and PAN No
- Graceful error display to users

## Future Enhancements

- Student creation and editing functionality
- Admin panel for user management
- Email notifications
- Export student data to PDF/Excel
- Advanced filtering and sorting options
- Student attendance tracking
- Grade management system

## License

ISC

## Support

For issues or questions, please check the documentation or create an issue in the repository.
