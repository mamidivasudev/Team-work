from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user_context

router = APIRouter(prefix="/api/roles", tags=["Roles"])

def require_manage_roles(context: dict = Depends(get_current_user_context)):
    if "manage_roles" not in context["permissions"]:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to manage roles.")
    return context

@router.get("", response_model=List[schemas.RoleOut])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@router.post("", response_model=schemas.RoleOut)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db), context: dict = Depends(require_manage_roles)):
    db_role = models.Role(
        name=role.name,
        permissions=role.permissions,
        is_system=False
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@router.put("/{role_id}", response_model=schemas.RoleOut)
def update_role(role_id: int, role: schemas.RoleCreate, db: Session = Depends(get_db), context: dict = Depends(require_manage_roles)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    if db_role.is_system:
        raise HTTPException(status_code=400, detail="Cannot modify system roles")
        
    db_role.name = role.name
    db_role.permissions = role.permissions
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), context: dict = Depends(require_manage_roles)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    if db_role.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
        
    # check if any users are assigned to this role
    users_with_role = db.query(models.User).filter(models.User.role_id == role_id).count()
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail="Cannot delete role: users are currently assigned to it.")
        
    db.delete(db_role)
    db.commit()
    return {"detail": "Role deleted"}
