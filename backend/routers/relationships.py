from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, crud
from ..database import get_db

router = APIRouter(tags=["task-relationships"])

@router.get("/api/tasks/{task_id}/relationships", response_model=List[schemas.TaskRelationship])
def read_task_relationships(task_id: int, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_task_relationships(db, task_id)

@router.post("/api/tasks/{task_id}/relationships", response_model=schemas.TaskRelationship)
def create_task_relationship(task_id: int, rel: schemas.TaskRelationshipCreate, db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    if not crud.get_task(db, rel.related_task_id):
        raise HTTPException(status_code=404, detail="Related task not found")
    if rel.related_task_id == task_id:
        raise HTTPException(status_code=400, detail="A task cannot be linked to itself")
    result = crud.create_task_relationship(db, task_id, rel)
    if result is None:
        raise HTTPException(status_code=400, detail="A task cannot be linked to itself")
    return result

@router.delete("/api/task-relationships/{relationship_id}")
def delete_task_relationship(relationship_id: int, db: Session = Depends(get_db)):
    if not crud.delete_task_relationship(db, relationship_id):
        raise HTTPException(status_code=404, detail="Relationship not found")
    return {"detail": "Relationship deleted"}
