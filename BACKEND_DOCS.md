# Backend Documentation

Complete technical documentation for the Student Management System backend.

## Architecture Overview

```
Backend (Express + MongoDB)
├── Index.js (Entry point)
├── models/ (Mongoose schemas)
│   ├── Student.js (Student data model)
│   └── Admin.js (Admin authentication)
├── routes/ (API endpoints)
│   ├── auth.js (Authentication endpoints)
│   └── students.js (CRUD operations)
├── middleware/ (Custom middleware)
│   └── auth.js (JWT verification)
└── seed.js (Database seeding)
```

## Installation & Setup

### Prerequisites
- Node.js v16+
- MongoDB v4.4+
- npm or yarn

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/student_db
   JWT_SECRET=change_this_to_a_secure_random_string
   PORT=5000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

3. **Initialize Admin User**
   ```bash
   curl -X POST http://localhost:5000/api/auth/init-admin
   ```

4. **Seed Database (Optional)**
   ```bash
   node seed.js
   ```

## Data Models

### Student Schema

```javascript
{
  _id: ObjectId,
  fullName: String (required),
  grNo: String (required, unique),
  panNo: String (required, unique),
  phoneNumber: String (required),
  caste: String,
  religion: String,
  address: String,
  fatherName: String,
  fatherContact: String,
  motherName: String,
  motherContact: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Schema

```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  password: String (required, hashed with bcryptjs),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login with admin credentials.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success - 200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin"
  }
}
```

**Response (Error - 401):**
```json
{
  "message": "Invalid credentials"
}
```

#### POST /api/auth/init-admin
Initialize admin user (run once).

**Request:** No body needed

**Response (Success - 201):**
```json
{
  "message": "Admin created successfully"
}
```

---

### Student Endpoints

All student endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

#### GET /api/students
Fetch all students.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "grNo": "GR001",
    "panNo": "PAN001",
    "phoneNumber": "+1234567890",
    "caste": "General",
    "religion": "Christian",
    "address": "123 Main Street",
    "fatherName": "James Doe",
    "fatherContact": "+1234567891",
    "motherName": "Mary Doe",
    "motherContact": "+1234567892",
    "createdAt": "2026-02-16T15:30:00.000Z",
    "updatedAt": "2026-02-16T15:30:00.000Z"
  }
  // ... more students
]
```

#### GET /api/students/:id
Fetch specific student by ID.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "grNo": "GR001",
  // ... all fields
}
```

**Response (404):**
```json
{
  "message": "Student not found"
}
```

#### POST /api/students
Create a new student (requires authentication).

**Request:**
```json
{
  "fullName": "Jane Smith",
  "grNo": "GR007",
  "panNo": "PAN007",
  "phoneNumber": "+1234567890",
  "caste": "OBC",
  "religion": "Hindu",
  "address": "456 Oak Ave",
  "fatherName": "John Smith",
  "fatherContact": "+1234567891",
  "motherName": "Susan Smith",
  "motherContact": "+1234567892"
}
```

**Response (201):**
```json
{
  "message": "Student created successfully",
  "student": { /* student object */ }
}
```

**Response (400):**
```json
{
  "message": "GR No already exists"
}
```

#### PUT /api/students/:id
Update student information.

**Request:** (same as POST, but partial updates allowed)

**Response (200):**
```json
{
  "message": "Student updated successfully",
  "student": { /* updated student object */ }
}
```

#### DELETE /api/students/:id
Delete a student.

**Response (200):**
```json
{
  "message": "Student deleted successfully"
}
```

---

## Authentication Flow

1. **Login Request**
   - User sends credentials to `/api/auth/login`
   - Backend validates against Admin collection
   - JWT token generated with 24-hour expiration

2. **Protected Requests**
   - Client includes token in Authorization header
   - Middleware verifies token signature
   - Request proceeds if token is valid
   - Returns 401 if token expired or invalid

3. **Token Refresh**
   - Tokens expire after 24 hours
   - Client must re-login to get new token

## Middleware

### verify Token Middleware

Located in `middleware/auth.js`

```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};
```

## Error Handling

The backend includes comprehensive error handling:

- **400 Bad Request**: Missing required fields or validation errors
- **401 Unauthorized**: Invalid credentials or expired token
- **403 Forbidden**: No token provided
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Database or server errors

## Environment Variables

```
MONGODB_URI          # MongoDB connection string
JWT_SECRET           # Secret key for JWT signing (min 32 chars in production)
PORT                 # Server port (default: 5000)
ADMIN_USERNAME       # Default admin username
ADMIN_PASSWORD       # Default admin password
```

## Security Features

- **Password Hashing**: Passwords hashed with bcryptjs (10 salt rounds)
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Cross-origin requests configured
- **Input Validation**: Required fields validated
- **Unique Constraints**: GR No and PAN No enforce uniqueness
- **Token Expiration**: Tokens expire after 24 hours

## Database Queries

### Sample MongoDB Queries

```javascript
// Find all students
db.students.find({})

// Find student by GR No
db.students.findOne({ grNo: "GR001" })

// Count all students
db.students.countDocuments()

// Find students by religion
db.students.find({ religion: "Hindu" })

// Update student
db.students.updateOne(
  { _id: ObjectId("...") },
  { $set: { phoneNumber: "+9999999999" } }
)

// Delete student
db.students.deleteOne({ _id: ObjectId("...") })
```

## Performance Optimization

- Connection pooling configured in Mongoose
- Indexes on frequently queried fields (grNo, panNo)
- Lean queries for read-only operations
- Pagination ready (can be added to GET /api/students)

## Development

### Start Development Server
```bash
npm run dev
```

Uses `--watch` flag for auto-restart on file changes.

### Create New Endpoints Example

```javascript
// In routes/students.js
router.post('/search', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    const results = await Student.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { grNo: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Search error', error: error.message });
  }
});
```

## Testing

Basic testing can be done with curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get all students (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/students
```

## Deployment Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Update database connection to production MongoDB
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Set up environment-specific .env files
- [ ] Configure CORS for production domain
- [ ] Set up logging
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Test all endpoints thoroughly

## Troubleshooting

### MongoDB Connection Error
- Verify MongoDB is running
- Check connection string in .env
- For MongoDB Atlas, whitelist IP address

### JWT Token Errors
- Ensure JWT_SECRET is consistent across requests
- Check token hasn't expired
- Verify Authorization header format: `Bearer <token>`

### Duplicate Key Error
- GR No or PAN No already exists in database
- Check database for duplicates: `db.students.find({ grNo: "value" })`

---

For frontend documentation, see [FRONTEND_DOCS.md](./FRONTEND_DOCS.md)

Last updated: February 16, 2026
