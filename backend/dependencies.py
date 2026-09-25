from fastapi import Header, Depends
from typing import Optional
from sqlalchemy.orm import Session
from .database import get_db
from . import models

def get_current_user_context(
    x_user_id: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    
    # Default permissions if not found
    permissions = []
    
    if user_id == 0:
        # Hardcoded admin user
        permissions = ["view_all_data", "manage_team", "manage_projects", "manage_tasks", "manage_settings", "manage_roles"]
    elif user_id is not None:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and user.role_id:
            role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
            if role and role.permissions:
                permissions = role.permissions
                
    return {"user_id": user_id, "permissions": permissions}
