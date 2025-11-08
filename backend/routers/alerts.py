from fastapi import APIRouter
from services.weight_monitor import activate_beep, deactivate_beep

router = APIRouter(prefix="/alert", tags=["alert"])

@router.post("/beep_start")
def beep_start():
    activate_beep()
    return {"status": "alert_on"}

@router.post("/beep_stop")
def beep_stop():
    deactivate_beep()
    return {"status": "alert_off"}
