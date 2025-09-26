from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from bson import ObjectId

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client.recruiteryu

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def clear_existing_data():
    """Clear existing data (optional)"""
    db.users.delete_many({"role": {"$ne": "admin"}})  # Keep admin
    db.jobs.delete_many({})
    db.applications.delete_many({})
    print("Existing data cleared (except admin)")

def create_sample_users():
    """Create sample recruiter and candidate users"""
    
    # Create a recruiter
    recruiter_data = {
        "name": "John Smith",
        "email": "recruiter@company.com",
        "password": pwd_context.hash("password123"),
        "role": "recruiter",
        "company": "Tech Solutions Inc",
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    recruiter_result = db.users.insert_one(recruiter_data)
    recruiter_id = str(recruiter_result.inserted_id)
    
    # Create a candidate
    candidate_data = {
        "name": "Jane Doe",
        "email": "candidate@email.com",
        "password": pwd_context.hash("password123"),
        "role": "candidate",
        "company": None,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile": {
            "skills": ["Python", "JavaScript", "React"],
            "experience": [
                {
                    "company": "Previous Company",
                    "role": "Junior Developer",
                    "duration": "2022-2024"
                }
            ],
            "education": [
                {
                    "degree": "Bachelor's in Computer Science",
                    "university": "Tech University",
                    "year": "2022"
                }
            ],
            "certifications": ["AWS Certified"],
            "projects": [
                {
                    "name": "E-commerce Website",
                    "description": "Built with React and Node.js",
                    "url": "https://github.com/example"
                }
            ],
            "bio": "Passionate developer with 2 years of experience",
            "profile_picture": None
        }
    }
    candidate_result = db.users.insert_one(candidate_data)
    candidate_id = str(candidate_result.inserted_id)
    
    print(f"Created recruiter: {recruiter_data['email']} (password: password123)")
    print(f"Created candidate: {candidate_data['email']} (password: password123)")
    
    return recruiter_id, candidate_id

def create_sample_jobs(recruiter_id):
    """Create sample job postings"""
    
    jobs_data = [
        {
            "title": "Frontend Developer",
            "skills_required": "React, JavaScript, HTML, CSS",
            "experience_years": 2,
            "qualification": "Bachelor's in Computer Science",
            "description": "We are looking for a skilled Frontend Developer to join our team.",
            "location": "Remote",
            "salary_range": "$60,000 - $80,000",
            "company_id": recruiter_id,
            "company_name": "Tech Solutions Inc",
            "recruiter_name": "John Smith",
            "created_at": datetime.utcnow(),
            "status": "open"
        },
        {
            "title": "Backend Developer",
            "skills_required": "Node.js, Python, MongoDB, APIs",
            "experience_years": 3,
            "qualification": "Bachelor's in Computer Science or related",
            "description": "Join our backend team to build scalable applications.",
            "location": "New York, NY",
            "salary_range": "$70,000 - $90,000",
            "company_id": recruiter_id,
            "company_name": "Tech Solutions Inc",
            "recruiter_name": "John Smith",
            "created_at": datetime.utcnow(),
            "status": "open"
        },
        {
            "title": "Full Stack Developer",
            "skills_required": "React, Node.js, MongoDB, JavaScript",
            "experience_years": 4,
            "qualification": "Bachelor's degree",
            "description": "Looking for a full-stack developer with modern web technologies.",
            "location": "San Francisco, CA",
            "salary_range": "$80,000 - $100,000",
            "company_id": recruiter_id,
            "company_name": "Tech Solutions Inc",
            "recruiter_name": "John Smith",
            "created_at": datetime.utcnow(),
            "status": "open"
        }
    ]
    
    job_results = db.jobs.insert_many(jobs_data)
    job_ids = [str(job_id) for job_id in job_results.inserted_ids]
    
    print(f"Created {len(jobs_data)} sample jobs")
    return job_ids

def create_sample_applications(candidate_id, job_ids):
    """Create sample job applications"""
    
    applications_data = [
        {
            "job_id": job_ids[0],
            "job_title": "Frontend Developer",
            "candidate_id": candidate_id,
            "candidate_name": "Jane Doe",
            "candidate_email": "candidate@email.com",
            "recruiter_id": job_ids[0],  # This should be recruiter_id, but using job_id for simplicity
            "status": "pending",
            "applied_at": datetime.utcnow()
        },
        {
            "job_id": job_ids[1],
            "job_title": "Backend Developer", 
            "candidate_id": candidate_id,
            "candidate_name": "Jane Doe",
            "candidate_email": "candidate@email.com",
            "recruiter_id": job_ids[1],
            "status": "approved",
            "applied_at": datetime.utcnow()
        }
    ]
    
    application_results = db.applications.insert_many(applications_data)
    
    print(f"Created {len(applications_data)} sample applications")
    print("Applications collection should now appear in MongoDB Compass!")

def main():
    print("Populating RecruiterYu database with sample data...")
    
    # Optional: Clear existing data
    # clear_existing_data()
    
    # Create sample users
    recruiter_id, candidate_id = create_sample_users()
    
    # Create sample jobs
    job_ids = create_sample_jobs(recruiter_id)
    
    # Create sample applications
    create_sample_applications(candidate_id, job_ids)
    
    print("\nSample data created successfully!")
    print("\nLogin credentials:")
    print("Admin: admin@recruiteryu.com / admin123")
    print("Recruiter: recruiter@company.com / password123")
    print("Candidate: candidate@email.com / password123")
    print("\nCheck MongoDB Compass - you should now see all 3 collections!")

if __name__ == "__main__":
    main()