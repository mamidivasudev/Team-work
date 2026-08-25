from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

from sqlalchemy import or_

def get_projects(db: Session, skip: int = 0, limit: int = 100, user_id: int = None):
    query = db.query(models.Project)
    if user_id is not None:
        query = query.outerjoin(models.project_members).outerjoin(
            models.Task, models.Task.project_id == models.Project.id
        ).outerjoin(
            models.task_assignees, models.task_assignees.c.task_id == models.Task.id
        ).filter(
            or_(
                models.project_members.c.user_id == user_id,
                models.task_assignees.c.user_id == user_id
            )
        ).distinct()
    return query.offset(skip).limit(limit).all()

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def create_project(db: Session, project: schemas.ProjectCreate):
    project_data = project.dict(exclude={"member_ids"})
    db_project = models.Project(**project_data)
    
    if project.member_ids:
        members = db.query(models.User).filter(models.User.id.in_(project.member_ids)).all()
        db_project.members = members
        
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    log_activity(db, "PROJECT_CREATED", f"Project '{db_project.name}' was created.")
    return db_project

def update_project(db: Session, project_id: int, project: schemas.ProjectUpdate):
    db_project = get_project(db, project_id)
    if db_project:
        update_data = project.dict(exclude_unset=True)
        if "member_ids" in update_data:
            member_ids = update_data.pop("member_ids")
            if member_ids is not None:
                members = db.query(models.User).filter(models.User.id.in_(member_ids)).all()
                db_project.members = members
                
        for key, value in update_data.items():
            setattr(db_project, key, value)
            
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
        log_activity(db, "PROJECT_DELETED", f"Project '{db_project.name}' was deleted.")
        return True
    return False

def get_tasks(db: Session, skip: int = 0, limit: int = 100, user_id: int = None):
    query = db.query(models.Task)
    if user_id is not None:
        query = query.join(models.task_assignees).filter(models.task_assignees.c.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def create_task(db: Session, task: schemas.TaskCreate):
    task_data = task.dict()
    assignee_ids = task_data.pop("assignee_ids", [])
    
    db_task = models.Task(**task_data)
    
    if assignee_ids:
        users = db.query(models.User).filter(models.User.id.in_(assignee_ids)).all()
        db_task.assignees = users
        
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    log_activity(db, "TASK_CREATED", f"Task '{db_task.title}' was created.")
    return db_task

def update_task(db: Session, task_id: int, task: schemas.TaskUpdate):
    db_task = get_task(db, task_id)
    if db_task:
        update_data = task.dict(exclude_unset=True)
        old_status = db_task.status
        
        assignee_ids = update_data.pop("assignee_ids", None)
        if assignee_ids is not None:
            users = db.query(models.User).filter(models.User.id.in_(assignee_ids)).all()
            db_task.assignees = users
            
        for key, value in update_data.items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)

        if "status" in update_data and update_data["status"] != old_status:
            log_activity(db, "STATUS_CHANGED", f"Task '{db_task.title}' status changed to {db_task.status}.")

    return db_task

def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        log_activity(db, "TASK_DELETED", f"Task '{db_task.title}' was deleted.")
        return True
    return False

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    username = user.username
    if not username:
        username = user.name.lower().replace(" ", "")
        
    password = user.password
    if not password:
        password = "user@123"
        
    db_user = models.User(name=user.name, role=user.role, username=username, password=password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: schemas.UserCreate):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.name = user.name
        db_user.role = user.role
        db_user.username = user.username
        db_user.password = user.password
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

def get_activities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Activity).order_by(models.Activity.created_at.desc()).offset(skip).limit(limit).all()

def log_activity(db: Session, action: str, description: str):
    db_activity = models.Activity(action=action, description=description)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def clear_activities(db: Session):
    db.query(models.Activity).delete()
    db.commit()
    return True
