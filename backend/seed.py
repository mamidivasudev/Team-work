import random
from datetime import datetime, timedelta
from .database import SessionLocal, engine
from . import models, schemas, crud

models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    if db.query(models.User).first():
        print("Database already seeded.")
        db.close()
        return

    users_data = [
        {"name": "Ravi", "role": "Backend Developer"},
        {"name": "Kumar", "role": "Frontend Developer"},
        {"name": "Suresh", "role": "Fullstack Developer"},
        {"name": "Anil", "role": "DevOps Engineer"},
        {"name": "Priya", "role": "UI/UX Designer"},
        {"name": "Neha", "role": "Project Manager"}
    ]
    
    users = []
    for u in users_data:
        user = models.User(**u)
        db.add(user)
        users.append(user)
    db.commit()

    projects_data = [
        {"name": "Road Management System", "description": "System for tracking road maintenance.", "progress": 68},
        {"name": "TeamTrack MVP", "description": "Internal tool for task management.", "progress": 25},
        {"name": "Customer Portal", "description": "Client facing dashboard for analytics.", "progress": 90}
    ]
    
    projects = []
    for p in projects_data:
        project = crud.create_project(db, schemas.ProjectCreate(**p))
        projects.append(project)
        
    tasks_data = [
        ("Setup Database", 1, "COMPLETED", "CRITICAL"),
        ("Design UI Mockups", 2, "COMPLETED", "HIGH"),
        ("Login API", 0, "IN_PROGRESS", "HIGH"),
        ("Dashboard UI", 1, "IN_PROGRESS", "MEDIUM"),
        ("Payment Bug #124", 2, "COMPLETED", "CRITICAL"),
        ("API Integration", 0, "BLOCKED", "HIGH"),
        ("Write Tests", 1, "TODO", "LOW"),
        ("Deploy to Staging", 2, "TODO", "MEDIUM"),
        ("User Management API", 0, "TODO", "HIGH"),
        ("Settings Page", 1, "TODO", "LOW"),
    ]
    
    for title, proj_idx, status, priority in tasks_data:
        task = schemas.TaskCreate(
            title=title,
            description=f"Description for {title}",
            project_id=projects[proj_idx].id,
            assignee_id=random.choice(users).id,
            priority=priority,
            status=status,
            due_date=datetime.utcnow() + timedelta(days=random.randint(1, 10))
        )
        crud.create_task(db, task)
    
    crud.log_activity(db, "TASK_STARTED", "Ravi started 'Login API'")
    crud.log_activity(db, "TASK_COMPLETED", "Kumar completed 'Payment Bug #124'")
    crud.log_activity(db, "STATUS_CHANGED", "Suresh moved 'Dashboard UI' to In Progress")
    crud.log_activity(db, "TASK_BLOCKED", "Anil marked 'API Integration' as Blocked")

    print("Seeding complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
