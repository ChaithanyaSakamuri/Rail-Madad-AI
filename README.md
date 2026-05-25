# Rail Madad AI - Grievance Auto-Classifier & Router (Patent Idea)

An AI-powered grievance auto-routing, tracking, and management system for Indian Railways. This portal automatically reads passenger complaints in English & Hindi, extracts entities (train number, coach, station), classifies issue types, detects priority levels, routes them to designated departments, monitors SLA thresholds, and escalates delayed tickets.

---

## 🚀 Key Features

1. **Multilingual AI NLP Engine (FastAPI + Gemini):**
   - Seamlessly extracts entities: Train Number, Coach (e.g., B2, A1), Station, and Core Issue.
   - Detects English, Hindi, and Hinglish.
   - Zero-shot classification into Cleanliness, Maintenance, Safety/Crime, Catering, and Medical Emergency.
   - Multi-modal vision analysis for photo evidence uploads.

2. **Smart Workload-Based Routing:**
   - Evaluates active ticket counts of online officers.
   - Auto-allocates to the corresponding officer (TTE, Station Master, RPF, Catering, Medical) with the lowest current workload.

3. **Live SLA Countdown Clocks:**
   - Active, real-time visual counters showing minutes/seconds remaining matching SLA parameters:
     - `P1` (Emergency): 15 mins
     - `P2` (Safety/Crime): 30 mins
     - `P3` (Service/AC/Water): 2 hours
     - `P4` (General query): 24 hours

4. **node-cron Auto-Escalation:**
   - Periodic cron scans (every 60 seconds) checking SLA deadlines.
   - Increments escalation levels (`0 -> 3`) on breaches, logs audit entries, reassigns tickets, and fires real-time Socket.io and push alerts.

5. **Analytical Command dashboards:**
   - Pie charts, trend line graphs, and bar counts powered by Recharts.
   - Excel and JSON report export utility.

---

## 🛠️ Architecture Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Recharts, Socket.io-client, Framer Motion.
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose), Socket.io, Node-Cron, Multer.
- **AI Microservice:** Python FastAPI, Google Generative AI (Gemini SDK), Regex-based Fallback NER.

---

## 📋 Running the Application Locally

### 1. Configure Env Variables
Create a `.env` inside `server/`:
```env
PORT=5002
MONGODB_URI=mongodb+srv://chaituchowdary301_db_user:4IUZggQtECbqqvBD@cluster0.hwwn7tt.mongodb.net/railmadad?retryWrites=true&w=majority
JWT_SECRET=railmadad-super-secret-key-at-least-32-chars
JWT_EXPIRE=7d
GEMINI_API_KEY=AIzaSyB3yzANhyaCAlvCVg5bb51-n06HpnKWLBY
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

Create a `.env.local` inside `client/`:
```env
VITE_API_BASE_URL=http://localhost:5002/api
VITE_APP_NAME=Rail Madad AI
```

### 2. Start Python FastAPI Microservice
Ensure global Python 3.13 is installed, navigate to `ai_service/`, activate virtualenv (optional), and run:
```bash
python main.py
# Running on http://localhost:8000
```

### 3. Install & Start Express Backend
Navigate to `server/` and run:
```bash
# Install packages
npm install

# Seed Sample Database
npm run seed

# Run Dev Server
npm run dev
# Running on http://localhost:5002
```

### 4. Install & Start React Frontend
Navigate to `client/` and run:
```bash
# Install packages
npm install

# Run Dev Server
npm run dev
# Running on http://localhost:5173
```

---

## 🔑 Login Credentials

| Account Role | Email Address | Password | Department / Assigned Zone |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@railmadad.gov.in` | `Admin@123` | Control Room Command |
| **ADMIN** | `chaituchowdary301@gmail.com` | `Deepya@23` | Control Room Command |
| **PASSENGER** | `passenger@gmail.com` | `Passenger@123` | Rohan Verma (+91 9876543210) |
| **TTE OFFICER** | `tte@railmadad.gov.in` | `Officer@123` | TTE - Train 12951 |
| **STATION MASTER** | `sm@railmadad.gov.in` | `Officer@123` | Station Master - NDLS Station |
| **RPF OFFICER** | `rpf@railmadad.gov.in` | `Officer@123` | RPF Inspector - Northern Railway |
| **CATERING LEAD** | `catering@railmadad.gov.in` | `Officer@123` | Catering Supervisor - NDLS Kitchen |
| **MEDICAL TEAM** | `medical@railmadad.gov.in` | `Officer@123` | Medical Lead - Northern Railway |
