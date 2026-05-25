# 🌐 Complete Deployment Guide: Rail Madad AI

This guide explains how to deploy the **Rail Madad AI** application to production using **Render** (for the backend servers) and **Vercel** (for the frontend client).

---

## 📌 Deployment Architecture
* **Frontend (Vite / React)**: Deployed on **Vercel** (Static Site Hosting)
* **Backend API (Node.js / Express)**: Deployed on **Render** (Web Service)
* **AI NLP Service (FastAPI / Python)**: Deployed on **Render** (Web Service)
* **Database**: Hosted on **MongoDB Atlas** (Cloud Database)

---

## 🛠️ Step 1: Deploy Python FastAPI AI Service on Render

The AI service must be deployed first so the Node.js backend can connect to it.

1. **Sign in to Render**: Go to [Render](https://render.com) and log in.
2. **Create Web Service**: Click **New +** and select **Web Service**.
3. **Connect Repository**: Connect your GitHub repository `Rail-Madad-AI`.
4. **Configure Service**:
   * **Name**: `rail-madad-ai-service`
   * **Region**: Choose the closest region (e.g., Oregon or Singapore).
   * **Root Directory**: `ai_service`
   * **Language**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python main.py`
5. **Add Environment Variables**:
   * Click **Advanced** and add the following key:
     * `GEMINI_API_KEY`: Your Gemini API token (`AIzaSy...`).
6. **Deploy**: Click **Create Web Service**.
   * *Once deployed, copy the service URL (e.g., `https://rail-madad-ai-service.onrender.com`).*

---

## 🛠️ Step 2: Deploy Node.js Express Backend on Render

1. **Create Web Service**: Click **New +** and select **Web Service**.
2. **Connect Repository**: Select the same `Rail-Madad-AI` repository.
3. **Configure Service**:
   * **Name**: `rail-madad-api`
   * **Root Directory**: `server`
   * **Language**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. **Add Environment Variables**:
   * Click **Advanced** and add:
     * `MONGODB_URI`: `mongodb+srv://chaituchowdary301_db_user:4IUZggQtECbqqvBD@cluster0.hwwn7tt.mongodb.net/railmadad?retryWrites=true&w=majority`
     * `JWT_SECRET`: Any random 32+ character secret key.
     * `JWT_EXPIRE`: `7d`
     * `AI_SERVICE_URL`: The URL of your FastAPI service copied from Step 1 (e.g., `https://rail-madad-ai-service.onrender.com`).
     * `CORS_ORIGIN`: Your Vercel frontend URL (you can update this after Step 3).
5. **Deploy**: Click **Create Web Service**.
   * *Once deployed, copy your API URL (e.g., `https://rail-madad-api.onrender.com`).*

---

## 🛠️ Step 3: Deploy Vite React Frontend on Vercel

1. **Sign in to Vercel**: Go to [Vercel](https://vercel.com) and log in.
2. **Import Project**: Click **Add New** > **Project** and import your `Rail-Madad-AI` repository.
3. **Configure Framework Settings**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click edit and select the `client` folder.
4. **Add Environment Variables**:
   * Expand **Environment Variables** and add:
     * `VITE_API_BASE_URL`: Your Render backend API URL + `/api` (e.g., `https://rail-madad-api.onrender.com/api`).
5. **Deploy**: Click **Deploy**.
6. **Update CORS on Render Backend**:
   * Once Vercel generates your production link (e.g., `https://rail-madad-ai.vercel.app`), go back to your **Render API Service settings**, and update the `CORS_ORIGIN` env variable with your new Vercel link to allow connection.

---

## 💾 Database Seeding in Production (Optional)

To seed your production database with the initial passenger, admin, and routing officers:
1. Install [MongoDB Compass](https://www.mongodb.com/products/compass) locally or connect to Atlas.
2. The seeder script has already run on your Atlas Cluster database during development. The collection will automatically carry over to production!
