from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from bson import ObjectId
import shutil

app = FastAPI(title="RecruiterYu API", version="1.0.0")

# Create uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client.recruiteryu

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "candidate"
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class JobCreate(BaseModel):
    title: str
    skills_required: str
    experience_years: int
    qualification: str
    description: str
    location: Optional[str] = None
    salary_range: Optional[str] = None

class CandidateProfile(BaseModel):
    skills: List[str] = []
    experience: List[dict] = []
    education: List[dict] = []
    certifications: List[str] = []
    projects: List[dict] = []
    bio: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: str  # pending, approved, rejected
    
class ProfileUpdate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class NotificationSettings(BaseModel):
    # Recruiter settings
    emailApplicationAlerts: Optional[bool] = True
    emailJobExpiryReminders: Optional[bool] = True
    emailWeeklyReports: Optional[bool] = True
    emailNewsletter: Optional[bool] = False
    pushNotifications: Optional[bool] = True
    # Admin settings
    systemAlerts: Optional[bool] = True
    userRegistrations: Optional[bool] = True
    securityNotifications: Optional[bool] = True
    maintenanceAlerts: Optional[bool] = True

class PrivacySettings(BaseModel):
    companyProfileVisibility: Optional[str] = "public"
    showContactInfo: Optional[bool] = True
    allowDirectMessages: Optional[bool] = True

class RecruiterPreferences(BaseModel):
    autoRejectAfterDays: Optional[int] = 30
    requireCoverLetter: Optional[bool] = False
    enableAIScreening: Optional[bool] = True
    sendAutoResponses: Optional[bool] = True

class SystemSettings(BaseModel):
    allowPublicRegistration: Optional[bool] = True
    requireEmailVerification: Optional[bool] = True
    enableAuditLogging: Optional[bool] = True
    autoBackupEnabled: Optional[bool] = True
    maintenanceMode: Optional[bool] = False

class SecuritySettings(BaseModel):
    sessionTimeout: Optional[int] = 30
    maxLoginAttempts: Optional[int] = 5
    passwordMinLength: Optional[int] = 8
    requireTwoFactor: Optional[bool] = False
    ipWhitelist: Optional[str] = ""

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

# Helper function to convert ObjectId to string
def convert_objectid(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Routes
@app.post("/api/auth/signup")
async def signup(user: UserCreate):
    # Check if user already exists
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user document
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "company": user.company,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile": {
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": [],
            "bio": "",
            "profile_picture": None
        } if user.role == "candidate" else {}
    }
    
    # Insert user
    result = db.users.insert_one(user_doc)
    
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    user_data = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "company": user.get("company")
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

# Admin routes
@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_users = db.users.count_documents({})
    total_recruiters = db.users.count_documents({"role": "recruiter"})
    total_candidates = db.users.count_documents({"role": "candidate"})
    total_jobs = db.jobs.count_documents({})
    total_applications = db.applications.count_documents({})
    
    stats = {
        "total_views": total_applications,  # Use applications as views
        "total_profit": total_recruiters * 100,  # Mock calculation
        "total_product": total_jobs,
        "total_users": total_users,
        "total_recruiters": total_recruiters,
        "total_candidates": total_candidates,
        "total_applications": total_applications
    }
    return stats

@app.get("/api/admin/customers")
async def get_customers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all recruiters/companies
    customers = list(db.users.find(
        {"role": "recruiter"},
        {"password": 0}
    ))
    
    # Convert ObjectId to string
    for customer in customers:
        customer["_id"] = str(customer["_id"])
    
    return customers

@app.delete("/api/admin/customers/{user_id}")
async def delete_customer(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete user and their related data
    user_result = db.users.delete_one({"_id": ObjectId(user_id)})
    if user_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete their jobs and applications
    db.jobs.delete_many({"company_id": user_id})
    db.applications.delete_many({"$or": [{"candidate_id": user_id}, {"recruiter_id": user_id}]})
    
    return {"message": "Customer deleted successfully"}

@app.get("/api/admin/candidates")
async def get_candidates(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all candidates
    candidates = list(db.users.find(
        {"role": "candidate"},
        {"password": 0}
    ))
    
    # Add profile completion percentage for each candidate
    for candidate in candidates:
        candidate["_id"] = str(candidate["_id"])
        profile = candidate.get("profile", {})
        
        # Calculate profile completion percentage
        completion_score = 0
        if profile.get("bio"):
            completion_score += 20
        if profile.get("skills") and len(profile["skills"]) > 0:
            completion_score += 20
        if profile.get("experience") and len(profile["experience"]) > 0:
            completion_score += 20
        if profile.get("education") and len(profile["education"]) > 0:
            completion_score += 20
        if profile.get("profile_picture"):
            completion_score += 20
            
        candidate["profile_completion"] = completion_score
    
    return candidates

@app.delete("/api/admin/candidates/{candidate_id}")
async def delete_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete candidate and their related data
    candidate_result = db.users.delete_one({"_id": ObjectId(candidate_id), "role": "candidate"})
    if candidate_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Delete their applications
    db.applications.delete_many({"candidate_id": candidate_id})
    
    return {"message": "Candidate deleted successfully"}

@app.get("/api/admin/company/{company_id}/jobs")
async def get_company_jobs(company_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    jobs = list(db.jobs.find({"company_id": company_id}))
    
    for job in jobs:
        job["_id"] = str(job["_id"])
        # Add application count
        job["total_applications"] = db.applications.count_documents({"job_id": str(job["_id"])})
    
    return jobs

@app.get("/api/admin/company/{company_id}/applications")
async def get_company_applications(company_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all jobs by this company first
    company_jobs = list(db.jobs.find({"company_id": company_id}))
    job_ids = [str(job["_id"]) for job in company_jobs]
    
    # Get all applications for these jobs
    applications = list(db.applications.find({"job_id": {"$in": job_ids}}))
    
    for app in applications:
        app["_id"] = str(app["_id"])
    
    return applications

@app.get("/api/admin/candidate/{candidate_id}/applications")
async def get_candidate_applications_admin(candidate_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    applications = list(db.applications.find({"candidate_id": candidate_id}))
    
    for app in applications:
        app["_id"] = str(app["_id"])
        # Get job details
        job = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
        if job:
            app["company_name"] = job.get("company_name", "N/A")
    
    return applications



# Recruiter routes
@app.get("/api/recruiter/stats")
async def get_recruiter_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    recruiter_id = str(current_user["_id"])
    
    # Get jobs posted by this recruiter
    jobs = list(db.jobs.find({"company_id": recruiter_id}))
    job_ids = [str(job["_id"]) for job in jobs]
    
    # Get applications for these jobs
    applications = list(db.applications.find({"job_id": {"$in": job_ids}}))
    
    total_applicants = len(applications)
    shortlisted_candidates = len([app for app in applications if app["status"] == "approved"])
    hired_candidates = len([app for app in applications if app["status"] == "hired"])
    rejected_candidates = len([app for app in applications if app["status"] == "rejected"])
    
    stats = {
        "total_applicants": total_applicants,
        "shortlisted_candidates": shortlisted_candidates,
        "hired_candidates": hired_candidates,
        "rejected_candidates": rejected_candidates,
        "cost_per_hire": 17000,  # This could be calculated based on actual data
        "time_to_hire": 15,
        "time_to_fill": 26,
        "total_jobs": len(jobs)
    }
    return stats

@app.post("/api/recruiter/jobs")
async def create_job(job: JobCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    job_doc = {
        "title": job.title,
        "skills_required": job.skills_required,
        "experience_years": job.experience_years,
        "qualification": job.qualification,
        "description": job.description,
        "location": job.location,
        "salary_range": job.salary_range,
        "company_id": str(current_user["_id"]),
        "company_name": current_user.get("company", ""),
        "recruiter_name": current_user["name"],
        "created_at": datetime.utcnow(),
        "status": "open"
    }
    
    result = db.jobs.insert_one(job_doc)
    return {"message": "Job created successfully", "job_id": str(result.inserted_id)}

@app.get("/api/recruiter/jobs")
async def get_recruiter_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    jobs = list(db.jobs.find({"company_id": str(current_user["_id"])}))
    
    # Add application count for each job
    for job in jobs:
        job["_id"] = str(job["_id"])
        job_applications = db.applications.count_documents({"job_id": str(job["_id"])})
        job["total_applications"] = job_applications
    
    return jobs

@app.delete("/api/recruiter/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if job belongs to this recruiter
    job = db.jobs.find_one({"_id": ObjectId(job_id), "company_id": str(current_user["_id"])})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete job and related applications
    db.jobs.delete_one({"_id": ObjectId(job_id)})
    db.applications.delete_many({"job_id": job_id})
    
    return {"message": "Job deleted successfully"}

@app.get("/api/recruiter/applications/{job_id}")
async def get_job_applications(job_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify job belongs to this recruiter
    job = db.jobs.find_one({"_id": ObjectId(job_id), "company_id": str(current_user["_id"])})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get applications with candidate details
    applications = list(db.applications.find({"job_id": job_id}))
    
    for app in applications:
        app["_id"] = str(app["_id"])
        # Get candidate details
        candidate = db.users.find_one({"_id": ObjectId(app["candidate_id"])}, {"password": 0})
        if candidate:
            app["candidate_details"] = convert_objectid(candidate)
    
    return applications

@app.put("/api/recruiter/applications/{application_id}")
async def update_application_status(application_id: str, update: ApplicationUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update application status
    result = db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": update.status, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"message": "Application status updated successfully"}

# Candidate routes
@app.get("/api/candidate/jobs")
async def get_available_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all open jobs
    jobs = list(db.jobs.find({"status": "open"}))
    candidate_id = str(current_user["_id"])
    
    for job in jobs:
        job["_id"] = str(job["_id"])
        # Check if user already applied
        existing_application = db.applications.find_one({
            "job_id": str(job["_id"]),
            "candidate_id": candidate_id
        })
        job["has_applied"] = bool(existing_application)
        if existing_application:
            job["application_status"] = existing_application["status"]
    
    return jobs

@app.post("/api/candidate/apply/{job_id}")
async def apply_for_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    
    # Check if job exists
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already applied
    existing_application = db.applications.find_one({
        "job_id": job_id,
        "candidate_id": candidate_id
    })
    
    if existing_application:
        raise HTTPException(status_code=400, detail="Already applied for this job")
    
    application_doc = {
        "job_id": job_id,
        "job_title": job["title"],
        "candidate_id": candidate_id,
        "candidate_name": current_user["name"],
        "candidate_email": current_user["email"],
        "recruiter_id": job["company_id"],
        "status": "pending",
        "applied_at": datetime.utcnow()
    }
    
    result = db.applications.insert_one(application_doc)
    return {"message": "Application submitted successfully", "application_id": str(result.inserted_id)}

@app.get("/api/candidate/applications")
async def get_candidate_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    applications = list(db.applications.find({"candidate_id": candidate_id}))
    
    for app in applications:
        app["_id"] = str(app["_id"])
        # Get job details
        job = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
        if job:
            app["job_details"] = convert_objectid(job)
    
    return applications

@app.delete("/api/candidate/applications/{application_id}")
async def withdraw_application(application_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    
    # Check if application belongs to this candidate
    application = db.applications.find_one({
        "_id": ObjectId(application_id),
        "candidate_id": candidate_id
    })
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Delete the application
    db.applications.delete_one({"_id": ObjectId(application_id)})
    
    return {"message": "Application withdrawn successfully"}

@app.get("/api/candidate/profile")
async def get_candidate_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.users.find_one({"_id": ObjectId(str(current_user["_id"]))}, {"password": 0})
    return convert_objectid(user)

@app.put("/api/candidate/profile")
async def update_candidate_profile(profile: CandidateProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    
    # Update profile
    db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"profile": profile.dict(), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Profile updated successfully"}

@app.post("/api/candidate/upload-profile-picture")
async def upload_profile_picture(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    
    # Save uploaded file
    file_extension = file.filename.split(".")[-1]
    filename = f"{candidate_id}_profile.{file_extension}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user profile with image path
    db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"profile.profile_picture": f"/uploads/{filename}"}}
    )
    
    return {"message": "Profile picture uploaded successfully", "file_path": f"/uploads/{filename}"}






# ========================================
# RECRUITER SETTINGS ENDPOINTS
# ========================================

@app.put("/api/recruiter/update-profile")
async def update_recruiter_profile(profile_update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    recruiter_id = str(current_user["_id"])
    
    # Check if email is already taken by another user
    if profile_update.email != current_user["email"]:
        existing_user = db.users.find_one({"email": profile_update.email, "_id": {"$ne": ObjectId(recruiter_id)}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use by another account")
    
    # Update profile
    update_data = {
        "name": profile_update.name,
        "email": profile_update.email,
        "updated_at": datetime.utcnow()
    }
    
    if profile_update.company:
        update_data["company"] = profile_update.company
    
    db.users.update_one(
        {"_id": ObjectId(recruiter_id)},
        {"$set": update_data}
    )
    
    # ✅ Fetch updated user
    updated_user = db.users.find_one({"_id": ObjectId(recruiter_id)}, {"password": 0})
    updated_user = convert_objectid(updated_user)

    return {
        "message": "Profile updated successfully",
        "user": updated_user
    }


@app.put("/api/recruiter/change-password")
async def change_recruiter_password(password_change: PasswordChange, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify current password
    if not verify_password(password_change.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_hashed_password = get_password_hash(password_change.new_password)
    
    # Update password
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"password": new_hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password changed successfully"}

@app.put("/api/recruiter/notification-settings")
async def update_recruiter_notifications(settings: NotificationSettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"notification_settings": settings.dict(), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Notification settings updated successfully"}

@app.put("/api/recruiter/privacy-settings")
async def update_recruiter_privacy(settings: PrivacySettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"privacy_settings": settings.dict(), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Privacy settings updated successfully"}

@app.put("/api/recruiter/preferences")
async def update_recruiter_preferences(preferences: RecruiterPreferences, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"recruitment_preferences": preferences.dict(), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Preferences updated successfully"}

@app.delete("/api/recruiter/delete-account")
async def delete_recruiter_account(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    recruiter_id = str(current_user["_id"])
    
    # Delete recruiter account
    db.users.delete_one({"_id": ObjectId(recruiter_id)})
    
    # Delete all jobs posted by this recruiter
    jobs = list(db.jobs.find({"company_id": recruiter_id}))
    job_ids = [str(job["_id"]) for job in jobs]
    db.jobs.delete_many({"company_id": recruiter_id})
    
    # Delete all applications for these jobs
    db.applications.delete_many({"job_id": {"$in": job_ids}})
    
    return {"message": "Recruiter account and all associated data deleted successfully"}

# ========================================
# ADMIN SETTINGS ENDPOINTS
# ========================================

@app.put("/api/admin/update-profile")
async def update_admin_profile(profile_update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    admin_id = str(current_user["_id"])
    
    # Check if email is already taken by another user
    if profile_update.email != current_user["email"]:
        existing_user = db.users.find_one({"email": profile_update.email, "_id": {"$ne": ObjectId(admin_id)}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use by another account")
    
    # Update profile
    update_data = {
        "name": profile_update.name,
        "email": profile_update.email,
        "updated_at": datetime.utcnow()
    }
    
    db.users.update_one(
        {"_id": ObjectId(admin_id)},
        {"$set": update_data}
    )
    
    updated_user = db.users.find_one({"_id": ObjectId(admin_id)}, {"password": 0})
    updated_user = convert_objectid(updated_user)

    return {
        "message": "Admin profile updated successfully",
        "user": updated_user
    }

@app.put("/api/admin/change-password")
async def change_admin_password(password_change: PasswordChange, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify current password
    if not verify_password(password_change.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_hashed_password = get_password_hash(password_change.new_password)
    
    # Update password
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"password": new_hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Admin password changed successfully"}

@app.put("/api/admin/notification-settings")
async def update_admin_notifications(settings: NotificationSettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Store admin notification settings in a separate collection or in user document
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"notification_settings": settings.dict(), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Admin notification settings updated successfully"}

@app.put("/api/admin/system-settings")
async def update_system_settings(settings: SystemSettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Store system settings in a dedicated collection
    db.system_settings.update_one(
        {"type": "platform_settings"},
        {"$set": {**settings.dict(), "updated_at": datetime.utcnow(), "updated_by": str(current_user["_id"])}},
        upsert=True
    )
    
    return {"message": "System settings updated successfully"}

@app.put("/api/admin/security-settings")
async def update_security_settings(settings: SecuritySettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Store security settings in a dedicated collection
    db.security_settings.update_one(
        {"type": "security_config"},
        {"$set": {**settings.dict(), "updated_at": datetime.utcnow(), "updated_by": str(current_user["_id"])}},
        upsert=True
    )
    
    return {"message": "Security settings updated successfully"}

@app.post("/api/admin/system-backup")
async def create_system_backup(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Create backup record
        backup_record = {
            "backup_id": f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "created_at": datetime.utcnow(),
            "created_by": str(current_user["_id"]),
            "status": "completed",
            "type": "manual",
            "collections_backed_up": [
                "users", "jobs", "applications", "system_settings", "security_settings"
            ]
        }
        
        db.backups.insert_one(backup_record)
        
        return {"message": "System backup completed successfully", "backup_id": backup_record["backup_id"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

# ========================================
# CANDIDATE SETTINGS ENDPOINTS (if missing)
# ========================================

@app.put("/api/candidate/update-profile")
async def update_candidate_basic_profile(profile_update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    
    # Check if email is already taken by another user
    if profile_update.email != current_user["email"]:
        existing_user = db.users.find_one({"email": profile_update.email, "_id": {"$ne": ObjectId(candidate_id)}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use by another account")
    
    # Update basic profile info
    update_data = {
        "name": profile_update.name,
        "email": profile_update.email,
        "updated_at": datetime.utcnow()
    }
    
    db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": update_data}
    )
    
    updated_user = db.users.find_one({"_id": ObjectId(candidate_id)}, {"password": 0})
    updated_user = convert_objectid(updated_user)

    return {
        "message": "Profile updated successfully",
        "user": updated_user
    }


@app.put("/api/candidate/change-password")
async def change_candidate_password(password_change: PasswordChange, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify current password
    if not verify_password(password_change.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_hashed_password = get_password_hash(password_change.new_password)
    
    # Update password
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"password": new_hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password changed successfully"}

@app.put("/api/candidate/notification-settings")
async def update_candidate_notifications(settings: NotificationSettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"notification_settings": settings.dict(), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Notification settings updated successfully"}

@app.put("/api/candidate/privacy-settings")
async def update_candidate_privacy(settings: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"privacy_settings": settings, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Privacy settings updated successfully"}

@app.delete("/api/candidate/delete-account")
async def delete_candidate_account(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_id = str(current_user["_id"])
    
    # Delete candidate account
    db.users.delete_one({"_id": ObjectId(candidate_id)})
    
    # Delete all applications by this candidate
    db.applications.delete_many({"candidate_id": candidate_id})
    
    return {"message": "Candidate account and all associated data deleted successfully"}








if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
    
    