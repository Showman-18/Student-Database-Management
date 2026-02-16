# Student Management System

A complete MERN (MongoDB, Express, React, Node.js) application for managing student information with a modern UI and secure authentication.

## Features

- **Secure Authentication**: JWT-based login system with protected routes
- **Student Dashboard**: View all students in a responsive grid layout
- **Search Functionality**: Filter students by full name or GR number
- **Detailed View**: Click on any student to view complete information in a modal
- **Modern UI**: Built with Tailwind CSS and Glassmorphism effects
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ORM
- **JWT** for authentication
- **CORS** for cross-origin requests
- **BCryptjs** for password hashing

## Project Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud)
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
MONGODB_URI=mongodb://localhost:27017/student_db
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

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/init-admin` - Initialize admin user (run once)

### Students (Protected - Requires JWT)
- `GET /api/students` - Fetch all students
- `GET /api/students/:id` - Fetch specific student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

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
│   ├── models/
│   │   ├── Student.js
│   │   └── Admin.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── students.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   ├── .env.example
│   ├── Index.js
│   ├── seed.js
│   └── package.json
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
