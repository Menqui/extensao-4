# Backend — Explorador de Questões do ENEM

API FastAPI com PostgreSQL. O Docker Compose inicia o banco e a API, executa as migrações do Alembic e aguarda o banco ficar pronto antes de iniciar o serviço.

## Iniciar com Docker (recomendado)

No PowerShell, a partir desta pasta (`backend`):

```powershell
docker compose up --build
```

Quando os serviços estiverem prontos:

- API: <http://localhost:8001>
- Documentação interativa: <http://localhost:8000/docs>
- Prontidão da API e do banco: <http://localhost:8000/api/v1/pronto>
- PostgreSQL local: `localhost:5433`

O Compose usa as portas `8001` e `5433` no host para não conflitar com aplicações locais; dentro dos containers, a API e o PostgreSQL continuam usando `8000` e `5432`. As portas do host são publicadas somente em `127.0.0.1`. O Compose usa credenciais padrão apenas para desenvolvimento local (`enem` / `enem_local_dev`). Para alterá-las, crie `backend/.env` com:

```dotenv
POSTGRES_DB=explorador
POSTGRES_USER=enem
POSTGRES_PASSWORD=uma_senha_local
```

O `.env` não deve ser compartilhado nem usado com as credenciais de exemplo em produção. A configuração mantém os dados do PostgreSQL no volume `postgres_data` mesmo após parar os containers.

Comandos úteis:

```powershell
docker compose logs -f api
docker compose stop
docker compose down
```

`docker compose down` preserva o banco. Para apagar também os dados locais, use `docker compose down -v` (isso é destrutivo).

## Execução local sem Docker

É necessário ter PostgreSQL acessível e definir `DATABASE_URL`, por exemplo:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://enem:senha@localhost:5432/explorador"
cd backend
.\.venv\Scripts\Activate.ps1
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

## Importar questões

A inicialização cria o esquema usando as migrações, mas não importa automaticamente questões fictícias ou oficiais. Para carregar um arquivo JSON já revisado no container:

```powershell
docker compose exec api python scripts/import_data.py --file data/questoes/exemplo.json
```

O arquivo de exemplo contém dados fictícios, identificados como tais, e serve apenas para desenvolvimento. Substitua-o por dados oficiais extraídos e revisados antes de qualquer publicação. Os arquivos de mídia referenciados devem estar em `data/imagens/`.

## Testes

```powershell
.\.venv\Scripts\python.exe -m pytest
```
