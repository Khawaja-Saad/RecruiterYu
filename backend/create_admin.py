from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client.recruiteryu

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    # Check if admin already exists
    existing_admin = db.users.find_one({"role": "admin"})
    if existing_admin:
        print("Admin user already exists!")
        print(f"Email: {existing_admin['email']}")
        return
    
    # Create admin user
    admin_data = {
        "name": "Admin User",
        "email": "admin@recruiteryu.com",
        "password": pwd_context.hash("admin123"),  # Change this password!
        "role": "admin",
        "company": None,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    result = db.users.insert_one(admin_data)
    print("Admin user created successfully!")
    print(f"Email: admin@recruiteryu.com")
    print(f"Password: admin123")
    print(f"User ID: {result.inserted_id}")
    print("Please change the password after first login!")

if __name__ == "__main__":
    create_admin()