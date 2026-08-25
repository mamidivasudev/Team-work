from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from . import models, schemas, crud
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TeamTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user_context(x_user_id: Optional[str] = Header(None), x_is_admin: Optional[str] = Header(None)):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    is_admin = x_is_admin == "true"
    return {"user_id": user_id, "is_admin": is_admin}

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db), context: dict = Depends(get_current_user_context)):
    user_id = None if context["is_admin"] else context["user_id"]
    projects = crud.get_projects(db, user_id=user_id)
    tasks = crud.get_tasks(db, user_id=user_id)
    activities = crud.get_activities(db, limit=5)

    total_projects = len(projects)
    active_projects = sum(1 for p in projects if p.status == "ACTIVE")
    completed_projects = sum(1 for p in projects if p.status == "COMPLETED")

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "COMPLETED")
    in_progress_tasks = sum(1 for t in tasks if t.status == "IN_PROGRESS")
    blocked_tasks = sum(1 for t in tasks if t.status == "BLOCKED")

    return {
        "projects_summary": {
            "total": total_projects,
            "active": active_projects,
            "completed": completed_projects
        },
        "tasks_summary": {
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress_tasks,
            "blocked": blocked_tasks
        },
        "recent_activities": activities,
        "project_progress": [
            {
                "id": p.id,
                "name": p.name,
                "progress": p.progress,
                "tasks": len(p.tasks),
                "completed": sum(1 for t in p.tasks if t.status == "COMPLETED"),
                "in_progress": sum(1 for t in p.tasks if t.status == "IN_PROGRESS"),
                "blocked": sum(1 for t in p.tasks if t.status == "BLOCKED")
            } for p in projects
        ]
    }

@app.get("/api/projects", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), context: dict = Depends(get_current_user_context)):
    user_id = None if context["is_admin"] else context["user_id"]
    return crud.get_projects(db, skip=skip, limit=limit, user_id=user_id)

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    return crud.update_project(db, project_id, project)

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    success = crud.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"detail": "Project deleted"}

@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), context: dict = Depends(get_current_user_context)):
    user_id = None if context["is_admin"] else context["user_id"]
    return crud.get_tasks(db, skip=skip, limit=limit, user_id=user_id)

@app.get("/api/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@app.post("/api/tasks", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task=task)

@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    return crud.update_task(db, task_id, task)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    success = crud.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"detail": "Task deleted"}

@app.get("/api/team")
def get_team(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    team_data = []
    for user in users:
        tasks = user.tasks
        completed = sum(1 for t in tasks if t.status == "COMPLETED")
        current_tasks = [t for t in tasks if t.status == "IN_PROGRESS"]
        current_task_title = current_tasks[0].title if current_tasks else "None"
        
        team_data.append({
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "role": user.role,
            "current_task": current_task_title,
            "assigned_tasks": len(tasks),
            "completed_tasks": completed,
            "status": "Working" if current_tasks else "Available",
            "task_project_ids": [t.project_id for t in tasks],
            "project_ids": [p.id for p in user.projects]
        })
    return team_data

@app.post("/api/team")
def create_team_member(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

@app.post("/api/login")
def login(credentials: dict, db: Session = Depends(get_db)):
    username = credentials.get("username")
    password = credentials.get("password")
    
    # Hardcoded admin check
    if username == "admin" and password == "admin@123":
        return {"token": "authenticated", "name": "Admin", "is_admin": True, "user_id": 0}
        
    # Check DB
    user = db.query(models.User).filter(models.User.username == username, models.User.password == password).first()
    if user:
        return {"token": "authenticated", "name": user.name, "is_admin": False, "user_id": user.id}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/reset-password")
def reset_password(req: dict, db: Session = Depends(get_db)):
    username = req.get("username")
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot reset admin password via this method")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password = "1234567890"
    db.commit()
    return {"message": "Password successfully reset to 1234567890"}

@app.put("/api/team/{user_id}")
def update_team_member(user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.update_user(db, user_id, user)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.delete("/api/team/{user_id}")
def delete_team_member(user_id: int, db: Session = Depends(get_db)):
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}

@app.get("/api/activity", response_model=List[schemas.Activity])
def read_activities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_activities(db, skip=skip, limit=limit)

@app.delete("/api/activity")
def reset_activities(db: Session = Depends(get_db)):
    crud.clear_activities(db)
    return {"detail": "Activities cleared"}
