import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def error_body(code: str, message: str, details: Any = None) -> dict[str, Any]:
    return {"erro": {"codigo": code, "mensagem": message, "detalhes": details}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        details = [
            {"campo": ".".join(str(part) for part in item["loc"]), "mensagem": item["msg"]}
            for item in error.errors()
        ]
        return JSONResponse(
            status_code=422,
            content=error_body("PARAMETRO_INVALIDO", "Parâmetro inválido.", details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(request: Request, error: StarletteHTTPException) -> JSONResponse:
        if isinstance(error.detail, dict):
            code = str(error.detail.get("codigo", "ERRO_HTTP"))
            message = str(error.detail.get("mensagem", "Não foi possível processar a solicitação."))
            details = error.detail.get("detalhes")
        else:
            code, message, details = "ERRO_HTTP", str(error.detail), None
        return JSONResponse(
            status_code=error.status_code,
            content=error_body(code, message, details),
            headers=error.headers,
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(request: Request, error: SQLAlchemyError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "indisponivel")
        logger.exception("Falha de banco de dados request_id=%s", request_id)
        return JSONResponse(
            status_code=503,
            content=error_body("INDISPONIVEL", "Banco de dados indisponível."),
        )

    @app.exception_handler(Exception)
    async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "indisponivel")
        logger.exception("Falha inesperada request_id=%s", request_id)
        return JSONResponse(
            status_code=500,
            content=error_body("ERRO_INTERNO", "Ocorreu uma falha interna."),
        )
