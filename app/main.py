import hashlib
import logging
import secrets
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import cast

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import StreamingResponse
from starlette.staticfiles import StaticFiles

from app.config import Settings, get_settings
from app.db import Base, make_session_factory
from app.errors import register_error_handlers
from app.infra.cache import MemoryCache
from app.infra.logging import configure_logging
from app.infra.media import LocalMediaStorage
from app.infra.rate_limit import InMemoryRateLimiter
from app.models import DatasetVersao  # noqa: F401 — registra todos os modelos no metadata
from app.routers import meta, questoes, saude
from app.schemas import ErroDetalhe, ErroResposta

REQUEST_COUNT = Counter(
    "api_http_requests_total", "Requisições HTTP", ["method", "route", "status"]
)
REQUEST_DURATION = Histogram("api_http_request_duration_seconds", "Duração de requisições HTTP")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", "")
        if not request_id or len(request_id) > 100 or not request_id.replace("-", "").isalnum():
            request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Dataset-Version"] = request.app.state.dataset_version
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if request.url.path.startswith("/static/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        route = request.scope.get("route")
        route_path = route.path if route is not None else request.url.path
        REQUEST_COUNT.labels(request.method, route_path, str(response.status_code)).inc()
        REQUEST_DURATION.observe(elapsed)
        logging.getLogger("api.request").info(
            "http_request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": route_path,
                "status_code": response.status_code,
                "duration_ms": round(elapsed * 1000, 2),
            },
        )
        if request.method == "GET" and request.url.path in {
            "/api/v1/questoes",
            "/api/v1/meta/filtros",
        }:
            streaming_response = cast(StreamingResponse, response)
            body_chunks: list[bytes] = []
            async for chunk in streaming_response.body_iterator:
                body_chunks.append(chunk.encode() if isinstance(chunk, str) else bytes(chunk))
            body = b"".join(body_chunks)
            if response.status_code == 200:
                etag = '"' + hashlib.sha256(body).hexdigest() + '"'
                response.headers["ETag"] = etag
                response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=60"
                if request.headers.get("If-None-Match") == etag:
                    headers = dict(response.headers)
                    headers.pop("content-length", None)
                    headers.pop("content-type", None)
                    return Response(status_code=304, headers=headers)
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=streaming_response.media_type,
                background=streaming_response.background,
            )
        return response


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or get_settings()
    configure_logging(config.log_level)
    docs_enabled = config.env != "prod"
    session_factory = make_session_factory(config.database_url)
    engine = session_factory.kw["bind"]

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        config.media_dir.mkdir(parents=True, exist_ok=True)
        if config.auto_create_tables:
            Base.metadata.create_all(bind=engine)
        with session_factory() as session:
            dataset_version = session.scalar(
                select(DatasetVersao.versao).order_by(DatasetVersao.id.desc()).limit(1)
            )
        application.state.dataset_version = dataset_version or config.dataset_version
        application.state.media_storage.set_dataset_version(application.state.dataset_version)
        yield

    app = FastAPI(
        title="Explorador de Questões do ENEM",
        description="API de consulta e conferência de questões do ENEM.",
        version="1.0.0",
        openapi_url="/openapi.json",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        lifespan=lifespan,
    )
    app.state.settings = config
    app.state.dataset_version = config.dataset_version
    app.state.session_factory = session_factory
    app.state.cache = MemoryCache()
    app.state.media_storage = LocalMediaStorage(
        config.static_base_url, dataset_version=config.dataset_version
    )
    amount, period = config.rate_limit_responder.split("/", maxsplit=1)
    app.state.rate_limiter = InMemoryRateLimiter(
        int(amount), {"second": 1, "minute": 60, "hour": 3600}[period]
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "If-None-Match", "X-Request-ID"],
        expose_headers=["X-Request-ID", "X-Dataset-Version", "ETag", "Retry-After"],
    )
    app.add_middleware(RequestContextMiddleware)
    register_error_handlers(app)
    app.include_router(questoes.router, prefix="/api/v1")
    app.include_router(meta.router, prefix="/api/v1")
    app.include_router(saude.router, prefix="/api/v1")
    app.mount("/static", StaticFiles(directory=config.media_dir, check_dir=False), name="static")

    def custom_openapi() -> dict[str, object]:
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        schemas = schema.setdefault("components", {}).setdefault("schemas", {})
        schemas["ErroDetalhe"] = ErroDetalhe.model_json_schema()
        schemas["ErroResposta"] = ErroResposta.model_json_schema(
            ref_template="#/components/schemas/{model}"
        )
        error_response = {
            "description": "Erro padronizado da API.",
            "content": {
                "application/json": {"schema": {"$ref": "#/components/schemas/ErroResposta"}}
            },
        }
        for path, path_item in schema["paths"].items():
            for method, operation in path_item.items():
                if method not in {"get", "post", "put", "patch", "delete"}:
                    continue
                responses = operation.setdefault("responses", {})
                for status in ("422", "500"):
                    responses[status] = error_response
                if "{question_id}" in path:
                    responses["404"] = error_response
                if path.endswith(("/responder", "/gabarito")):
                    responses["429"] = error_response
                if path.endswith("/pronto"):
                    responses["503"] = error_response
        app.openapi_schema = schema
        return schema

    app.openapi = custom_openapi  # type: ignore[method-assign]

    @app.get("/metrics", include_in_schema=False)
    def metrics(request: Request) -> Response:
        if config.env == "prod":
            token = request.headers.get("Authorization", "")
            expected = f"Bearer {config.metrics_token}" if config.metrics_token else ""
            if not expected or not secrets.compare_digest(token, expected):
                raise HTTPException(
                    status_code=403,
                    detail={"codigo": "ACESSO_NEGADO", "mensagem": "Acesso negado."},
                )
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    return app


app = create_app()
