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
    
    log_activity(db, "PROJECT_CREATED", f"Project '{db_project.name}' was created.", project_id=db_project.id)
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
        name = db_project.name
        db.delete(db_project)
        db.commit()
        log_activity(db, "PROJECT_DELETED", f"Project '{name}' was deleted.")
        return True
    return False

def recalculate_project_progress(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if db_project:
        tasks = db_project.tasks
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "COMPLETED")
        db_project.progress = round(completed / total * 100) if total else 0
        db.commit()

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
    tag_ids = task_data.pop("tag_ids", [])

    db_task = models.Task(**task_data)

    if assignee_ids:
        users = db.query(models.User).filter(models.User.id.in_(assignee_ids)).all()
        db_task.assignees = users

    if tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
        db_task.tags = tags

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    log_activity(db, "TASK_CREATED", f"Task '{db_task.title}' was created.", task_id=db_task.id, project_id=db_task.project_id)
    recalculate_project_progress(db, db_task.project_id)
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

        tag_ids = update_data.pop("tag_ids", None)
        if tag_ids is not None:
            tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
            db_task.tags = tags

        for key, value in update_data.items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)

        if "status" in update_data and update_data["status"] != old_status:
            log_activity(db, "STATUS_CHANGED", f"Task '{db_task.title}' status changed to {db_task.status}.", task_id=db_task.id, project_id=db_task.project_id)
            recalculate_project_progress(db, db_task.project_id)

    return db_task

def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    if db_task:
        project_id = db_task.project_id
        title = db_task.title
        db.query(models.TaskRelationship).filter(
            or_(models.TaskRelationship.task_id == task_id, models.TaskRelationship.related_task_id == task_id)
        ).delete(synchronize_session=False)
        db.query(models.Activity).filter(models.Activity.task_id == task_id).update(
            {models.Activity.task_id: None}, synchronize_session=False
        )
        db.delete(db_task)
        db.commit()
        log_activity(db, "TASK_DELETED", f"Task '{title}' was deleted.", project_id=project_id)
        recalculate_project_progress(db, project_id)
        return True
    return False

def get_task_comments(db: Session, task_id: int):
    return db.query(models.TaskComment).filter(models.TaskComment.task_id == task_id).order_by(models.TaskComment.created_at.asc()).all()

def create_task_comment(db: Session, task_id: int, comment: schemas.TaskCommentCreate):
    db_comment = models.TaskComment(
        task_id=task_id,
        user_id=comment.user_id,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    db_task = get_task(db, task_id)
    if db_task:
        log_activity(db, "COMMENT_ADDED", f"Comment added on task '{db_task.title}'.", task_id=task_id, project_id=db_task.project_id)

    return db_comment

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
        if user.password:
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

def log_activity(db: Session, action: str, description: str, task_id: int = None, project_id: int = None):
    db_activity = models.Activity(action=action, description=description, task_id=task_id, project_id=project_id)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def clear_activities(db: Session):
    db.query(models.Activity).delete()
    db.commit()
    return True

def get_task_activity(db: Session, task_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Activity).filter(models.Activity.task_id == task_id) \
        .order_by(models.Activity.created_at.desc()).offset(skip).limit(limit).all()

# --- Tags ---

def get_tags(db: Session):
    return db.query(models.Tag).order_by(models.Tag.name.asc()).all()

def create_tag(db: Session, tag: schemas.TagCreate):
    existing = db.query(models.Tag).filter(models.Tag.name.ilike(tag.name)).first()
    if existing:
        return existing
    db_tag = models.Tag(name=tag.name, color=tag.color or "#6366f1")
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def delete_tag(db: Session, tag_id: int):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if db_tag:
        db.delete(db_tag)
        db.commit()
        return True
    return False

# --- Task Relationships ---

def get_task_relationships(db: Session, task_id: int):
    forward = db.query(models.TaskRelationship).filter(models.TaskRelationship.task_id == task_id).all()
    reverse = db.query(models.TaskRelationship).filter(models.TaskRelationship.related_task_id == task_id).all()
    results = []
    for r in forward:
        results.append({
            "id": r.id, "task_id": r.task_id, "related_task_id": r.related_task_id,
            "relationship_type": r.relationship_type, "created_at": r.created_at,
            "direction": "forward", "related_task": r.related_task
        })
    for r in reverse:
        results.append({
            "id": r.id, "task_id": r.task_id, "related_task_id": r.related_task_id,
            "relationship_type": r.relationship_type, "created_at": r.created_at,
            "direction": "reverse", "related_task": r.task
        })
    return results

def create_task_relationship(db: Session, task_id: int, rel: schemas.TaskRelationshipCreate):
    if rel.related_task_id == task_id:
        return None
    existing = db.query(models.TaskRelationship).filter(
        models.TaskRelationship.task_id == task_id,
        models.TaskRelationship.related_task_id == rel.related_task_id,
        models.TaskRelationship.relationship_type == rel.relationship_type
    ).first()
    if existing:
        return {
            "id": existing.id, "task_id": existing.task_id, "related_task_id": existing.related_task_id,
            "relationship_type": existing.relationship_type, "created_at": existing.created_at,
            "direction": "forward", "related_task": existing.related_task
        }
    db_rel = models.TaskRelationship(
        task_id=task_id,
        related_task_id=rel.related_task_id,
        relationship_type=rel.relationship_type
    )
    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)
    log_activity(db, "TASK_LINKED", f"Task linked ({rel.relationship_type}).", task_id=task_id)
    return {
        "id": db_rel.id, "task_id": db_rel.task_id, "related_task_id": db_rel.related_task_id,
        "relationship_type": db_rel.relationship_type, "created_at": db_rel.created_at,
        "direction": "forward", "related_task": db_rel.related_task
    }

def delete_task_relationship(db: Session, relationship_id: int):
    db_rel = db.query(models.TaskRelationship).filter(models.TaskRelationship.id == relationship_id).first()
    if db_rel:
        db.delete(db_rel)
        db.commit()
        return True
    return False

# --- Attachments ---

def create_task_attachment(db: Session, task_id: int, stored_filename: str, original_name: str, file_size: int, uploaded_by: int = None):
    db_attachment = models.TaskAttachment(
        task_id=task_id,
        filename=stored_filename,
        original_name=original_name,
        file_size=file_size,
        uploaded_by=uploaded_by
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)

    db_task = get_task(db, task_id)
    if db_task:
        log_activity(db, "ATTACHMENT_ADDED", f"Attachment '{original_name}' added to task '{db_task.title}'.", task_id=task_id, project_id=db_task.project_id)
    return db_attachment

def get_task_attachments(db: Session, task_id: int):
    return db.query(models.TaskAttachment).filter(models.TaskAttachment.task_id == task_id) \
        .order_by(models.TaskAttachment.created_at.desc()).all()

def get_attachment(db: Session, attachment_id: int):
    return db.query(models.TaskAttachment).filter(models.TaskAttachment.id == attachment_id).first()

def delete_task_attachment(db: Session, attachment_id: int):
    db_attachment = get_attachment(db, attachment_id)
    if db_attachment:
        db.delete(db_attachment)
        db.commit()
        return True
    return False

# --- Search ---

def search_all(db: Session, q: str, user_id: int = None):
    like = f"%{q}%"
    tasks_query = db.query(models.Task).filter(
        or_(models.Task.title.ilike(like), models.Task.description.ilike(like))
    )
    if user_id is not None:
        tasks_query = tasks_query.join(models.task_assignees).filter(models.task_assignees.c.user_id == user_id)
    tasks = tasks_query.limit(8).all()

    projects_query = db.query(models.Project).filter(
        or_(models.Project.name.ilike(like), models.Project.description.ilike(like))
    )
    if user_id is not None:
        projects_query = projects_query.outerjoin(models.project_members).filter(
            models.project_members.c.user_id == user_id
        )
    projects = projects_query.limit(8).all()

    team = db.query(models.User).filter(
        or_(models.User.name.ilike(like), models.User.username.ilike(like))
    ).limit(8).all()

    return {"tasks": tasks, "projects": projects, "team": team}

# --- Reports ---

def get_projects_report(db: Session):
    projects = db.query(models.Project).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "status": p.status,
            "progress": p.progress,
            "total_tasks": len(p.tasks),
            "completed_tasks": sum(1 for t in p.tasks if t.status == "COMPLETED"),
            "blocked_tasks": sum(1 for t in p.tasks if t.status == "BLOCKED"),
        }
        for p in projects
    ]

def get_team_workload_report(db: Session):
    users = db.query(models.User).all()
    report = []
    for u in users:
        open_tasks = [t for t in u.tasks if t.status != "COMPLETED"]
        report.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "open_tasks": len(open_tasks),
            "completed_tasks": sum(1 for t in u.tasks if t.status == "COMPLETED"),
            "blocked_tasks": sum(1 for t in u.tasks if t.status == "BLOCKED"),
        })
    return report

def get_overdue_report(db: Session):
    now = datetime.utcnow()
    tasks = db.query(models.Task).filter(
        models.Task.due_date.isnot(None),
        models.Task.due_date < now,
        models.Task.status != "COMPLETED"
    ).order_by(models.Task.due_date.asc()).all()
    return tasks
