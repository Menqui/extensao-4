# Contrato da API — Explorador de Questões do ENEM (v1)

> **Documento de fronteira entre backend e frontend.** É a única coisa que os dois lados precisam combinar. O backend implementa exatamente isto; o frontend consome exatamente isto. A fonte da verdade técnica é o arquivo `openapi.json`, gerado pelo backend e versionado no repositório do backend. Este documento descreve o mesmo contrato em linguagem humana.

## Regras gerais
- **Base:** `/api/v1`. Respostas em JSON UTF-8.
- **Mudanças:** qualquer alteração incompatível exige nova versão (`/api/v2`). Adições compatíveis (campo novo opcional, endpoint novo) são permitidas em `v1` e registradas no `CHANGELOG_API.md`.
- **Parâmetros de lista:** repetir o parâmetro. Exemplo: `?ano=2022&ano=2023&assunto=probabilidade`.
- **Lógica dos filtros:** **E** entre tipos de filtro, **OU** entre valores do mesmo filtro.
- **Gabarito:** nunca aparece nas rotas de listagem/detalhe. Só nas rotas `responder` e `gabarito`.
- **Mídia:** as URLs de imagens vêm **absolutas** (montadas com `STATIC_BASE_URL`), prontas para uso em `<img src>`.
- **Cabeçalhos de resposta úteis:** `X-Request-ID`, `X-Dataset-Version`, `ETag` (listagens e metadados), `Cache-Control`.
- **Sem autenticação** na v1.

## Formato de erro (todos os erros)
```json
{
  "erro": {
    "codigo": "QUESTAO_NAO_ENCONTRADA",
    "mensagem": "Questão não encontrada.",
    "detalhes": null
  }
}
```
| HTTP | `codigo` | Quando |
|---|---|---|
| 404 | `QUESTAO_NAO_ENCONTRADA` | id inexistente |
| 422 | `PARAMETRO_INVALIDO` | filtro/valor inválido, `page_size` > 50, alternativa fora de A–E |
| 429 | `LIMITE_EXCEDIDO` | rate limit (cabeçalho `Retry-After`) |
| 500 | `ERRO_INTERNO` | falha inesperada (sem vazar detalhes) |
| 503 | `INDISPONIVEL` | banco fora do ar |

---

## `GET /api/v1/meta/filtros`
Valores disponíveis para montar os filtros. Só aparecem valores que têm questões publicadas.

**Resposta 200**
```json
{
  "dataset_version": "2026-10-12.1",
  "anos": [2020, 2021, 2022, 2023, 2024, 2025],
  "areas": [{"id": "matematica", "nome": "Matemática e suas Tecnologias"}],
  "assuntos": [{"id": "probabilidade", "nome": "Probabilidade", "area_id": "matematica"}],
  "aplicacoes": [{"id": "regular", "nome": "Aplicação regular"}]
}
```

## `GET /api/v1/questoes`
Lista questões **sem gabarito**.

**Parâmetros (todos opcionais)**
| Nome | Tipo | Observação |
|---|---|---|
| `ano` | int, repetível | ex.: `ano=2022` |
| `area` | string, repetível | id da área |
| `assunto` | string, repetível | casa com assunto principal **ou** secundário |
| `aplicacao` | string, repetível | id da aplicação |
| `incluir_anuladas` | bool | padrão `false` |
| `ordem` | `ano_desc` (padrão), `ano_asc`, `aleatoria` | |
| `semente` | int | usado com `aleatoria` para a paginação ser estável |
| `page` | int ≥ 1 | padrão 1 |
| `page_size` | int 1–50 | padrão 10 |

**Resposta 200**
```json
{
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_paginas": 5,
  "itens": [
    {
      "id": 123,
      "ano": 2022,
      "aplicacao": {"id": "regular", "nome": "Aplicação regular"},
      "prova": "ENEM 2022 – 1ª aplicação",
      "numero_original": 156,
      "area": {"id": "matematica", "nome": "Matemática e suas Tecnologias"},
      "assuntos": [{"id": "probabilidade", "nome": "Probabilidade", "principal": true}],
      "enunciado": "Texto em markdown com LaTeX entre $...$",
      "midias": [
        {"posicao": "enunciado", "url": "https://.../static/imagens/2022/q156.png", "alt": "Gráfico de barras ...", "largura": 800, "altura": 450}
      ],
      "alternativas": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."},
      "fonte_url": "https://www.gov.br/inep/..."
    }
  ]
}
```
Notas:
- `enunciado` e `alternativas` são **Markdown com LaTeX** (`$inline$` e `$$bloco$$`).
- Uma alternativa que seja imagem vem em `midias` com `posicao` = `alternativa_a` … `alternativa_e` (o texto da alternativa pode vir vazio).
- Lista vazia retorna `200` com `total: 0` e `itens: []`.

## `GET /api/v1/questoes/{id}`
Mesmo formato de um item da listagem (sem gabarito). 404 se não existir.

## `POST /api/v1/questoes/{id}/responder`
**Body**
```json
{"alternativa": "C"}
```
**Resposta 200**
```json
{"correta": true, "gabarito": "C", "resolucao_disponivel": false}
```
- `alternativa` deve ser `A`–`E` (422 caso contrário).
- Não grava nada sobre o usuário.
- `resolucao_disponivel` fica `false` até a funcionalidade de resolução comentada existir (campo previsto para não quebrar o contrato depois).

## `GET /api/v1/questoes/{id}/gabarito`
**Resposta 200:** `{"gabarito": "C"}`

## `GET /api/v1/questoes/{id}/resolucao` *(pós-MVP; pode retornar 404 `RESOLUCAO_INDISPONIVEL` no MVP)*
**Resposta 200**
```json
{"texto_md": "Passo 1 ...", "origem": "ia_revisada", "selo": "Resolução elaborada com apoio de IA e revisada por professor"}
```

## `GET /api/v1/saude` e `GET /api/v1/pronto`
- `saude`: processo vivo → `{"status": "ok"}`.
- `pronto`: testa o banco → `{"status": "ok", "dataset_version": "..."}` ou 503.

---

## Convenções de integração
- **CORS:** o backend libera apenas as origens configuradas em `CORS_ORIGINS`. O frontend informa a(s) origem(ns) que usa.
- **Pedidos de mudança:** quem precisar de alteração no contrato abre uma *issue/PR* no repositório do backend alterando este arquivo e o `openapi.json`. Nenhum dos lados muda o contrato sozinho.
- **Dados para desenvolvimento do frontend:** o backend carrega um dataset de exemplo com `docker compose up` e publica o `openapi.json`, que pode alimentar um servidor *mock* (ex.: Prism) ou a geração de tipos TypeScript.
