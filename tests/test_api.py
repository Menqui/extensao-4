from fastapi.testclient import TestClient

from app.db import make_session_factory
from app.infra.rate_limit import InMemoryRateLimiter
from app.models import Prova, Questao


def test_health_and_readiness(api_client: TestClient) -> None:
    assert api_client.get("/api/v1/saude").json() == {"status": "ok"}
    ready = api_client.get("/api/v1/pronto")
    assert ready.status_code == 200
    assert ready.json() == {"status": "ok", "dataset_version": "test-1"}


def test_metadata_lists_only_filters_used_by_published_questions(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/meta/filtros")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_version"] == "test-1"
    assert data["anos"] == [2020, 2021, 2022, 2023, 2024, 2025]
    assert len(data["areas"]) == 1
    assert len(data["assuntos"]) == 15
    assert {item["id"] for item in data["aplicacoes"]} == {"regular", "digital", "reaplicacao"}


def test_list_has_pagination_and_never_exposes_answer_key(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/questoes?page=1&page_size=4")
    data = response.json()
    assert response.status_code == 200
    assert data["total"] == 15
    assert data["page"] == 1
    assert data["page_size"] == 4
    assert data["total_paginas"] == 4
    assert len(data["itens"]) == 4
    assert all("gabarito" not in question for question in data["itens"])
    assert response.headers["X-Request-ID"]
    assert response.headers["X-Dataset-Version"] == "test-1"
    assert response.headers["ETag"]


def test_combines_filter_types_with_and_and_values_with_or(api_client: TestClient) -> None:
    data = api_client.get(
        "/api/v1/questoes?ano=2022&ano=2023&area=matematica"
        "&assunto=geometria-plana&assunto=geometria-espacial"
    ).json()
    assert data["total"] == 3
    assert {item["ano"] for item in data["itens"]} == {2022, 2023}
    assert all(
        any(
            subject["id"] in {"geometria-plana", "geometria-espacial"}
            for subject in item["assuntos"]
        )
        for item in data["itens"]
    )


def test_filters_match_secondary_subjects(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/questoes?assunto=geometria-plana")
    assert response.status_code == 200
    assert response.json()["total"] == 3


def test_unknown_filter_value_returns_standard_422(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/questoes?area=desconhecida")
    assert response.status_code == 422
    assert response.json()["erro"]["codigo"] == "PARAMETRO_INVALIDO"


def test_invalid_page_size_and_order_return_standard_422(api_client: TestClient) -> None:
    oversized = api_client.get("/api/v1/questoes?page_size=51")
    invalid_order = api_client.get("/api/v1/questoes?ordem=aleatorio-incorreta")
    assert oversized.status_code == 422
    assert invalid_order.status_code == 422
    assert oversized.json()["erro"]["codigo"] == "PARAMETRO_INVALIDO"
    assert invalid_order.json()["erro"]["codigo"] == "PARAMETRO_INVALIDO"


def test_out_of_range_year_returns_standard_422(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/questoes?ano=1800")
    assert response.status_code == 422
    assert response.json()["erro"]["codigo"] == "PARAMETRO_INVALIDO"


def test_anuladas_are_hidden_by_default_and_can_be_included(api_client: TestClient) -> None:
    assert api_client.get("/api/v1/questoes?ano=2025").json()["total"] == 3
    included = api_client.get("/api/v1/questoes?ano=2025&incluir_anuladas=true").json()
    assert included["total"] == 4


def test_stable_random_order_for_seed_and_pagination(api_client: TestClient) -> None:
    first = api_client.get("/api/v1/questoes?ordem=aleatoria&semente=42&page_size=5").json()
    again = api_client.get("/api/v1/questoes?ordem=aleatoria&semente=42&page_size=5").json()
    second_page = api_client.get(
        "/api/v1/questoes?ordem=aleatoria&semente=42&page=2&page_size=5"
    ).json()
    ids = [item["id"] for item in first["itens"]]
    assert ids == [item["id"] for item in again["itens"]]
    assert not set(ids).intersection(item["id"] for item in second_page["itens"])


def test_detail_and_answers_are_only_exposed_in_answer_routes(api_client: TestClient) -> None:
    detail = api_client.get("/api/v1/questoes/1")
    assert detail.status_code == 200
    assert "gabarito" not in detail.json()
    assert detail.json()["aplicacao"]["id"] == "regular"
    answer = api_client.post("/api/v1/questoes/1/responder", json={"alternativa": "C"})
    assert answer.json() == {
        "correta": True,
        "gabarito": "C",
        "resolucao_disponivel": False,
    }
    assert api_client.get("/api/v1/questoes/1/gabarito").json() == {"gabarito": "C"}


def test_invalid_answer_and_missing_question_use_standard_errors(api_client: TestClient) -> None:
    invalid = api_client.post("/api/v1/questoes/1/responder", json={"alternativa": "Z"})
    missing = api_client.get("/api/v1/questoes/9999")
    assert invalid.status_code == 422
    assert invalid.json()["erro"]["codigo"] == "PARAMETRO_INVALIDO"
    assert missing.status_code == 404
    assert missing.json()["erro"]["codigo"] == "QUESTAO_NAO_ENCONTRADA"
    assert set(missing.json()["erro"]) == {"codigo", "mensagem", "detalhes"}


def test_resolucao_not_available_yet(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/questoes/1/resolucao")
    assert response.status_code == 404
    assert response.json()["erro"]["codigo"] == "RESOLUCAO_INDISPONIVEL"


def test_unpublished_questions_are_hidden(api_client: TestClient) -> None:
    factory = api_client.app.state.session_factory
    with factory() as session:
        proof = session.query(Prova).first()
        draft = Questao(
            prova_id=proof.id,
            area_id="matematica",
            numero_original=999,
            enunciado="Rascunho interno.",
            alternativa_a="A",
            alternativa_b="B",
            alternativa_c="C",
            alternativa_d="D",
            alternativa_e="E",
            gabarito="A",
            status="rascunho",
        )
        session.add(draft)
        session.flush()
        draft_id = draft.id
        session.commit()
    assert api_client.get("/api/v1/questoes").json()["total"] == 15
    hidden_detail = api_client.get(f"/api/v1/questoes/{draft_id}")
    assert hidden_detail.status_code == 404


def test_etag_supports_conditional_get(api_client: TestClient) -> None:
    first = api_client.get("/api/v1/meta/filtros")
    cached = api_client.get(
        "/api/v1/meta/filtros", headers={"If-None-Match": first.headers["ETag"]}
    )
    assert first.status_code == 200
    assert cached.status_code == 304
    assert cached.headers["X-Request-ID"]


def test_health_endpoint_is_not_cached(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/saude")
    assert "ETag" not in response.headers
    assert "Cache-Control" not in response.headers


def test_static_image_is_served_from_local_media_storage(api_client: TestClient) -> None:
    question = api_client.get("/api/v1/questoes?ano=2022").json()["itens"][0]
    image = next(item for item in question["midias"] if item["posicao"] == "enunciado")
    response = api_client.get(image["url"])
    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "public, max-age=31536000, immutable"
    assert "<svg" in response.text


def test_database_failure_returns_503_without_details(api_client: TestClient) -> None:
    api_client.app.state.session_factory = make_session_factory("sqlite:///:memory:")
    response = api_client.get("/api/v1/questoes")
    assert response.status_code == 503
    assert response.json()["erro"]["codigo"] == "INDISPONIVEL"
    assert "no such table" not in response.text


def test_response_routes_are_rate_limited_and_return_retry_after(api_client: TestClient) -> None:
    api_client.app.state.rate_limiter = InMemoryRateLimiter(1, 60)
    assert api_client.get("/api/v1/questoes/1/gabarito").status_code == 200
    limited = api_client.get("/api/v1/questoes/2/gabarito")
    assert limited.status_code == 429
    assert limited.headers["Retry-After"]
    assert limited.json()["erro"]["codigo"] == "LIMITE_EXCEDIDO"
