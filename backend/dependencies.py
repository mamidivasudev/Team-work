from fastapi import Header
from typing import Optional

def get_current_user_context(x_user_id: Optional[str] = Header(None), x_is_admin: Optional[str] = Header(None)):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    is_admin = x_is_admin == "true"
    return {"user_id": user_id, "is_admin": is_admin}
