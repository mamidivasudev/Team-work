from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from . import models, schemas, crud
from .database import engine, get_db
from .dependencies import get_current_user_context
from .routers import tags, relationships, attachments, search, reports

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TeamTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tags.router)
app.include_router(relationships.router)
app.include_router(attachments.router)
app.include_router(search.router)
app.include_router(reports.router)

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
    review_tasks = sum(1 for t in tasks if t.status == "REVIEW")
    now = datetime.utcnow()
    overdue_tasks = sum(1 for t in tasks if t.due_date and t.due_date < now and t.status != "COMPLETED")

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
            "blocked": blocked_tasks,
            "review": review_tasks,
            "overdue": overdue_tasks
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

@app.get("/api/tasks/{task_id}/activity", response_model=List[schemas.Activity])
def read_task_activity(task_id: int, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_task_activity(db, task_id=task_id)

@app.get("/api/tasks/{task_id}/comments", response_model=List[schemas.TaskComment])
def read_task_comments(task_id: int, db: Session = Depends(get_db)):
    return crud.get_task_comments(db, task_id=task_id)

@app.post("/api/tasks/{task_id}/comments", response_model=schemas.TaskComment)
def create_task_comment(task_id: int, comment: schemas.TaskCommentCreate, db: Session = Depends(get_db)):
    return crud.create_task_comment(db=db, task_id=task_id, comment=comment)

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

import os
import re
from datetime import datetime
from pydantic import BaseModel

class ObservationDoc(BaseModel):
    title: str
    content: str
    project_id: int

@app.post("/api/observations/save")
def save_observation(doc: ObservationDoc, db: Session = Depends(get_db)):
    # Ensure folder exists
    folder_path = os.path.join(os.getcwd(), "saved_observations")
    os.makedirs(folder_path, exist_ok=True)
    
    # Create safe filename with project ID (replacing old ones instead of appending timestamp)
    safe_title = "".join([c for c in doc.title if c.isalnum() or c in (' ', '-', '_')]).rstrip()
    filename = f"{safe_title}_proj{doc.project_id}.html" if safe_title else f"Observation_proj{doc.project_id}.html"
    
    file_path = os.path.join(folder_path, filename)
    
    with open(file_path, "w", encoding="utf-8") as f:
        # Save as a basic HTML file so images and formatting remain intact
        f.write(f"<html><head><title>{doc.title}</title><meta charset='utf-8'></head><body>\n")
        f.write(f"<h1>{doc.title}</h1>\n")
        f.write(doc.content)
        f.write("\n</body></html>")
        
    # Extract Tags and Auto-Create Tasks
    content = doc.content
    import re
    parts = re.split(r'<[^>]*>📌\s*(Observation\s*\d+)</[^>]*>', content)
    
    tasks_created = 0
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            obs_title = parts[i]
            obs_html = parts[i+1].replace('<br/>', '').strip() if i+1 < len(parts) else ""
            
            if obs_title:
                new_task = models.Task(
                    title=f"{doc.title} - {obs_title}",
                    description=obs_html,
                    project_id=doc.project_id,
                    priority="HIGH",
                    status="TODO",
                    task_type="QA_OBSERVATION",
                    dev_status="PENDING",
                    qa_status="PENDING",
                    support_status="PENDING",
                    qa_document_filename=filename
                )
                db.add(new_task)
                tasks_created += 1
        db.commit()
        
    return {"detail": "Saved successfully", "filename": filename, "tasks_created": tasks_created}

def _resolve_observation_path(filename: str) -> str:
    folder_path = os.path.abspath(os.path.join(os.getcwd(), "saved_observations"))
    safe_name = os.path.basename(filename)
    file_path = os.path.abspath(os.path.join(folder_path, safe_name))
    if os.path.commonpath([folder_path, file_path]) != folder_path:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return file_path

@app.delete("/api/observations/{filename}")
def delete_observation(filename: str):
    file_path = _resolve_observation_path(filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"detail": "File deleted"}
    raise HTTPException(status_code=404, detail="File not found")

from fastapi import File, UploadFile
import mammoth
import io

@app.get("/api/observations")
def list_observations():
    folder_path = os.path.join(os.getcwd(), "saved_observations")
    if not os.path.exists(folder_path):
        return []
    
    files = []
    for f in os.listdir(folder_path):
        if f.endswith(".html"):
            stat = os.stat(os.path.join(folder_path, f))
            files.append({
                "filename": f,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat()
            })
    return sorted(files, key=lambda x: x["created_at"], reverse=True)

@app.get("/api/observations/{filename}")
def get_observation(filename: str):
    file_path = _resolve_observation_path(filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract just the body content if it has html tags
    import re
    body_match = re.search(r'<body>(.*?)</body>', content, re.DOTALL | re.IGNORECASE)
    if body_match:
        content = body_match.group(1)
        
    return {"filename": filename, "content": content}

@app.post("/api/observations/upload")
async def upload_observation(file: UploadFile = File(...)):
    content = ""
    if file.filename.endswith('.docx'):
        # Convert DOCX to HTML using mammoth
        file_bytes = await file.read()
        result = mammoth.convert_to_html(io.BytesIO(file_bytes))
        content = result.value # The generated HTML
    else:
        # Assume it's text or HTML
        file_bytes = await file.read()
        content = file_bytes.decode('utf-8')
        
    return {"filename": file.filename, "content": content}
