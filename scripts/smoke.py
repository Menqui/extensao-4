import json
import os
import sys
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
API = BASE_URL + "/api/v1"


def get_json(path: str) -> tuple[int, dict[str, Any], dict[str, str]]:
    with urlopen(API + path, timeout=5) as response:
        return response.status, json.loads(response.read()), dict(response.headers.items())


def main() -> int:
    try:
        status, health, _ = get_json("/saude")
        assert status == 200 and health == {"status": "ok"}
        status, ready, _ = get_json("/pronto")
        assert status == 200 and ready.get("status") == "ok"
        status, listing, headers = get_json("/questoes?page=1&page_size=5")
        assert status == 200 and listing.get("itens")
        assert "ETag" in headers and "X-Request-ID" in headers
        item = listing["itens"][0]
        assert "gabarito" not in item
        question_id = item["id"]
        status, detail, _ = get_json(f"/questoes/{question_id}")
        assert status == 200 and "gabarito" not in detail
        request = Request(
            f"{API}/questoes/{question_id}/responder",
            data=b'{"alternativa":"A"}',
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=5) as response:
            answer = json.loads(response.read())
            assert set(answer) == {"correta", "gabarito", "resolucao_disponivel"}
        status, key, _ = get_json(f"/questoes/{question_id}/gabarito")
        assert status == 200 and "gabarito" in key
        status, filters, _ = get_json("/meta/filtros")
        assert status == 200 and filters.get("anos")
        try:
            get_json("/questoes?page_size=51")
            raise AssertionError("page_size inválido deveria retornar 422.")
        except HTTPError as error:
            assert error.code == 422
            payload = json.loads(error.read())
            assert payload["erro"]["codigo"] == "PARAMETRO_INVALIDO"
    except (AssertionError, HTTPError, OSError, KeyError, TypeError) as error:
        print(f"Smoke test falhou: {error}", file=sys.stderr)
        return 1
    print("Smoke test aprovado: saúde, prontidão, listagem, detalhe, resposta, gabarito e filtros.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
