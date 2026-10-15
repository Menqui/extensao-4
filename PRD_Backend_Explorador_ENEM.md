# PRD — Backend: Explorador de Questões do ENEM

> **Escopo deste documento:** apenas o **backend** (API + banco + importação de dados + curadoria futura). O frontend é um projeto **separado**, de outra pessoa, descrito em `PRD_Frontend_Explorador_ENEM.md`. A única ligação entre os dois é o **`CONTRATO_API.md`**. Cole este PRD e o contrato na LLM de código.

---

## 1. Contexto

Projeto da disciplina Extensão IV (CC157, UECE): uma plataforma web para candidatos ao ENEM filtrarem e resolverem questões oficiais por **ano**, **área do conhecimento** e **assunto**, com gabarito e identificação da prova de origem.

**Problema (resumo):** já existem plataformas com questões do ENEM, mas o estudante tem pouco controle sobre qual **edição** e qual **conteúdo** praticar, e o estilo das questões muda ao longo dos anos. A entrevista com um candidato confirmou o interesse em filtrar por ano, área, assunto e prova/aplicação.

**Papel do backend:** guardar as questões em banco, expor uma API estável e rápida para consulta/filtragem/conferência de resposta, e fornecer as ferramentas de importação e curadoria do conteúdo.

### 1.1 Escopo do MVP
- Área: **Matemática**. Edições: **2020 a 2025** (definidas pelos dados, não pelo código).
- Banco estruturado de questões, filtros, entrega de questões, conferência de resposta, consulta ao gabarito, identificação da origem.
- Sem login, sem histórico de usuário, sem dados pessoais.

### 1.2 Fora do escopo do backend (MVP)
Contas de usuário, desempenho/estatísticas por usuário, redação, gestão de estudos, qualquer interface visual (nem mesmo servir o frontend), e uso de LLM em tempo real.

### 1.3 Visão de longo prazo
O projeto pode evoluir para uso em escala estadual. O MVP segue simples (monólito, stateless), mas respeitando as decisões da seção 11 para que o crescimento seja apenas mudança de infraestrutura.

---

## 2. Princípio de separação (requisito principal)

1. O backend **deve rodar, ser testado e ser demonstrado sem nenhum frontend**.
2. O backend **não serve páginas, não serve o build do frontend e não importa nada do frontend**. Ele serve **somente API JSON e arquivos de mídia** (imagens das questões).
3. O contrato com o frontend é o `CONTRATO_API.md` + `openapi.json`. Nada fora do contrato pode ser exigido do backend pelo frontend.
4. Repositório próprio, com README, Docker, testes e CI próprios.

### 2.1 Como testar o backend sem o frontend (tudo isso é requisito)
| Ferramenta | O que entregar |
|---|---|
| **Swagger UI / ReDoc** | `/docs` e `/redoc` habilitados em dev, permitindo chamar todos os endpoints pelo navegador |
| **Testes automatizados** | `pytest` + `httpx.AsyncClient`/`TestClient`, banco de teste isolado por execução, cobertura mínima de 85% nas camadas de serviço e repositório |
| **Testes de contrato** | `schemathesis` (ou equivalente) rodando contra o `openapi.json`, para provar que as respostas respeitam o contrato e que entradas inválidas retornam 422 |
| **Coleção de requisições** | Pasta `requests/` com arquivos `.http` (VS Code REST Client) **ou** coleção Bruno/Postman, cobrindo todos os fluxos (filtrar, paginar, responder, gabarito, erros) |
| **Dados de exemplo** | `docker compose up` carrega o dataset de exemplo (seção 6.3) automaticamente |
| **Smoke test** | Script `scripts/smoke.sh` que sobe o ambiente e chama os endpoints principais com `curl`, falhando se algo sair do esperado |
| **Testes de carga** | Scripts `k6` em `loadtests/` (seção 9) |

### 2.2 Execução local
```
docker compose up --build  # sobe API + PostgreSQL + seed de exemplo
docker compose down        # para os serviços
```
Os testes, lint e smoke test podem ser executados diretamente com as ferramentas Python instaladas no ambiente de desenvolvimento.

### 2.3 Facilitar o trabalho do outro desenvolvedor
- `openapi.json` versionado e atualizado a cada mudança (CI falha se estiver desatualizado).
- `CHANGELOG_API.md` com todas as mudanças do contrato.
- Instância de **homologação** publicada (ex.: serviço gratuito) com o dataset de exemplo, para o frontend desenvolver sem rodar nada local.
- Alternativa de *mock*: o `openapi.json` pode alimentar o Prism, caso o backend esteja indisponível.

---

## 3. Requisitos funcionais do backend

| ID | Requisito |
|---|---|
| RF-01 | Listar questões de edições anteriores, com paginação. |
| RF-02 | Filtrar por **ano** (múltiplo). |
| RF-03 | Filtrar por **área do conhecimento** (múltiplo). |
| RF-04 | Filtrar por **assunto** (múltiplo; casa com principal ou secundário). |
| RF-05 | Filtrar por **prova/aplicação** (regular, reaplicação, digital etc.). |
| RF-06 | Combinar filtros: **E** entre tipos, **OU** dentro do mesmo tipo. |
| RF-07 | Informar o `total` e `total_paginas` do resultado. |
| RF-08 | Ordenar por ano (asc/desc) ou aleatório com `semente` (paginação estável). |
| RF-09 | Retornar origem completa: ano, aplicação, número original, link da fonte oficial. |
| RF-10 | Retornar enunciado e alternativas em Markdown com LaTeX, e mídias com `alt`, largura e altura. |
| RF-11 | Conferir resposta (`responder`) e informar `correta` + `gabarito`. |
| RF-12 | Entregar o gabarito sob demanda (`gabarito`). |
| RF-13 | **Nunca** expor o gabarito na listagem/detalhe. |
| RF-14 | Expor os valores de filtro disponíveis (`meta/filtros`), só com valores que têm questões publicadas. |
| RF-15 | Excluir questões anuladas por padrão, com opção de incluí-las. |
| RF-16 | Importar dados de arquivos JSON de forma **idempotente** e versionar o dataset. |
| RF-17 | Healthchecks de vida e prontidão. |

Os formatos exatos de entrada e saída estão em `CONTRATO_API.md`.

---

## 4. Requisitos não funcionais

- **RNF-01 Desempenho:** metas da seção 9.
- **RNF-02 Fidelidade do conteúdo:** nenhuma alteração de enunciado/alternativas/gabarito em relação à prova oficial.
- **RNF-03 Manutenibilidade:** adicionar anos/áreas exige apenas novos dados (arquivos de seed), não código.
- **RNF-04 Privacidade:** nenhuma resposta do usuário é persistida; sem dados pessoais; logs sem IP completo (anonimizar ou truncar).
- **RNF-05 Portabilidade:** roda localmente com Docker; configuração 100% por variáveis de ambiente.
- **RNF-06 Documentação:** README completo, `openapi.json`, `CHANGELOG_API.md`, runbook básico.

---

## 5. Regras de negócio
1. A resposta do usuário nunca é persistida.
2. O gabarito só sai por `responder` ou `gabarito`.
3. Questões anuladas ficam fora da listagem padrão.
4. Uma questão tem exatamente **um assunto principal** e zero ou mais secundários.
5. Só aparecem em `meta/filtros` valores com ao menos uma questão publicada.
6. Apenas questões com status `publicada` aparecem na API.
7. A origem (ano, aplicação, número) sempre acompanha a questão.

---

## 6. Dados

### 6.1 Fonte
Provas e gabaritos oficiais do INEP (https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos). Pode-se usar um dataset público já estruturado para acelerar o seed, **desde que conferido com a prova oficial**.

### 6.2 O "assunto" não vem das provas
O INEP não publica assunto por questão. Processo:
1. Lista fechada de assuntos (6.4).
2. Classificação em um assunto principal (+ secundários opcionais), manual ou com apoio de LLM, **sempre com revisão humana** antes de publicar.
3. Classificações em arquivo separado, para corrigir sem reprocessar questões.

### 6.3 Modelo de dados (PostgreSQL)
```
areas(id slug PK, nome)
assuntos(id slug PK, area_id FK, nome)
aplicacoes(id slug PK, nome)                      -- regular, reaplicacao, digital...
provas(id PK, ano int, aplicacao_id FK, caderno_cor null, descricao)
questoes(
  id PK, prova_id FK, area_id FK, numero_original int,
  enunciado text,                                  -- markdown + LaTeX
  alternativa_a..alternativa_e text,
  gabarito char(1) CHECK IN ('A','B','C','D','E'),
  anulada bool default false,
  fonte_url null,
  status text default 'rascunho',                  -- rascunho | em_revisao | publicada
  revisada_por null, revisada_em null,
  exemplo bool default false,                      -- true = placeholder de desenvolvimento
  UNIQUE (prova_id, numero_original)
)
questao_assuntos(questao_id FK, assunto_id FK, principal bool,
                 PRIMARY KEY (questao_id, assunto_id))
midias(id PK, questao_id FK, posicao, caminho_arquivo, alt, largura int, altura int)
dataset_versoes(id PK, versao text, criada_em timestamptz, descricao)
-- pós-MVP:
resolucoes(id PK, questao_id FK, texto_md, origem, status, revisada_por, revisada_em, versao)
```

**Índices:** `provas(ano)`, `provas(aplicacao_id)`, `questoes(prova_id)`, `questoes(area_id, status)`, `questao_assuntos(assunto_id, questao_id)`, e `UNIQUE(prova_id, numero_original)`.

### 6.4 Taxonomia inicial de Matemática (lista fechada, ajustável por `data/taxonomia.json`)
Aritmética e proporcionalidade (razão, proporção, regra de três) · Porcentagem e matemática financeira · Conjuntos numéricos e operações · Geometria plana · Geometria espacial · Geometria analítica · Trigonometria · Funções (afim, quadrática, exponencial, logarítmica) · Sequências (PA e PG) · Análise combinatória · Probabilidade · Estatística (média, mediana, moda, desvio padrão, leitura de gráficos e tabelas) · Álgebra, equações e sistemas · Escalas, grandezas e unidades · Raciocínio lógico e interpretação de gráficos.

### 6.5 Formato de seed
- `data/taxonomia.json`, `data/aplicacoes.json`
- `data/questoes/<ano>_<aplicacao>_<area>.json` (um arquivo por prova/área)
- `data/imagens/<ano>/...`
- `data/questoes/exemplo.json` (dataset de exemplo)

Item de exemplo:
```json
{
  "ano": 2022, "aplicacao": "regular", "area": "matematica",
  "numero_original": 156,
  "enunciado": "Texto com $\\frac{1}{2}$ ...",
  "imagens_enunciado": [{"arquivo": "2022/q156.png", "alt": "Gráfico de barras ..."}],
  "alternativas": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."},
  "gabarito": "C",
  "assunto_principal": "probabilidade",
  "assuntos_secundarios": [],
  "anulada": false,
  "status": "publicada"
}
```

### 6.6 Script de importação (`scripts/import_data.py`)
- **Idempotente:** reexecutar não duplica (upsert por `prova_id + numero_original`).
- Valida o esquema (Pydantic), o gabarito (A–E), o assunto contra a taxonomia e a existência das imagens; relata erros por arquivo/linha sem abortar tudo.
- Lê dimensões das imagens e preenche largura/altura.
- Ao final, cria um novo registro em `dataset_versoes` e imprime o resumo (inseridas, atualizadas, ignoradas, erros).
- Modo `--dry-run` para validar sem gravar.

### 6.7 Dataset de exemplo (obrigatório para desenvolvimento)
Pelo menos **15 questões fictícias** marcadas `exemplo: true`, cobrindo vários anos e assuntos, incluindo: uma com imagem, uma com LaTeX, uma anulada e uma com alternativa em imagem. Devem ser claramente placeholders (nunca apresentadas como oficiais) e removidas antes de publicar dados reais.

---

## 7. Stack do backend [DECISÃO, pode ser trocada]
- **Python 3.11+**, **FastAPI**, **Pydantic v2**, **SQLAlchemy 2.x** (async opcional) + **Alembic**.
- **PostgreSQL** (dev e produção, via Docker). SQLite apenas como opção para testes unitários rápidos.
- **pytest**, **httpx**, **schemathesis**, **ruff**, **mypy**, **k6** (carga).
- **Uvicorn/Gunicorn** em contêiner; `Dockerfile` multi-stage, usuário não-root.

### 7.1 Estrutura de pastas
```
backend/
├─ README.md
├─ docker-compose.yml          # api + postgres (+ seed de exemplo)
├─ Dockerfile
├─ openapi.json                # gerado, versionado
├─ CHANGELOG_API.md
├─ .env.example
├─ app/
│  ├─ main.py
│  ├─ config.py                # variáveis de ambiente (pydantic-settings)
│  ├─ db.py
│  ├─ models/                  # SQLAlchemy
│  ├─ schemas/                 # Pydantic (contrato)
│  ├─ routers/                 # só traduzem HTTP
│  │  ├─ questoes.py
│  │  ├─ meta.py
│  │  └─ saude.py
│  ├─ services/                # regras de negócio
│  ├─ repositories/            # acesso ao banco
│  ├─ infra/
│  │  ├─ cache.py              # interface Cache (memória / Redis)
│  │  ├─ media.py              # interface MediaStorage (disco / S3)
│  │  ├─ rate_limit.py
│  │  └─ logging.py
│  └─ errors.py                # formato de erro padronizado
├─ alembic/
├─ scripts/ (import_data.py, smoke.sh, export_openapi.py)
├─ requests/                   # .http / Bruno
├─ loadtests/                  # k6
├─ data/                       # taxonomia, questões, imagens
└─ tests/
   ├─ unit/
   ├─ integration/
   └─ contract/
```

### 7.2 Variáveis de ambiente (`.env.example`)
`DATABASE_URL`, `CORS_ORIGINS`, `STATIC_BASE_URL`, `MEDIA_BACKEND` (local|s3), `MEDIA_DIR`, `CACHE_BACKEND` (memory|redis), `REDIS_URL`, `DATASET_VERSION`, `RATE_LIMIT_RESPONDER`, `LOG_LEVEL`, `ENV` (dev|prod; em prod `/docs` pode ficar desabilitado ou protegido).

---

## 8. Testes (requisitos)

**Unitários/integração (obrigatórios):**
- Filtro por ano, por área, por assunto (principal e secundário), por aplicação.
- Combinação E/OU dos filtros.
- Paginação (limites, `page` além do total, `page_size` > 50 → 422).
- Ordenação, incluindo `aleatoria` com a mesma `semente` retornando a mesma ordem.
- Anuladas: ocultas por padrão, visíveis com `incluir_anuladas=true`.
- Apenas questões `publicada` aparecem.
- **Listagem e detalhe nunca contêm o campo `gabarito`** (teste explícito).
- `responder`: alternativa correta, incorreta, inválida (422), questão inexistente (404).
- `meta/filtros` só retorna valores com questões.
- Formato de erro padronizado em todos os casos.
- Importação idempotente (rodar duas vezes mantém as contagens).
- Importação rejeita gabarito inválido e assunto inexistente.

**Contrato:** `schemathesis` contra `openapi.json`.
**Qualidade:** `ruff`, `mypy`, cobertura ≥ 85%.
**Smoke:** o smoke test fica verde a partir de um clone limpo.

---

## 9. Performance e otimização

### 9.1 Metas
| Métrica | Meta |
|---|---|
| `GET /questoes` p95 (servidor) | < 150 ms |
| `POST /responder` p95 | < 80 ms |
| `GET /meta/filtros` (com cache) | < 20 ms |

### 9.2 Técnicas
- Índices da seção 6.3 e verificação com `EXPLAIN` das consultas de filtro.
- Evitar N+1 (carregar assuntos e mídias em consultas agrupadas); selecionar só colunas necessárias; não carregar gabarito na listagem.
- Paginação por `page/page_size` na v1 (adequada ao volume atual). Se o volume crescer muito, adotar cursor em uma versão nova da API, sem quebrar a v1.
- **Cache:** `meta/filtros` e gabaritos em cache (LRU em memória; Redis na escala); chaves incluem `dataset_version`, que invalida tudo a cada nova importação.
- **HTTP:** `ETag` + `Cache-Control` em listagens e metadados (permitindo CDN), `stale-while-revalidate`, gzip/brotli.
- Mídia com `Cache-Control` longo e nomes de arquivo versionados (hash ou versão).
- **Rate limiting** por IP em `responder` e `gabarito` (evita raspagem em massa).
- **Testes de carga (`k6`):** cenários de listar, filtrar, paginar e responder; resultados registrados no README e comparados com as metas.

---

## 10. Segurança
CORS restrito a `CORS_ORIGINS`; validação estrita com Pydantic; consultas parametrizadas; HTTPS e cabeçalhos de segurança em produção; segredos fora do repositório; varredura de dependências e *lockfiles*; erros sem vazar detalhes internos; logs sem dados pessoais.

---

## 11. Arquitetura para escala estadual

### 11.1 Estágios (só muda infraestrutura, não código)
| Estágio | Contexto | Infraestrutura |
|---|---|---|
| **E0 – MVP/disciplina** | demonstração, poucos usuários | 1 contêiner de API + PostgreSQL, hospedagem gratuita |
| **E1 – Piloto** | escolas/regional | PostgreSQL gerenciado, CDN na frente, Redis opcional, monitoramento, backups |
| **E2 – Estadual** | rede estadual / picos pré-ENEM | várias instâncias atrás de balanceador, PostgreSQL com réplica de leitura, Redis, CDN, armazenamento de objetos para imagens, observabilidade, CI/CD, escala automática |

### 11.2 Decisões obrigatórias já no MVP
1. **API stateless** (nada de estado de sessão no processo, exceto cache descartável).
2. **Configuração 12-factor** (seção 7.2).
3. **Camadas:** routers → services → repositories.
4. **Contrato OpenAPI** gerado e `/api/v1`.
5. **`MediaStorage` e `Cache` abstratos**, escolhidos por configuração.
6. **Migrações Alembic** e importação idempotente com `dataset_version`.
7. **Healthchecks** `saude` (vida) e `pronto` (testa banco).
8. **Logs JSON estruturados** com `request_id` e métricas Prometheus em `/metrics` (protegido).
9. **Contêiner reprodutível** (multi-stage, não-root).

### 11.3 Curadoria e governança (fase futura)
Painel/CLI administrativo protegido para cadastrar e corrigir questões e assuntos, marcar anuladas, anexar imagens e publicar novo dataset; fluxo `rascunho → em_revisao → publicada` com `revisada_por/em`; trilha de auditoria; conferência de gabaritos contra a prova oficial; `dataset_version` para reverter.

### 11.4 Taxonomia estendida (futuro)
Campos opcionais `habilidade` (Matriz de Referência do ENEM; **conferir lista oficial no INEP**) e `dificuldade`; taxonomia versionada como dado.

### 11.5 Contas e LGPD (fora do MVP)
Se houver necessidade de histórico, criar como **módulo separado**, com contas opcionais, base legal e minimização, regras para dados de crianças e adolescentes, e métricas agregadas e anonimizadas.

### 11.6 Observabilidade e operação
Painel com latência p50/p95/p99, erros, uso de recursos e taxa de acerto de cache; alertas para 5xx e falha de healthcheck; CI/CD com lint, testes, contrato, build e deploy; runbook (reiniciar, restaurar backup, publicar/reverter dataset); backups automáticos com teste de restauração.

---

## 12. Resolução comentada (pós-MVP, opcional)
Gerar **offline** com LLM, **revisar por professor** e salvar no banco (tabela `resolucoes`). Nunca chamar LLM em tempo real por requisição. O script `scripts/gerar_resolucoes.py` gera rascunho, confere se a conclusão bate com o gabarito oficial (se não bater, vai para revisão manual) e só publica após aprovação humana. Endpoint `GET /questoes/{id}/resolucao` já previsto no contrato; resposta indica `origem` para exibir o selo de IA revisada.

---

## 13. Critérios de aceite do backend (testáveis sem frontend)
- [ ] `docker compose up` sobe API, banco e dados de exemplo; `/docs` abre.
- [ ] Testes automatizados e de contrato passam.
- [ ] Smoke test passa a partir de um clone limpo.
- [ ] Filtros por ano, assunto e combinações retornam exatamente o esperado (testes).
- [ ] Listagem e detalhe **não** contêm `gabarito`.
- [ ] `responder` e `gabarito` funcionam e validam entrada.
- [ ] Importar duas vezes não duplica; erros de dados são reportados com clareza.
- [ ] Anuladas e não publicadas ficam fora por padrão.
- [ ] `openapi.json` atualizado e igual ao gerado pela aplicação.
- [ ] Metas de performance da seção 9 atingidas no teste de carga.
- [ ] README permite a outra pessoa rodar tudo do zero.

---

## 14. Plano de implementação (uma fase por vez)

1. **Base:** estrutura, `config`, modelos, migração inicial, `docker-compose` (api + postgres).
2. **Dados:** taxonomia, script de importação idempotente e dataset de exemplo.
3. **API:** endpoints do contrato, filtros, paginação, ordenação, erros padronizados, ocultação do gabarito, healthchecks.
4. **Testes:** unitários, integração, contrato (schemathesis), cobertura, `requests/`, `smoke.sh`.
5. **Infra e performance:** interfaces `Cache` e `MediaStorage`, ETag/cache HTTP, rate limit, logs estruturados, métricas, `k6`.
6. **Entrega:** `openapi.json` + `CHANGELOG_API.md`, README, homologação publicada, checklist da seção 13.
7. **Depois do MVP validado:** curadoria, piloto (E1), resolução comentada, evolução (E2).

---

## 15. Instruções para a LLM de código
- Implemente **somente o backend**; **não crie** frontend, páginas HTML nem servidor de estáticos do app.
- Siga `CONTRATO_API.md` à risca; se algo for ambíguo, escolha a opção mais simples, registre a suposição no README e continue.
- Código, comentários, mensagens de erro e README em **português do Brasil**.
- Escreva testes junto com cada funcionalidade, não no final.
- Nunca exponha o gabarito em listagem ou detalhe.
- Entregue cada fase com: arquivos criados/alterados, comandos para rodar e como verificar os critérios de aceite relacionados.
- Não implemente nada fora do escopo (login, histórico de usuário, ranking).

---

## 16. Riscos
| Risco | Mitigação |
|---|---|
| Extração das questões dos PDFs é trabalhosa | Começar com poucas questões por ano; script pronto; revisão manual |
| Classificação de assunto não oficial | Taxonomia fechada, revisão humana, correção via JSON |
| Contrato mudar e quebrar o frontend | Versionamento, `CHANGELOG_API.md`, mudanças só por PR no contrato |
| Gabaritos divergentes entre aplicações/anuladas | Campo `anulada`, conferência com o oficial de cada aplicação |
| Direitos de uso do conteúdo | Usar só provas oficiais públicas do INEP, citar fonte e manter link |
