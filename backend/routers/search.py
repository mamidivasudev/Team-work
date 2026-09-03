from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, crud
from ..database import get_db
from ..dependencies import get_current_user_context

router = APIRouter(tags=["search"])

@router.get("/api/search", response_model=schemas.SearchResults)
def search(q: str = "", db: Session = Depends(get_db), context: dict = Depends(get_current_user_context)):
    if len(q.strip()) < 2:
        return {"tasks": [], "projects": [], "team": []}

    user_id = None if context["is_admin"] else context["user_id"]
    return crud.search_all(db, q.strip(), user_id=user_id)
