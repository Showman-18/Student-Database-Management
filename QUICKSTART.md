# Quick Start Guide

## System Requirements
- Node.js v16 or higher
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn package manager

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (already provided as .env.example)
# Make sure these are set:
# MONGODB_URI=mongodb://localhost:27017/student_db
# JWT_SECRET=your_jwt_secret_key_change_this_in_production
# PORT=5000
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=admin123

# Start the backend server
npm run dev
```

The backend will start on: **http://localhost:5000**

### 2. Database Setup (with Sample Data)

In a new terminal window:

```bash
cd backend

# Seed sample students (creates 6 sample students)
node seed.js

# You should see output like:
# ✓ Added 6 sample students
# 1. John Doe (GR: GR001)
# 2. Sarah Johnson (GR: GR002)
# ... and 4 more
```

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (use --legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps

# Start the frontend development server
npm run dev
```

The frontend will start on: **http://localhost:5173**

## Accessing the Application

1. Open your browser and go to: **http://localhost:5173**
2. You'll be redirected to the login page
3. Enter credentials:
   - **Username**: admin
   - **Password**: admin123
4. Click "Sign In"
5. You'll see the Student Dashboard with all students in a grid layout
6. Use the search bar to filter students by name or GR No
7. Click on any student card to view their detailed information

## Available Scripts

### Backend
```bash
npm run dev      # Start with auto-reload (development)
npm start        # Start production server
npm test         # Run tests (placeholder)
```

### Frontend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

## Key Features Overview

### Login Page
- Minimalist Windows startup-inspired design
- Glassmorphism effect for modern look
- Form validation
- Error messages

### Student Dashboard
- Responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)
- Real-time search/filter by Name or GR No
- Student cards with key information
- Click any card to view full details

### Student Detail Modal
- Covers 80% of screen (centered)
- Complete information display
- Organized sections:
  - Basic Information (Name, GR No, PAN, Phone)
  - Personal Details (Caste, Religion)
  - Address
  - Parent Details (Father & Mother info)

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify MongoDB is running
- Check .env file has correct MONGODB_URI

### Frontend won't start
- Clear node_modules and reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`
- Check if port 5173 is available
- Clear browser cache (Ctrl+Shift+Delete)

### Can't login
- Verify backend is running on port 5000
- Check MongoDB connection
- Default credentials: admin / admin123

### Can't see students
- Make sure you ran `node seed.js` to populate sample data
- Verify token is stored in localStorage after login
- Check browser console for API errors

## Next Steps

1. Change default admin password in .env
2. Set up MongoDB Atlas if using cloud database
3. Add student creation/edit functionality
4. Deploy to production servers
5. Set up CI/CD pipeline

## Support

For detailed information, see the main README.md file in the project root.

---

Last updated: February 16, 2026
