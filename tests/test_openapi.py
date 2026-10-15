from fastapi.testclient import TestClient


def test_openapi_documents_versioned_routes_and_error_contract(api_client: TestClient) -> None:
    schema = api_client.get("/openapi.json").json()
    assert "/api/v1/questoes" in schema["paths"]
    assert "/api/v1/meta/filtros" in schema["paths"]
    assert (
        schema["paths"]["/api/v1/questoes"]["get"]["responses"]["422"]["content"][
            "application/json"
        ]["schema"]["$ref"]
        == "#/components/schemas/ErroResposta"
    )
