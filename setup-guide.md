# SmartStore AI - Complete Setup Guide

## 📚 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step-by-Step Setup](#step-by-step-setup)
3. [Database Configuration](#database-configuration)
4. [Running the Application](#running-the-application)
5. [Seeding Sample Data](#seeding-sample-data)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher (comes with Node.js)
- **MongoDB:** Free tier account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git:** For version control
- **Text Editor:** VS Code recommended

### Install Node.js
1. Visit [nodejs.org](https://nodejs.org)
2. Download LTS version
3. Run installer and follow prompts
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new project
4. Create a cluster (Free tier)
5. Get connection string (see Database Configuration below)

---

## Step-by-Step Setup

### 1. Extract Project Files
```bash
# Navigate to your project directory
cd "Desktop/WINTER PEP FINAL PROJECT/smartstore-ai"
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

This will install:
- express - Web framework
- mongoose - MongoDB ORM
- jsonwebtoken - Authentication
- bcryptjs - Password hashing
- cors - Cross-origin support
- dotenv - Environment variables
- nodemon - Auto-reload during development

### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install
```

This will install:
- react - UI library
- vite - Build tool
- tailwindcss - Styling
- framer-motion - Animations
- recharts - Charts
- axios - HTTP client
- react-router-dom - Routing

---

## Database Configuration

### Get MongoDB Connection String

1. **Login to MongoDB Atlas**
   - Visit [atlas.mongodb.com](https://atlas.mongodb.com)
   - Sign in to your account

2. **Navigate to Your Cluster**
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Select Node.js driver

3. **Copy Connection String**
   - You'll see something like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Configure Backend Environment

1. **Create .env file in server directory**
   ```bash
   cd server
   cp .env.example .env
   ```

2. **Edit server/.env**
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/smartstore?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-key-should-be-at-least-32-characters-long
   JWT_EXPIRE=7d
   OPENAI_API_KEY=sk-your-openai-api-key-here
   GEMINI_API_KEY=your-google-gemini-api-key-here
   CORS_ORIGIN=http://localhost:5173
   ```

   **Replace:**
   - `your-username` - Your MongoDB username
   - `your-password` - Your MongoDB password
   - `cluster0.xxxxx` - Your MongoDB cluster name
   - `your-super-secret-key...` - Any random string (for JWT)
   - API keys are optional for now

3. **Create .env.local file in client directory**
   ```bash
   cd ../client
   cp .env.example .env.local
   ```

   **Content:**
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_APP_NAME=SmartStore AI
   ```

---

## Running the Application

### Option 1: Using Three Terminals (Recommended)

**Terminal 1 - Backend Server**
```bash
cd server
npm run dev
# Output: Server is running on port 5000
```

**Terminal 2 - Frontend Server**
```bash
cd client
npm run dev
# Output: Local: http://localhost:5173
```

**Terminal 3 - Seed Database (Optional)**
```bash
cd server
npm run seed
# Wait for completion before logging in
```

### Option 2: Starting Sequentially

```bash
# Start backend (in separate terminal)
cd server && npm run dev

# In another terminal, start frontend
cd client && npm run dev

# Seed database when ready
cd server && npm run seed
```

---

## Seeding Sample Data

The seed script creates:
- **Admin User** (admin@smartstore.ai / Admin@123)
- **8 Sample Products** with various categories
- **50 Sample Sales Records** with different statuses

### Run Seed Script
```bash
cd server
npm run seed
```

### Expected Output
```
✅ Admin user created
✅ 8 sample products created
✅ 50 sample sales created

🎉 Database seeded successfully!

📝 Login Credentials:
   Email: admin@smartstore.ai
   Password: Admin@123
```

---

## Accessing the Application

1. **Frontend:** Open browser to `http://localhost:5173`
2. **Backend API:** `http://localhost:5000/api`
3. **Health Check:** `http://localhost:5000/api/health`

### Login
- Email: `admin@smartstore.ai`
- Password: `Admin@123`

---

## Available Commands

### Frontend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend Commands
```bash
npm run dev      # Start with auto-reload (nodemon)
npm start        # Start production server
npm run seed     # Seed database with sample data
```

---

## Troubleshooting

### MongoDB Connection Issues

**Problem:** `Error connecting to MongoDB`

**Solution:**
1. Verify connection string in `.env`
2. Check MongoDB Atlas IP whitelist:
   - Go to Network Access in MongoDB Atlas
   - Add your IP or 0.0.0.0/0 (allow all)
3. Ensure database name is correct
4. Check username/password has no special characters (or are URL encoded)

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

### Dependencies Installation Fails

**Problem:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall
npm install
```

### Frontend Not Connecting to Backend

**Problem:** API calls fail with CORS error

**Solution:**
1. Ensure backend is running on `http://localhost:5000`
2. Check `.env.local` has correct `VITE_API_BASE_URL`
3. Verify `CORS_ORIGIN` in backend `.env`

### Seed Script Fails

**Problem:** Seed script exits with error

**Solution:**
1. Ensure MongoDB is connected
2. Run `npm install` in server directory
3. Check `.env` has valid `MONGODB_URI`
4. Manually delete collections before reseeding

---

## Project Structure

```
smartstore-ai/
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (Auth)
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static files
│   ├── index.html          # HTML template
│   ├── package.json        # Dependencies
│   ├── vite.config.js      # Vite config
│   └── tailwind.config.js  # Tailwind config
│
├── server/
│   ├── config/             # Database connection
│   ├── middleware/         # Auth & error handling
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── seed/              # Seeding script
│   ├── server.js          # Main server file
│   └── package.json       # Dependencies
│
├── README.md              # Project documentation
└── setup-guide.md         # This file
```

---

## Next Steps

1. ✅ Setup complete!
2. Login with provided credentials
3. Explore the dashboard
4. Create new products
5. View analytics
6. Check AI insights features
7. Customize as needed

---

## Support & Resources

- **React Docs:** https://react.dev
- **Express Docs:** https://expressjs.com
- **MongoDB Docs:** https://docs.mongodb.com
- **Tailwind CSS:** https://tailwindcss.com
- **Vite:** https://vitejs.dev

---

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start development | `npm run dev` |
| Build for production | `npm run build` |
| Seed database | `npm run seed` |
| Check health | `curl http://localhost:5000/api/health` |

---

**Setup complete! Happy coding! 🚀**
