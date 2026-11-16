from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_session
from app.repositories import QuestaoRepository
from app.schemas import ProntoResposta, SaudeResposta

router = APIRouter(tags=["Saúde"])


@router.get("/saude", response_model=SaudeResposta, summary="Verificar vida do processo")
def saude() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/pronto", response_model=ProntoResposta, summary="Verificar prontidão do serviço")
def pronto(request: Request, session: Annotated[Session, Depends(get_session)]) -> dict[str, str]:
    try:
        session.execute(text("SELECT 1"))
        version = QuestaoRepository(session).dataset_version(
            request.app.state.settings.dataset_version
        )
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail={"codigo": "INDISPONIVEL", "mensagem": "Banco de dados indisponível."},
        ) from error
    return {"status": "ok", "dataset_version": version}
