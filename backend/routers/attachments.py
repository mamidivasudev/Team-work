import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, crud
from ..database import get_db

router = APIRouter(tags=["attachments"])

ATTACHMENTS_DIR = os.path.join(os.getcwd(), "task_attachments")


def _resolve_attachment_path(stored_filename: str) -> str:
    folder_path = os.path.abspath(ATTACHMENTS_DIR)
    safe_name = os.path.basename(stored_filename)
    file_path = os.path.abspath(os.path.join(folder_path, safe_name))
    if os.path.commonpath([folder_path, file_path]) != folder_path:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return file_path


@router.post("/api/tasks/{task_id}/attachments", response_model=schemas.TaskAttachment)
async def upload_task_attachment(task_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not crud.get_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")

    os.makedirs(ATTACHMENTS_DIR, exist_ok=True)
    original_name = os.path.basename(file.filename)
    stored_filename = f"{uuid.uuid4().hex}_{original_name}"
    file_path = _resolve_attachment_path(stored_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return crud.create_task_attachment(
        db, task_id=task_id, stored_filename=stored_filename,
        original_name=original_name, file_size=len(content)
    )


@router.get("/api/tasks/{task_id}/attachments", response_model=List[schemas.TaskAttachment])
def list_task_attachments(task_id: int, db: Session = Depends(get_db)):
    return crud.get_task_attachments(db, task_id)


@router.get("/api/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int, db: Session = Depends(get_db)):
    attachment = crud.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    file_path = _resolve_attachment_path(attachment.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(file_path, filename=attachment.original_name)


@router.delete("/api/attachments/{attachment_id}")
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    attachment = crud.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    file_path = _resolve_attachment_path(attachment.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    crud.delete_task_attachment(db, attachment_id)
    return {"detail": "Attachment deleted"}
