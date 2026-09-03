from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/projects", response_model=List[schemas.ProjectReportRow])
def projects_report(db: Session = Depends(get_db)):
    return crud.get_projects_report(db)

@router.get("/team-workload", response_model=List[schemas.TeamWorkloadRow])
def team_workload_report(db: Session = Depends(get_db)):
    return crud.get_team_workload_report(db)

@router.get("/overdue", response_model=List[schemas.Task])
def overdue_report(db: Session = Depends(get_db)):
    return crud.get_overdue_report(db)
