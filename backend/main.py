from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import json

from . import models, schemas, crud
from .database import engine, get_db
from .dependencies import get_current_user_context
from .routers import tags, relationships, attachments, search, reports, roles

models.Base.metadata.create_all(bind=engine)

# Seed roles and migrate users
db = next(get_db())
try:
    if db.query(models.Role).count() == 0:
        # Create default roles
        admin_role = models.Role(name="Admin", permissions=["view_all_data", "manage_team", "manage_projects", "manage_tasks", "manage_settings", "manage_roles"], is_system=True)
        tl_role = models.Role(name="Team Lead", permissions=["view_all_data", "manage_team", "manage_projects", "manage_tasks"], is_system=False)
        tm_role = models.Role(name="Team Member", permissions=["manage_tasks"], is_system=False)
        
        db.add_all([admin_role, tl_role, tm_role])
        db.commit()
        db.refresh(admin_role)
        db.refresh(tm_role)
        
        # Migrate existing users (if any)
        users = db.query(models.User).all()
        for user in users:
            if user.id == 0 or user.name == "Admin":
                user.role_id = admin_role.id
            else:
                user.role_id = tm_role.id
        db.commit()
except Exception as e:
    print(f"Role migration error: {e}")
finally:
    db.close()


class ChatManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        if room not in self.rooms:
            self.rooms[room] = []
        self.rooms[room].append(websocket)

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.rooms:
            self.rooms[room] = [ws for ws in self.rooms[room] if ws != websocket]

    async def broadcast(self, room: str, message: dict):
        if room in self.rooms:
            dead = []
            for ws in self.rooms[room]:
                try:
                    await ws.send_text(json.dumps(message))
                except:
                    dead.append(ws)
            for ws in dead:
                self.rooms[room].remove(ws)

chat_manager = ChatManager()

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
app.include_router(roles.router)

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db), context: dict = Depends(get_current_user_context)):
    user_id = None if "view_all_data" in context["permissions"] else context["user_id"]
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
    user_id = None if "view_all_data" in context["permissions"] else context["user_id"]
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
    user_id = None if "view_all_data" in context["permissions"] else context["user_id"]
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
            "job_title": user.job_title,
            "role": user.role.name if user.role else "Unknown",
            "role_id": user.role_id,
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
        return {
            "token": "authenticated", 
            "name": "Admin", 
            "is_admin": True, 
            "user_id": 0,
            "permissions": ["view_all_data", "manage_team", "manage_projects", "manage_tasks", "manage_settings", "manage_roles"]
        }
        
    # Check DB
    user = db.query(models.User).filter(models.User.username == username, models.User.password == password).first()
    if user:
        permissions = []
        if user.role_id:
            role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
            if role and role.permissions:
                permissions = role.permissions
        return {
            "token": "authenticated", 
            "name": user.name, 
            "is_admin": False, 
            "user_id": user.id,
            "permissions": permissions,
            "job_title": user.job_title
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/reset-password")
def reset_password(req: dict, db: Session = Depends(get_db)):
    username = req.get("username")
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot reset admin password via this method")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password = "11111111"
    db.commit()
    return {"message": "Password successfully reset to 11111111"}

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
        f.write(doc.content)
        f.write("\n</body></html>")
        
    # Extract Tags and Auto-Create Tasks
    import re
    # Remove the inner delete button span first so the regex works cleanly
    clean_content = re.sub(r'<span[^>]*delete-obs-btn[^>]*>.*?</span>', '', doc.content, flags=re.IGNORECASE | re.DOTALL)
    
    parts = re.split(r'<[^>]*>📌\s*(Observation\s*\d+)</[^>]*>', clean_content, flags=re.IGNORECASE)
    
    tasks_created = 0
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            obs_title = parts[i]
            obs_html = parts[i+1].replace('<br/>', '').strip() if i+1 < len(parts) else ""
            
            if obs_title:
                # Clean up the document title so it doesn't include .html in the Task view
                clean_doc_title = re.sub(r'_proj\d+\.html$', '', doc.title, flags=re.IGNORECASE)
                clean_doc_title = re.sub(r'\.html$', '', clean_doc_title, flags=re.IGNORECASE)
                clean_doc_title = re.sub(r'html$', '', clean_doc_title, flags=re.IGNORECASE).strip()
                
                # Extract the first line of text after the tag to use as the specific issue heading
                raw_text = re.sub(r'<[^>]+>', ' ', obs_html)
                raw_text = raw_text.replace('&nbsp;', ' ').strip()
                lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
                custom_heading = lines[0][:60] if lines else ""
                
                if custom_heading:
                    task_title = f"{obs_title}: {custom_heading}"
                else:
                    task_title = obs_title
                
                # Check if this specific observation task already exists for this document to prevent duplicates
                # We check using the qa_document_filename and ensuring the title starts with the observation ID
                existing_task = db.query(models.Task).filter(
                    models.Task.qa_document_filename == filename,
                    models.Task.title.startswith(obs_title)
                ).first()
                
                if existing_task:
                    existing_task.title = task_title # Update title in case they fixed a typo in the heading
                    existing_task.description = obs_html
                else:
                    new_task = models.Task(
                        title=task_title,
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

@app.put("/api/observations/{filename}/rename")
def rename_observation(filename: str, payload: dict):
    new_name = payload.get("new_name")
    if not new_name:
        raise HTTPException(status_code=400, detail="new_name is required")
        
    old_file_path = _resolve_observation_path(filename)
    new_file_path = _resolve_observation_path(new_name)
    
    if not os.path.exists(old_file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if os.path.exists(new_file_path):
        raise HTTPException(status_code=400, detail="A file with that name already exists")
        
    os.rename(old_file_path, new_file_path)
    return {"detail": "File renamed successfully", "new_filename": new_name}

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

@app.get("/api/observations/tags")
def list_observation_tags():
    folder_path = os.path.join(os.getcwd(), "saved_observations")
    if not os.path.exists(folder_path):
        return []
    
    tags = []
    import re
    for f in os.listdir(folder_path):
        if f.endswith(".html"):
            try:
                with open(os.path.join(folder_path, f), "r", encoding="utf-8") as file:
                    content = file.read()
                    matches = set(re.findall(r'Observation\s+\d+', content, re.IGNORECASE))
                    for m in matches:
                        tags.append({"filename": f, "obs_id": m})
            except Exception:
                pass
    return sorted(tags, key=lambda x: x["filename"])

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

# ── Chat Endpoints ──────────────────────────────────────────

@app.get("/api/chat/messages", response_model=List[schemas.ChatMessageOut])
def get_chat_messages(room: str = "team", limit: int = 100, db: Session = Depends(get_db)):
    msgs = db.query(models.ChatMessage).filter(
        models.ChatMessage.room == room
    ).order_by(models.ChatMessage.created_at.asc()).limit(limit).all()
    return msgs

@app.post("/api/chat/messages", response_model=schemas.ChatMessageOut)
def post_chat_message(msg: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    db_msg = models.ChatMessage(
        room=msg.room,
        sender_id=msg.sender_id,
        sender_name=msg.sender_name,
        content=msg.content
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

@app.delete("/api/chat/messages/{msg_id}")
def delete_chat_message(msg_id: int, db: Session = Depends(get_db)):
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == msg_id).first()
    if msg:
        db.delete(msg)
        db.commit()
    return {"detail": "deleted"}

@app.websocket("/ws/chat/{room}")
async def websocket_chat(room: str, websocket: WebSocket, db: Session = Depends(get_db)):
    await chat_manager.connect(room, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            # Save to DB
            db_msg = models.ChatMessage(
                room=room,
                sender_id=payload.get("sender_id"),
                sender_name=payload.get("sender_name", "Unknown"),
                content=payload.get("content", "")
            )
            db.add(db_msg)
            db.commit()
            db.refresh(db_msg)
            # Broadcast to all in room
            out = {
                "id": db_msg.id,
                "room": db_msg.room,
                "sender_id": db_msg.sender_id,
                "sender_name": db_msg.sender_name,
                "content": db_msg.content,
                "created_at": db_msg.created_at.isoformat()
            }
            await chat_manager.broadcast(room, out)
    except WebSocketDisconnect:
        chat_manager.disconnect(room, websocket)

@app.get("/api/chat/rooms")
def get_chat_rooms(db: Session = Depends(get_db)):
    """Return list of available chat rooms with last message preview"""
    rooms = [
        {"id": "team", "name": "Team Chat", "type": "team", "icon": "users"},
    ]
    # Add project rooms
    projects = db.query(models.Project).all()
    for p in projects:
        rooms.append({"id": f"project-{p.id}", "name": p.name, "type": "project", "icon": "folder"})
    # Add unread counts (last message per room)
    for room in rooms:
        last = db.query(models.ChatMessage).filter(
            models.ChatMessage.room == room["id"]
        ).order_by(models.ChatMessage.created_at.desc()).first()
        room["last_message"] = last.content[:60] if last else None
        room["last_sender"] = last.sender_name if last else None
        room["last_time"] = last.created_at.isoformat() if last else None
    return rooms
