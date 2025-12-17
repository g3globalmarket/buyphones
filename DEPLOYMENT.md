# Production Deployment Guide

This guide covers deploying the BuyPhones application to a production Linux server (Ubuntu).

## Prerequisites

- Ubuntu 20.04+ (or similar Linux distribution)
- Node.js 18+ installed
- pnpm installed globally (`npm install -g pnpm`)
- MongoDB installed and running (or MongoDB Atlas connection)
- Nginx installed
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)

## Server Setup

### 1. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm globally
npm install -g pnpm

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally (for process management)
npm install -g pm2

# Install MongoDB (if using local MongoDB)
# Or configure MongoDB Atlas connection string
```

### 2. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/buyphones
sudo chown $USER:$USER /var/www/buyphones

# Clone your repository (replace with your actual repo URL)
cd /var/www/buyphones
git clone <your-repo-url> .

# Or if you're uploading files manually, extract them to /var/www/buyphones
```

## Backend Deployment

### 1. Install Dependencies

```bash
cd /var/www/buyphones/backend
pnpm install --production=false
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with production values
nano .env
```

**Required production values:**

```env
# MongoDB - Use your production MongoDB URI
MONGODB_URI=mongodb://localhost:27017/electronics-buy
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/electronics-buy

# Server
PORT=3000
NODE_ENV=production

# Frontend URL - MUST match your actual domain
FRONTEND_URL=https://yourdomain.com

# Security - Generate strong secrets:
# openssl rand -base64 32
JWT_SECRET=<generate-strong-secret>
CODE_SECRET=<generate-strong-secret>
ADMIN_TOKEN=<generate-strong-secret>

# Rate limiting (optional, defaults shown)
THROTTLE_TTL=60
THROTTLE_LIMIT=20
```

**Generate secrets:**

```bash
openssl rand -base64 32  # Run 3 times for JWT_SECRET, CODE_SECRET, ADMIN_TOKEN
```

### 3. Build Backend

```bash
cd /var/www/buyphones/backend
pnpm build
```

### 4. Create Logs Directory

```bash
mkdir -p /var/www/buyphones/backend/logs
```

### 5. Start with PM2

```bash
cd /var/www/buyphones/backend

# Start the application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs buyphones-backend

# Save PM2 process list (so it restarts on server reboot)
pm2 save

# Enable PM2 to start on system boot
pm2 startup
# Follow the instructions printed by the command above
```

### 6. Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"ok","database":{"connected":true,"state":1},"timestamp":"..."}
```

## Frontend Deployment

### 1. Install Dependencies

```bash
cd /var/www/buyphones/frontend
pnpm install
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

**Required production values:**

```env
# API URL - Use your production API URL
# If using Nginx proxy with /api prefix:
VITE_API_URL=https://yourdomain.com/api
# Or if backend is on a subdomain:
# VITE_API_URL=https://api.yourdomain.com

# Inactivity settings (optional, defaults shown)
VITE_INACTIVITY_TIMEOUT_MINUTES=30
VITE_INACTIVITY_WARNING_MINUTES=5
```

### 3. Build Frontend

```bash
cd /var/www/buyphones/frontend
pnpm build
```

The built files will be in `frontend/dist/` directory.

## Nginx Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/buyphones
```

**Full Nginx configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend static files
    root /var/www/buyphones/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy - Proxy all /api/* requests to backend
    location /api {
        # Remove /api prefix when forwarding to backend
        rewrite ^/api/(.*) /$1 break;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (optional, if you want to expose it)
    location /api/health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off; # Don't log health checks
    }

    # Uploads - Proxy to backend (MUST be before location / to prevent SPA catch-all)
    # This ensures /uploads/* requests are proxied to backend, not served as HTML
    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache uploaded files
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend SPA - Serve React app (catch-all, must be last)
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**Important:** Replace `yourdomain.com` with your actual domain name.

### 2. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/buyphones /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx and set up auto-renewal
```

## File Permissions

```bash
# Ensure proper ownership
sudo chown -R $USER:$USER /var/www/buyphones

# Ensure uploads directory is writable
chmod 755 /var/www/buyphones/backend/uploads
```

## Testing Deployment

### 1. Test Backend Health

```bash
# From server
curl http://localhost:3000/health

# From external (should work if firewall allows)
curl https://yourdomain.com/api/health
```

### 2. Test Frontend

- Open `https://yourdomain.com` in a browser
- Verify the React app loads
- Check browser console for errors

### 3. Test API Endpoints

```bash
# Test public endpoint (should work)
curl https://yourdomain.com/api/model-prices?activeOnly=true

# Test authenticated endpoint (should require token)
curl https://yourdomain.com/api/buy-requests
```

### 4. Test File Uploads

- Use the frontend form to upload a photo
- Verify the file appears in `/var/www/buyphones/backend/uploads`
- Verify the image loads at `https://yourdomain.com/uploads/<filename>`

## Monitoring & Maintenance

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs buyphones-backend

# Restart application
pm2 restart buyphones-backend

# Stop application
pm2 stop buyphones-backend

# View real-time monitoring
pm2 monit

# View process info
pm2 info buyphones-backend
```

### Log Files

- PM2 logs: `/var/www/buyphones/backend/logs/pm2-*.log`
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`

### Updating the Application

```bash
# 1. Pull latest changes (if using git)
cd /var/www/buyphones
git pull

# 2. Update backend
cd backend
pnpm install
pnpm build
pm2 restart buyphones-backend

# 3. Update frontend
cd ../frontend
pnpm install
pnpm build
# Nginx will automatically serve the new build

# 4. Verify
pm2 logs buyphones-backend
curl https://yourdomain.com/api/health
```

## Troubleshooting

### Backend Not Starting

1. **Check PM2 logs:**

   ```bash
   pm2 logs buyphones-backend --lines 50
   ```

2. **Check environment variables:**

   ```bash
   cd /var/www/buyphones/backend
   cat .env
   ```

3. **Verify MongoDB connection:**

   ```bash
   # Test MongoDB connection string
   mongosh "your-mongodb-uri"
   ```

4. **Check port availability:**
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

### Frontend Not Loading

1. **Check Nginx error logs:**

   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verify build directory exists:**

   ```bash
   ls -la /var/www/buyphones/frontend/dist
   ```

3. **Check file permissions:**
   ```bash
   ls -la /var/www/buyphones/frontend/dist
   ```

### API Requests Failing (CORS Errors)

1. **Verify FRONTEND_URL in backend .env:**

   ```bash
   grep FRONTEND_URL /var/www/buyphones/backend/.env
   ```

   Must match your actual domain: `https://yourdomain.com`

2. **Restart backend:**
   ```bash
   pm2 restart buyphones-backend
   ```

### File Uploads Not Working

1. **Check uploads directory permissions:**

   ```bash
   ls -la /var/www/buyphones/backend/uploads
   chmod 755 /var/www/buyphones/backend/uploads
   ```

2. **Verify Nginx can proxy to /uploads:**

   ```bash
   curl https://yourdomain.com/uploads/test.jpg
   ```

3. **Check backend logs for upload errors:**
   ```bash
   pm2 logs buyphones-backend | grep upload
   ```

### 502 Bad Gateway

1. **Backend not running:**

   ```bash
   pm2 status
   pm2 restart buyphones-backend
   ```

2. **Wrong proxy_pass URL:**

   - Verify Nginx config has `proxy_pass http://127.0.0.1:3000;`
   - Check backend PORT in .env matches

3. **Firewall blocking:**
   ```bash
   sudo ufw status
   sudo ufw allow 3000/tcp  # Only if needed
   ```

### Health Check Failing

1. **Test backend directly:**

   ```bash
   curl http://localhost:3000/health
   ```

2. **Check MongoDB connection:**
   - Verify MONGODB_URI in .env
   - Test connection: `mongosh "your-mongodb-uri"`

## Security Checklist

- [ ] All secrets (JWT_SECRET, CODE_SECRET, ADMIN_TOKEN) are strong random values
- [ ] FRONTEND_URL matches actual production domain
- [ ] SSL certificate is valid and auto-renewing
- [ ] Nginx security headers are configured
- [ ] Backend .env file has restricted permissions: `chmod 600 .env`
- [ ] MongoDB connection uses authentication
- [ ] Firewall (ufw) is configured to only allow necessary ports
- [ ] PM2 process is running as non-root user
- [ ] Regular backups of MongoDB database
- [ ] Regular backups of uploaded files in `/uploads`

## Backup Strategy

### Database Backup

```bash
# MongoDB backup script (add to crontab)
mongodump --uri="your-mongodb-uri" --out=/backup/mongodb/$(date +%Y%m%d)
```

### File Uploads Backup

```bash
# Backup uploads directory
tar -czf /backup/uploads/$(date +%Y%m%d)-uploads.tar.gz /var/www/buyphones/backend/uploads
```

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)

---

**Last Updated:** 2025-01-15
