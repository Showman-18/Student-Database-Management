# Frontend Documentation

Complete technical documentation for the Student Management System frontend.

## Architecture Overview

```
Frontend (React + Tailwind CSS)
├── src/
│   ├── api/
│   │   └── axios.js (HTTP client with interceptors)
│   ├── components/
│   │   ├── ProtectedRoute.jsx (Route protection)
│   │   └── StudentModal.jsx (Detail modal)
│   ├── pages/
│   │   ├── Login.jsx (Authentication page)
│   │   └── Dashboard.jsx (Main app page)
│   ├── App.jsx (Router setup)
│   ├── main.jsx (Entry point)
│   └── index.css (Global styles + Tailwind)
├── vite.config.js (Build config)
├── tailwind.config.js (Tailwind config)
└── postcss.config.js (PostCSS config)
```

## Installation & Setup

### Prerequisites
- Node.js v16+
- npm or yarn
- Backend running on http://localhost:5000

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   (legacy-peer-deps needed for React 19 compatibility with lucide-react)

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at: **http://localhost:5173**

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure & Components

### Axios Configuration (api/axios.js)

Configured with request/response interceptors:

```javascript
- Request Interceptor: Adds JWT token from localStorage
- Response Interceptor: Handles 401 errors, redirects to login
```

**Usage:**
```javascript
import axios from '../api/axios';

// Automatically includes Authorization header
const response = await axios.get('/students');
```

### ProtectedRoute Component

Guards routes that require authentication.

```javascript
// Usage in App.jsx
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

// Checks for valid token in localStorage
// Redirects to /login if not authenticated
```

### Login Page

**Features:**
- Minimalist Windows startup-inspired design
- Glassmorphism effect (blurred background + transparency)
- Form validation
- Error message display
- Loading state

**Components:**
- Username input with icon
- Password input with icon
- Submit button
- Error alert

**Form Submission:**
```javascript
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

// Response
{
  "token": "jwt_token_here",
  "admin": { "id": "...", "username": "admin" }
}
```

Token is saved to localStorage for future requests.

### Dashboard Page

**Features:**
- Responsive grid layout (1/2/3 columns based on screen size)
- Real-time search/filter functionality
- Student cards with key information
- Click to view detailed information
- Logout button

**Search Functionality:**
```javascript
// Filters students by:
- Full Name (case-insensitive)
- GR Number (case-insensitive)

// Real-time filtering as user types
```

**API Integration:**
```javascript
GET /api/students // Fetch all students
// Uses axios with token interceptor
```

### StudentModal Component

**Features:**
- Centered modal covering 80% of screen
- Organized information sections
- Smooth animations
- Responsive design

**Sections:**
1. **Basic Information**
   - Full Name
   - GR No
   - PAN No
   - Phone Number

2. **Personal Details**
   - Caste
   - Religion

3. **Address**
   - Complete address

4. **Parent Details**
   - Father: Name & Contact
   - Mother: Name & Contact

## Styling & Theming

### Tailwind CSS Configuration

**Color Palette:**
```
Primary: Blue (from-blue-400 to-purple-600)
Backgrounds: Gray gradients
Glass effect: White/transparent overlays with blur
```

**Key Classes:**
```css
.glass - Glassmorphism effect (10px blur)
.glass-dark - Dark glassmorphism
```

### Responsive Breakpoints

```
Mobile: < 768px (sm)
Tablet: 768px - 1024px (md)
Desktop: > 1024px (lg)

Grid layout:
- 1 column on mobile
- 2 columns on tablet
- 3 columns on desktop
```

## Routing

**Protected Routes:**

```
/login           → Login (public)
/dashboard       → Student Dashboard (protected)
/                → Redirects to /dashboard
```

**Route Protection:**
```javascript
// Checks for token in localStorage
// No token = redirect to /login
// Token present = allow access
```

## State Management

### Local Component State

**Login Page:**
```javascript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```

**Dashboard Page:**
```javascript
const [students, setStudents] = useState([]);
const [filteredStudents, setFilteredStudents] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedStudent, setSelectedStudent] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

**Note:** For larger apps, consider using Redux or Context API.

## API Integration

### Authentication Flow

1. **Login**
   ```javascript
   axios.post('/auth/login', { username, password })
   // Save token to localStorage
   localStorage.setItem('token', response.data.token);
   ```

2. **Protected Requests**
   ```javascript
   // Token automatically added by interceptor
   axios.get('/students')
   // Header: Authorization: Bearer <token>
   ```

3. **Logout**
   ```javascript
   localStorage.removeItem('token');
   navigate('/login');
   ```

### Error Handling

```javascript
// Automatic logout on 401/token expiration
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## UI Components

### Button Styles

**Primary Button:**
```jsx
<button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg">
  Sign In
</button>
```

**Secondary Button:**
```jsx
<button className="bg-gray-300 text-gray-900 hover:bg-gray-400">
  Close
</button>
```

### Input Styles

**Glassmorphism Input:**
```jsx
<input className="bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:bg-white/30 focus:border-white/50" />
```

### Card Styles

**Student Card:**
```jsx
<div className="bg-white rounded-xl shadow-md hover:shadow-xl border-l-4 border-blue-500">
  {/* Gradient header, student info */}
</div>
```

## Performance Considerations

1. **Lazy Loading:**
   - Implement React.lazy() for route-based code splitting
   - Load Dashboard only when needed

2. **Image Optimization:**
   - Use optimized images in public folder
   - Serve appropriate sizes for different devices

3. **Memoization:**
   - Use React.memo() for StudentModal if needed
   - useMemo() for expensive calculations

4. **API Optimization:**
   - Students fetched once on mount
   - Search happens client-side (for small datasets)
   - Add pagination for larger datasets

## Development

### Start Development Server
```bash
npm run dev
```

Features:
- Hot Module Replacement (HMR)
- Fast refresh on file changes
- Instant build feedback

### Build for Production
```bash
npm run build
```

Outputs optimized build to `dist/` folder.

### Linting
```bash
npm run lint
```

Runs ESLint to check code quality.

## Adding New Features

### Example: Add Student Button

```jsx
// In Dashboard.jsx
<button 
  onClick={() => setShowAddModal(true)}
  className="fixed bottom-6 right-6 bg-blue-500 text-white rounded-full p-4"
>
  + Add Student
</button>
```

### Example: Edit Student

```jsx
// Add edit functionality
const handleEdit = (student) => {
  setSelectedStudent(student);
  setShowEditModal(true);
};

// In API
axios.put(`/students/${student._id}`, updatedData);
```

## Environment Variables

No environment variables needed in frontend (API URL is hardcoded to localhost:5000).

For production, update `src/api/axios.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**CSS Features Used:**
- CSS Grid
- CSS Flexbox
- CSS Gradients
- CSS Backdrop Filters (glassmorphism)
- CSS Transitions

## Accessibility

**Current Features:**
- Semantic HTML elements
- Proper form labels
- Keyboard navigation
- Color contrast compliance

**Future Improvements:**
- ARIA labels
- Screen reader testing
- Focus indicators
- Keyboard shortcuts

## Testing

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Search functionality works
- [ ] Student cards display correctly
- [ ] Modal opens on card click
- [ ] Modal displays all information
- [ ] Modal closes properly
- [ ] Logout works
- [ ] Navigation after logout redirects to login
- [ ] Responsive design on mobile/tablet/desktop

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill
```

### API Connection Error
- Verify backend is running on port 5000
- Check CORS configuration on backend
- Check browser console for specific error

### Token Issues
- Clear localStorage: `localStorage.clear()`
- Clear browser cache (Ctrl+Shift+Delete)
- Re-login

### Styling Issues
- Clear Tailwind cache: `npx tailwindcss init --force`
- Rebuild: `npm run build`

## Deployment

### Build Optimization
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
1. Push to GitHub
2. Connect repository to Vercel/Netlify
3. Set API URL environment variable
4. Deploy

### Serve from Nginx
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /path/to/dist;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

For backend documentation, see [BACKEND_DOCS.md](./BACKEND_DOCS.md)

Last updated: February 16, 2026
