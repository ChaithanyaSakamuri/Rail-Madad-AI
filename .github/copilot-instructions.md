# SmartStore AI - Copilot Instructions

## Project Overview
SmartStore AI is a full-stack e-commerce dashboard application with AI-powered insights. It features a React frontend with Tailwind CSS and a Node.js/Express backend with MongoDB integration.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Database:** MongoDB Atlas

## Project Structure
```
smartstore-ai/
├── client/          # React Frontend (Port 5173)
├── server/          # Node.js Backend (Port 5000)
├── README.md        # Project documentation
└── setup-guide.md   # Setup instructions
```

## Key Features
- User authentication with JWT
- Product CRUD operations
- Real-time analytics dashboard
- AI-powered insights
- Responsive design with Tailwind CSS
- Database seeding with sample data

## Common Commands

### Backend
- `npm install` - Install dependencies
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

### Frontend
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Setup
Both frontend and backend require `.env` files. See `.env.example` in each directory for required variables.

### Backend .env
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default 5000)
- `NODE_ENV` - Environment (development/production)

### Frontend .env.local
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name

## Database Models
- **User:** Authentication & user profiles
- **Product:** Product catalog with AI fields
- **Sales:** Order tracking & revenue
- **AIInsight:** AI-generated insights & predictions

## Authentication
- Routes protected with JWT middleware
- Login credentials stored securely with bcryptjs
- Tokens included in Authorization header

## Default Credentials
After seeding:
- Email: admin@smartstore.ai
- Password: Admin@123

## API Base URL
Development: `http://localhost:5000/api`

## Development Guidelines
- Use ES modules (import/export)
- Follow existing code structure
- Keep components modular and reusable
- Use Tailwind CSS for styling
- Add error handling for API calls
- Protect sensitive routes with authentication

## Useful Resources
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- React Documentation: https://react.dev
- Express.js: https://expressjs.com
- Tailwind CSS: https://tailwindcss.com
- Vite: https://vitejs.dev

## Getting Started
1. Install dependencies: `npm install` (in both client and server)
2. Configure `.env` files
3. Start backend: `npm run dev` (in server directory)
4. Start frontend: `npm run dev` (in client directory)
5. Seed database: `npm run seed` (optional, in server directory)
6. Visit `http://localhost:5173` in browser

---

**Last Updated:** May 22, 2024
**Status:** Production Ready ✅
