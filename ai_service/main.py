import os
import re
import json
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv
from PIL import Image
import io
import google.generativeai as genai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

# Load environment from server directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server', '.env')
load_dotenv(dotenv_path)

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini API successfully configured.")
else:
    logger.warning("GEMINI_API_KEY not found in environment!")

app = FastAPI(title="Rail Madad AI Microservice")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextComplaintRequest(BaseModel):
    text: str

class ClassificationResponse(BaseModel):
    language: str
    trainNumber: str
    coachNumber: str
    station: str
    issueType: str
    category: str
    priority: str
    confidence: float

def fallback_nlp_extractor(text: str) -> dict:
    """
    Fallback regex-based NER and keyword-based classifier in case Gemini API fails.
    """
    logger.info("Running fallback NLP extractor...")
    
    # 1. Train Number extraction (usually 5 digits)
    train_match = re.search(r'\b\d{5}\b', text)
    train_number = train_match.group(0) if train_match else ""
    
    # 2. Coach Number extraction (e.g., B2, A1, S5, H1, D2, M3, B-2, S-5, coach 2)
    coach_match = re.search(r'\b([A-Za-z]\-?\d{1,2}|COACH\s*\d{1,2})\b', text, re.IGNORECASE)
    coach_number = coach_match.group(0).upper() if coach_match else ""
    
    # 3. Station name extraction (heuristics)
    station = ""
    station_match = re.search(r'(?:near|at|station|junction|station\s+name|जंक्शन|स्टेशन|पास)\s+([A-Za-z]+|[अ-ह]+)', text, re.IGNORECASE)
    if station_match:
        station = station_match.group(1).capitalize()
    
    # 4. Language detection
    is_hindi = any(ord(char) > 127 for char in text)
    language = "Hindi" if is_hindi else "English"
    
    # 5. Keywords for urgency detection (P1 to P4)
    # P1: Fire, Theft, Accident, Violence, Medical
    # P2: Safety, security
    # P3: Cleanliness, water, food, AC
    # P4: General
    p1_keywords = ['fire', 'theft', 'robbery', 'medical', 'emergency', 'accident', 'violence', 'fight', 'chori', 'aag', 'durghatna', 'मारपीट', 'चोरी', 'आग', 'इमरजेंसी', 'दुर्घटना']
    p2_keywords = ['safety', 'security', 'suspicious', 'threat', 'harassment', 'suraksha', 'खतरा', 'सुरक्षा', 'छेड़खानी']
    p3_keywords = ['ac', 'water', 'clean', 'dirty', 'food', 'catering', 'toilet', 'fan', 'light', 'pani', 'safai', 'safai nahi', 'ac nahi chal raha', 'गर्मी', 'पानी', 'सफाई', 'शौचालय', 'खाना']
    
    text_lower = text.lower()
    priority = "P4"
    if any(k in text_lower for k in p1_keywords):
        priority = "P1"
    elif any(k in text_lower for k in p2_keywords):
        priority = "P2"
    elif any(k in text_lower for k in p3_keywords):
        priority = "P3"
        
    # 6. Category mapping
    category = "General"
    if priority == "P1" and ('medical' in text_lower or 'emergency' in text_lower or 'hospital' in text_lower or 'डॉक्टर' in text_lower):
        category = "Medical Emergency"
    elif priority == "P1" and ('theft' in text_lower or 'robbery' in text_lower or 'fight' in text_lower or 'violence' in text_lower or 'chori' in text_lower):
        category = "Safety/Crime"
    elif priority == "P2" or 'security' in text_lower or 'police' in text_lower or 'rpf' in text_lower:
        category = "Safety/Crime"
    elif 'clean' in text_lower or 'dirty' in text_lower or 'toilet' in text_lower or 'safai' in text_lower or 'dustbin' in text_lower:
        category = "Cleanliness"
    elif 'food' in text_lower or 'catering' in text_lower or 'water' in text_lower or 'khana' in text_lower or 'pani' in text_lower or 'veg' in text_lower or 'non-veg' in text_lower:
        category = "Catering"
    elif 'ac' in text_lower or 'fan' in text_lower or 'light' in text_lower or 'seat' in text_lower or 'window' in text_lower or 'charger' in text_lower or 'socket' in text_lower:
        category = "Maintenance"
        
    issue_type = "Grievance"
    if category != "General":
        issue_type = f"Issues related to {category}"
        
    return {
        "language": language,
        "trainNumber": train_number,
        "coachNumber": coach_number,
        "station": station,
        "issueType": issue_type,
        "category": category,
        "priority": priority,
        "confidence": 0.70
    }

@app.get("/api/nlp/health")
def health_check():
    return {"status": "healthy", "gemini_enabled": api_key is not None}

@app.post("/api/nlp/classify", response_model=ClassificationResponse)
async def classify_complaint(payload: TextComplaintRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty.")
    
    if not api_key:
        fallback = fallback_nlp_extractor(text)
        return ClassificationResponse(**fallback)
        
    try:
        # Prompt Gemini to act as a structured NLP extractor
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
You are an AI classifier for Indian Railways passenger grievance portal (Rail Madad).
Your task is to analyze the user's complaint text (which may be in English, Hindi, or a mix/Hinglish) and extract specific entities and classify the grievance.

Complaint Text: "{text}"

Please return a valid JSON object matching the following structure and no other text:
{{
  "language": "English | Hindi | Hinglish (choose most appropriate)",
  "trainNumber": "5-digit train number if present (otherwise empty string)",
  "coachNumber": "Coach code like B2, A1, S5, H1, D1 if present (otherwise empty string)",
  "station": "Station name if passenger mentions boarding/passing/destination station (otherwise empty string)",
  "issueType": "Brief 3-5 word summary of the core issue in English (e.g. Toilet not clean, Theft of bags, High temperature in AC, No water, Medical pain)",
  "category": "Choose exactly one from: 'Cleanliness', 'Maintenance', 'Safety/Crime', 'Catering', 'Medical Emergency', 'General'",
  "priority": "Choose exactly one from: 'P1', 'P2', 'P3', 'P4' based on urgency:
               - P1: Emergency, Fire, Theft in progress, Violence, Accident, Severe Medical Emergency
               - P2: Security threat, harassment, general crime report, suspicious objects
               - P3: Service issue needing immediate attention (no water, AC failure, fan not working, toilet very dirty)
               - P4: General queries, minor complaints, ticketing issues, feedback",
  "confidence": "A floating point number between 0.0 and 1.0 representing your confidence score"
}}
"""
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Remove markdown code formatting if present
        if content.startswith("```"):
            # strip off ```json and ```
            content = re.sub(r'^```(?:json)?\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
        data = json.loads(content)
        
        # Validate returned fields
        valid_categories = ['Cleanliness', 'Maintenance', 'Safety/Crime', 'Catering', 'Medical Emergency', 'General']
        if data.get('category') not in valid_categories:
            data['category'] = 'General'
            
        valid_priorities = ['P1', 'P2', 'P3', 'P4']
        if data.get('priority') not in valid_priorities:
            data['priority'] = 'P4'
            
        # Ensure confidence is a float
        try:
            data['confidence'] = float(data.get('confidence', 0.90))
        except:
            data['confidence'] = 0.90
            
        return ClassificationResponse(
            language=str(data.get('language', 'English')),
            trainNumber=str(data.get('trainNumber', '')),
            coachNumber=str(data.get('coachNumber', '')),
            station=str(data.get('station', '')),
            issueType=str(data.get('issueType', 'General Grievance')),
            category=str(data.get('category', 'General')),
            priority=str(data.get('priority', 'P4')),
            confidence=data['confidence']
        )
        
    except Exception as e:
        logger.error(f"Error in Gemini classification: {str(e)}")
        fallback = fallback_nlp_extractor(text)
        return ClassificationResponse(**fallback)

@app.post("/api/nlp/analyze-image")
async def analyze_image(
    file: UploadFile = File(...)
):
    if not api_key:
        return {
            "success": True,
            "detectedIssue": "Image attached (AI vision analysis offline)",
            "visualConfidence": 0.50,
            "tags": ["attachment"]
        }
        
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = """
Analyze this image from a passenger complaint inside an Indian Railways train or station.
Identify:
1. What is the visible issue (e.g. dirty toilet, broken seat, leaking water, waste on floor, clean train, etc.)?
2. Choose a category for this issue: 'Cleanliness', 'Maintenance', 'Safety/Crime', 'Catering', 'Medical Emergency', or 'General'.
3. Assign a brief list of descriptive tags.

Return a JSON object:
{
  "detectedIssue": "Brief summary of visual issue",
  "category": "Category name",
  "tags": ["tag1", "tag2", ...],
  "visualConfidence": 0.90
}
"""
        response = model.generate_content([prompt, image])
        content = response.text.strip()
        
        # Clean markdown wrappers
        if content.startswith("```"):
            content = re.sub(r'^```(?:json)?\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
        data = json.loads(content)
        return {
            "success": True,
            "detectedIssue": data.get("detectedIssue", "Visual grievance detected"),
            "category": data.get("category", "General"),
            "tags": data.get("tags", ["visual"]),
            "visualConfidence": data.get("visualConfidence", 0.85)
        }
    except Exception as e:
        logger.error(f"Error in Gemini Image analysis: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "detectedIssue": "Failed to analyze image visually, fallback to text analysis.",
            "visualConfidence": 0.0,
            "tags": []
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
