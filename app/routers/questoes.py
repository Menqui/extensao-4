from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from sqlalchemy.orm import Session

from app.db import get_session
from app.infra.rate_limit import enforce_response_limit
from app.schemas import (
    GabaritoResposta,
    ListaQuestoesResposta,
    QuestaoResposta,
    ResponderEntrada,
    ResponderResposta,
)
from app.services import QuestaoService

router = APIRouter(prefix="/questoes", tags=["Questões"])


def service(request: Request, session: Session) -> QuestaoService:
    return QuestaoService(
        session=session,
        settings=request.app.state.settings,
        cache=request.app.state.cache,
        media_storage=request.app.state.media_storage,
    )


@router.get("", response_model=ListaQuestoesResposta, summary="Listar e filtrar questões")
def listar_questoes(
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    ano: Annotated[list[int] | None, Query()] = None,
    area: Annotated[list[str] | None, Query(min_length=1, max_length=80)] = None,
    assunto: Annotated[list[str] | None, Query(min_length=1, max_length=100)] = None,
    aplicacao: Annotated[list[str] | None, Query(min_length=1, max_length=80)] = None,
    incluir_anuladas: bool = False,
    ordem: Literal["ano_desc", "ano_asc", "aleatoria"] = "ano_desc",
    semente: int | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
) -> dict[str, object]:
    return service(request, session).list_questions(
        anos=ano or [],
        areas=area or [],
        assuntos=assunto or [],
        aplicacoes=aplicacao or [],
        incluir_anuladas=incluir_anuladas,
        ordem=ordem,
        semente=semente,
        page=page,
        page_size=page_size,
    )


@router.get("/{question_id}", response_model=QuestaoResposta, summary="Consultar questão")
def obter_questao(
    question_id: Annotated[int, Path(ge=1)],
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    return service(request, session).get_question(question_id)


@router.post(
    "/{question_id}/responder",
    response_model=ResponderResposta,
    dependencies=[Depends(enforce_response_limit)],
    summary="Conferir resposta",
)
def responder(
    question_id: Annotated[int, Path(ge=1)],
    entrada: ResponderEntrada,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    return service(request, session).answer(question_id, entrada.alternativa)


@router.get(
    "/{question_id}/gabarito",
    response_model=GabaritoResposta,
    dependencies=[Depends(enforce_response_limit)],
    summary="Consultar gabarito",
)
def gabarito(
    question_id: Annotated[int, Path(ge=1)],
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    return service(request, session).answer_key(question_id)


@router.get("/{question_id}/resolucao", summary="Consultar resolução comentada")
def resolucao(
    question_id: Annotated[int, Path(ge=1)],
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    service(request, session).get_question(question_id)
    raise HTTPException(
        status_code=404,
        detail={
            "codigo": "RESOLUCAO_INDISPONIVEL",
            "mensagem": "Resolução comentada indisponível.",
        },
    )
