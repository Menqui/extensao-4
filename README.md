# Explorador de Questões do ENEM — Backend

API REST independente para filtrar questões por ano, área, assunto e aplicação e conferir respostas. O serviço entrega **JSON, OpenAPI e arquivos de mídia**; não contém nem serve o frontend.

> **Dataset atual:** o repositório contém 16 questões inventadas apenas para demonstrar a API. Elas não são questões oficiais do INEP, mesmo quando usam anos ou formato de prova. Não use o dataset para estudo ou avaliação. O projeto ainda não inclui questões reais revisadas.

## Requisitos

- Docker Desktop com Docker Compose.
- PostgreSQL 16 é iniciado pelo Compose; o banco é persistido no volume `postgres_data`.

## Executar no Windows (PowerShell)

Suba o PostgreSQL, aplique a migração, carregue os dados fictícios e inicie a API:

```powershell
docker compose up --build
```

Abra:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Especificação: <http://localhost:8000/openapi.json>
- API: <http://localhost:8000/api/v1>

O Compose aguarda o PostgreSQL, aplica a migração Alembic, carrega o dataset de exemplo e só então inicia a API na porta `8000`. Para parar:

```powershell
docker compose down
```

Os dados do PostgreSQL ficam no volume `postgres_data`. O serviço seed é idempotente e pode ser executado novamente:

```powershell
docker compose run --rm seed
```

As credenciais no `docker-compose.yml` são exclusivamente locais e de desenvolvimento. Troque-as por segredos gerenciados antes de publicar qualquer instância.

## Exemplos de uso

```http
GET /api/v1/meta/filtros
GET /api/v1/questoes?ano=2022&ano=2023&area=matematica&assunto=geometria-plana
GET /api/v1/questoes?ordem=aleatoria&semente=42&page=1&page_size=10
GET /api/v1/questoes/1
POST /api/v1/questoes/1/responder
Content-Type: application/json

{"alternativa":"C"}
GET /api/v1/questoes/1/gabarito
GET /api/v1/saude
GET /api/v1/pronto
```

Filtros de tipos diferentes são combinados com **E**; valores repetidos de um mesmo filtro, com **OU**. Questões anuladas ficam ocultas por padrão. Listagem e detalhe nunca contêm o campo `gabarito`; a resposta só é revelada por `responder` e `gabarito`. As respostas dos usuários não são persistidas.

`GET /api/v1/questoes/{id}/resolucao` retorna `404` com `RESOLUCAO_INDISPONIVEL` até que a funcionalidade pós-MVP seja implementada.

Todos os erros usam:

```json
{
  "erro": {
    "codigo": "PARAMETRO_INVALIDO",
    "mensagem": "Parâmetro inválido.",
    "detalhes": []
  }
}
```

Respostas incluem `X-Request-ID` e `X-Dataset-Version`. Listagens e metadados incluem `ETag`, aceitam `If-None-Match` e usam `Cache-Control`; URLs de mídia incluem a versão do dataset e podem ser armazenadas por um ano.

## Dados e importação

- `data/taxonomia.json`: áreas e catálogo fechado de assuntos.
- `data/aplicacoes.json`: aplicações disponíveis.
- `data/questoes/exemplo.json`: questões fictícias, uma por registro.
- `data/imagens/`: figuras SVG também fictícias.

Importe um arquivo ou todos os JSON de uma pasta:

```powershell
python -m scripts.import_data --file data/questoes/exemplo.json
python -m scripts.import_data --file data/questoes --dry-run
```

O importador valida esquema, alternativas, gabarito, status, área, aplicação, assuntos compatíveis e arquivos de mídia; atualiza por prova + número original. Erros são reportados por arquivo/registro e não interrompem os demais registros. O `--dry-run` valida sem criar tabelas nem gravar no banco. A versão ativa é registrada em `dataset_versoes`; configure `DATASET_VERSION` para cada publicação e reinicie a API depois de importar um novo dataset, para atualizar os cabeçalhos.

Antes de publicar questões reais, confira enunciado, alternativas, gabarito, assunto, direitos de uso e links com as provas/gabaritos oficiais do INEP; marque as classificações para revisão humana. Remova/substitua os registros fictícios — não os misture aos oficiais.

## Configuração

Copie `.env.example` para `.env` e ajuste os valores necessários. Principais opções:

| Variável | Uso |
|---|---|
| `ENV` | `dev` habilita `/docs` e `/redoc`; `prod` desabilita a documentação interativa. |
| `DATABASE_URL` | URL PostgreSQL do SQLAlchemy; no Docker Compose, o host do banco é `db`. |
| `CORS_ORIGINS` | Lista separada por vírgulas; não use `*` em produção. |
| `STATIC_BASE_URL` | Origem absoluta usada para compor URLs das imagens. |
| `MEDIA_BACKEND` / `MEDIA_DIR` | Armazenamento local neste MVP e caminho dos arquivos publicados. |
| `CACHE_BACKEND` | Cache descartável em memória (`memory`). |
| `DATASET_VERSION` | Versão enviada em metadados e registrada durante a importação. |
| `RATE_LIMIT_RESPONDER` | Limite por IP, por exemplo `60/minute`, para responder e gabarito. |
| `AUTO_CREATE_TABLES` | Desativado por padrão; as tabelas são criadas pelas migrações Alembic. |
| `METRICS_TOKEN` | Token Bearer exigido para `/metrics` quando `ENV=prod`. |

Esta entrega implementa apenas `MEDIA_BACKEND=local` e `CACHE_BACKEND=memory`; valores não implementados são rejeitados na inicialização, em vez de aparentarem funcionar. Em múltiplas réplicas, rate limit e cache em memória são locais a cada processo; configure Redis/armazenamento de objetos antes de escalar. Não registre IP ou dados pessoais.

## Migrações e comandos

Os comandos abaixo são opcionais e servem para desenvolvimento e validação:

```powershell
python -m alembic upgrade head
python -m scripts.import_data --file data/questoes/exemplo.json
python -m pytest --cov=app --cov-report=term-missing --cov-fail-under=85
python -m ruff check app scripts tests
python scripts/export_openapi.py
python scripts/smoke.py
```

Os arquivos REST Client ficam em `requests/explorador.http`; cenários k6 em `loadtests/questoes.js` (requer k6). Smoke test pressupõe que a API já esteja em execução; ajuste `API_BASE_URL` se necessário. O teste de contrato usa Schemathesis e uma API já iniciada.

## Estrutura

- `app/routers`: adaptadores HTTP sob `/api/v1`.
- `app/services.py`: regras de negócio e representação pública das questões.
- `app/repositories.py`: consultas SQLAlchemy e filtros.
- `app/models.py`, `app/schemas.py`: persistência e contratos Pydantic.
- `app/infra`: cache, limite de requisições e logging JSON.
- `alembic/`: migrações de banco.
- `scripts/`: importação, exportação OpenAPI e smoke test.
- `tests/`: testes de serviço, integração HTTP e contrato.

Os testes de integração usam bancos SQLite temporários; a aplicação executada no Compose usa PostgreSQL.

## Operação e limites conhecidos

- `/saude` indica que o processo está ativo; `/pronto` consulta o banco.
- `/metrics` expõe métricas Prometheus; em produção exige `Authorization: Bearer <METRICS_TOKEN>`.
- Erros 500 não devolvem detalhes internos; logs são JSON e não incluem IP.
- Não há contas, histórico, gravação de resposta, painel administrativo, resolução comentada nem dataset oficial nesta versão.
- A exportação de OpenAPI deve acompanhar mudanças no contrato; CI verifica se `openapi.json` está atualizado.
- O compose e o backend foram preparados para PostgreSQL e migrações; homologação pública e resultados de carga dependem de infraestrutura de deploy ainda não configurada.
