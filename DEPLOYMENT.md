# Deployment Guide

Complete guide for deploying the Student Management System to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database backups set up
- [ ] API endpoints tested thoroughly
- [ ] Frontend build created (`npm run build`)
- [ ] HTTPS certificates ready
- [ ] Monitoring and logging configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] CORS settings configured for production domain

## Backend Deployment

### Option 1: Heroku Deployment

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri
   heroku config:set JWT_SECRET=your_secure_random_string
   heroku config:set ADMIN_USERNAME=admin
   heroku config:set ADMIN_PASSWORD=your_secure_password
   heroku config:set NODE_ENV=production
   ```

4. **Create Procfile**
   ```
   web: node Index.js
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - Security group opens ports 80, 443, 5000
   - Create and download key pair

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install -y mongodb-org
   
   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Clone and Setup**
   ```bash
   cd /home/ubuntu
   git clone https://github.com/your-repo/student-db.git
   cd student-db/backend
   npm install
   
   # Create .env file
   nano .env
   # Add your environment variables
   ```

5. **Setup Process Manager (PM2)**
   ```bash
   sudo npm install -g pm2
   pm2 start Index.js --name "student-api"
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt-get install -y nginx
   ```

   Create `/etc/nginx/sites-available/student-api`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/student-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Certbot**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: DigitalOcean App Platform

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create App on DigitalOcean**
   - Connect GitHub repository
   - Select backend folder as build source
   - Set environment variables

3. **Configure App Spec**
   ```yaml
   name: student-management-api
   services:
   - name: api
     github:
       repo: your-username/student-db
       branch: main
     build_command: npm install
     run_command: node Index.js
     envs:
     - key: MONGODB_URI
       value: ${DATABASE_URL}
   databases:
   - name: mongodb
     engine: MONGODB
   ```

## Frontend Deployment

### Option 1: Vercel Deployment

1. **Push to GitHub** (if not already done)

2. **Deploy on Vercel**
   - Go to vercel.com
   - Import GitHub repository
   - Select frontend folder
   - Set build command: `npm run build`
   - Set output directory: `dist`

3. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-api-domain.com/api
   ```

4. **Update Frontend Code**
   ```javascript
   // In api/axios.js
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

### Option 2: Netlify Deployment

1. **Connect Repository**
   - Go to netlify.com
   - Connect your GitHub account
   - Select frontend folder

2. **Configure Build Settings**
   - Build command: `npm run build --legacy-peer-deps`
   - Publish directory: `dist`

3. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-api-domain.com/api
   ```

4. **Deploy Configuration** (netlify.toml)
   ```toml
   [build]
   command = "npm run build --legacy-peer-deps"
   publish = "dist"
   
   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```

### Option 3: AWS S3 + CloudFront

1. **Build the App**
   ```bash
   npm run build --legacy-peer-deps
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-student-management-app
   ```

3. **Upload Files**
   ```bash
   aws s3 sync dist/ s3://your-student-management-app/ \
     --delete \
     --cache-control "max-age=604800" \
     --exclude "index.html"
   
   aws s3 cp dist/index.html s3://your-student-management-app/index.html \
     --cache-control "max-age=0,no-cache,no-store,must-revalidate"
   ```

4. **Configure CloudFront**
   - Create distribution
   - Set S3 bucket as origin
   - Set default root object to `index.html`
   - Add error handling for SPA

## Database Deployment (MongoDB)

### MongoDB Atlas (Recommended)

1. **Create Account** at mongodb.com

2. **Create Cluster**
   - Choose free tier or paid
   - Select region closest to users
   - Create database user

3. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
   ```

4. **Update Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student_db
   ```

5. **Set Up Backups**
   - Enable automated backups in Atlas
   - Configure backup retention policy

### Self-Hosted MongoDB

1. **Install MongoDB on Server**
   ```bash
   sudo apt-get install -y mongodb-org
   ```

2. **Secure MongoDB**
   ```bash
   # Create admin user
   mongo
   > use admin
   > db.createUser({
     user: "admin",
     pwd: "strong_password",
     roles: ["root"]
   })
   > exit
   ```

3. **Configure replication for backups**
   ```
   # In /etc/mongod.conf
   replication:
     replSetName: "rs0"
   ```

4. **Regular Backups**
   ```bash
   # Add to crontab (backup daily at 2 AM)
   0 2 * * * mongodump --username admin --password --out /backups/mongodb/$(date +\%Y\%m\%d)
   ```

## Production Security

### SSL/TLS Certificate
```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d yourdomain.com
```

### Environment Variables Security
- Never commit .env files
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

### CORS Configuration
```javascript
// In backend/Index.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Request Validation
```bash
npm install joi
```

```javascript
const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
});
```

## Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 with monitoring
pm2 install pm2-logrotate
pm2 logs
```

### Error Tracking (Sentry)
```bash
npm install @sentry/node @sentry/tracing
```

```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.errorHandler());
```

### Application Performance Monitoring (APM)
- New Relic
- DataDog
- Elastic APM

## Continuous Integration/Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm install
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Heroku
      env:
        HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
      run: |
        git remote add heroku https://git.heroku.com/your-app-name.git
        git push heroku main
```

## Post-Deployment

### Verification Checklist
- [ ] Health check endpoint responding
- [ ] Login functionality works
- [ ] API endpoints accessible
- [ ] Frontend renders correctly
- [ ] Search functionality works
- [ ] Modal opens and displays data
- [ ] Database connections stable
- [ ] SSL certificate valid
- [ ] CORS working correctly
- [ ] Error logging active

### Performance Testing
```bash
# Using Hey (HTTP load generator)
go install github.com/rakyll/hey@latest
hey -n 1000 -c 100 https://your-domain.com/api/students
```

### Database Backup Verification
```bash
# Test restore process
mongorestore --uri "mongodb://..." dump/
```

## Rollback Procedures

### Rollback Strategy
1. Keep previous version on separate branch
2. Use feature flags for gradual rollout
3. Maintain database migration scripts
4. Keep API version in URL path

### Quick Rollback
```bash
# On Heroku
heroku releases
heroku rollback v123

# On AWS with CodeDeploy
aws deploy create-deployment --revision-type PREVIOUS_SUCCESSFUL
```

## Scaling Considerations

### Horizontal Scaling (Multiple Servers)
- Load balancer (Nginx, AWS ELB)
- Session management (Redis)
- Database replication

### Vertical Scaling
- More powerful server
- Increase RAM and CPU
- Optimize database indexes

### Caching Strategy
```javascript
// Add Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache student list
router.get('/students', async (req, res) => {
  const cached = await client.get('students');
  if (cached) return res.json(JSON.parse(cached));
  
  const students = await Student.find();
  await client.setex('students', 3600, JSON.stringify(students));
  res.json(students);
});
```

---

## Support & Troubleshooting

### Common Issues

**Database Connection Failed**
- Check MongoDB URI
- Verify IP whitelist in MongoDB Atlas
- Ensure firewall allows outbound connections

**CORS Errors**
- Verify CORS origin in backend
- Check request headers
- Test with curl first

**Memory Leaks**
- Use `npm audit`
- Check for event listener leaks
- Use memory profiling tools

---

Last updated: February 16, 2026
