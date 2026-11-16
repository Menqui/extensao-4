from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import FiltrosResposta
from app.services import QuestaoService

router = APIRouter(prefix="/meta", tags=["Metadados"])


@router.get("/filtros", response_model=FiltrosResposta, summary="Listar filtros disponíveis")
def filtros(
    request: Request, session: Annotated[Session, Depends(get_session)]
) -> dict[str, object]:
    return QuestaoService(
        session=session,
        settings=request.app.state.settings,
        cache=request.app.state.cache,
    ).available_filters()
