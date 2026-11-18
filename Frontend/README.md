# Explorador ENEM — execução local e instalação no celular

Guia para iniciar a API, o banco de dados e o frontend, gerar o PWA e compartilhar um acesso temporário com outro desenvolvedor.

Este guia usa o ambiente Windows com Docker Desktop e PowerShell. Os comandos refletem a configuração utilizada nos testes: API na porta **8001** e preview do frontend na porta **4173**.

## 1. Escolha como testar

| Objetivo | O que é necessário |
| --- | --- |
| Testar o app no celular usando o computador de outro dev | Receber o link HTTPS ativo e instalar pelo navegador. Não precisa clonar o projeto nem instalar Docker no celular. |
| Executar o projeto no próprio computador | Clonar o repositório, instalar as ferramentas e seguir a preparação abaixo. |
| Alterar o frontend e conferir rapidamente no computador | Executar o servidor de desenvolvimento do Vite. |
| Testar a versão instalada do PWA | Gerar o build, iniciar o preview e abrir o link HTTPS do túnel. |

## 2. Ferramentas para quem vai hospedar os testes

- Git.
- Node.js e npm, em uma versão compatível com o `package.json` do frontend.
- Docker Desktop instalado, aberto e com o mecanismo de containers Linux funcionando.
- Cloudflared para gerar o link HTTPS temporário.

Confira no PowerShell:

```powershell
git --version
node --version
npm --version
docker compose version
docker run --rm hello-world
```

Com Docker, as dependências Python do backend são instaladas na imagem. Não é necessário criar um ambiente virtual Python no Windows para seguir este fluxo.

Instale o cloudflared, se necessário:

```powershell
winget install --id Cloudflare.cloudflared --exact
```

Feche o PowerShell, abra uma nova janela pelo menu Iniciar e confira:

```powershell
cloudflared --version
```

## 3. Obter o projeto

Quem já possui o projeto pode abrir um terminal na pasta `extensao-4` e seguir para a próxima etapa.

Para uma instalação nova, substitua `URL_DO_REPOSITORIO` pelo endereço real do repositório:

```powershell
git clone URL_DO_REPOSITORIO extensao-4
cd extensao-4
```

Use a branch que contém a integração com a API e as alterações do PWA. Confira a branch atual com `git branch --show-current`.

## 4. Preparar e iniciar o backend

Execute na **raiz do projeto**, onde estão `docker-compose.yml`, `Dockerfile` e `.env.example`.

Crie o `.env` do backend somente se ele ainda não existir:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Confira as variáveis do exemplo e mantenha a configuração de banco esperada pelo Compose. Não publique arquivos `.env` com credenciais.

Inicie os serviços:

```powershell
docker compose up --build -d
docker compose ps
```

Aguarde os serviços iniciarem. Na configuração utilizada neste projeto, os serviços são `api` e `db`.

| Serviço | Endereço no computador |
| --- | --- |
| API | http://127.0.0.1:8001 |
| Swagger | http://127.0.0.1:8001/docs |
| OpenAPI | http://127.0.0.1:8001/openapi.json |
| PostgreSQL | `127.0.0.1:5433` |

A porta `8000` é interna ao container da API. O acesso pelo computador usa a porta publicada `8001`. Se o Compose local publicar outra porta, ajuste os comandos e o proxy do frontend.

### Carregar os dados de demonstração

Na primeira execução de um banco vazio, valide e importe os dados:

```powershell
docker compose exec api python scripts/import_data.py --file data/questoes/exemplo.json --dry-run
docker compose exec api python scripts/import_data.py --file data/questoes/exemplo.json
```

O primeiro comando valida sem gravar. O segundo importa. Não é necessário repetir a importação em toda inicialização.

Esses dados são questões fictícias de demonstração, não questões oficiais do INEP. Nos testes realizados, foram importados 16 registros e a listagem padrão retornou 15 questões, com as anuladas excluídas.

Teste no PowerShell:

```powershell
Invoke-RestMethod 'http://127.0.0.1:8001/api/v1/meta/filtros'
Invoke-RestMethod 'http://127.0.0.1:8001/api/v1/questoes?page_size=1'
```

## 5. Preparar o frontend

Na raiz do projeto:

```powershell
cd Frontend
npm ci --include=dev
```

O comando usa as versões registradas no `package-lock.json` e inclui as ferramentas de desenvolvimento necessárias ao build.

No arquivo **`Frontend/.env`**, confira estas variáveis, preservando outras configurações existentes:

```env
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK=false
```

O `.env` do frontend é diferente do `.env` da raiz, usado pelo backend.

Use a base relativa `/api/v1`: no celular, `localhost` se refere ao próprio aparelho. O navegador deve chamar o mesmo domínio HTTPS do app, e o proxy encaminha a requisição para a API no computador.

### Conferir o proxy do Vite

O arquivo `Frontend/vite.config.ts` deve encaminhar `/api/v1` e `/static` para `http://127.0.0.1:8001`, tanto no desenvolvimento quanto no preview.

Este é apenas o trecho relacionado ao proxy. **Preserve os plugins e a configuração do PWA já existentes no arquivo.**

```ts
const proxy = {
  "/api/v1": {
    target: "http://127.0.0.1:8001",
    changeOrigin: true,
  },
  "/static": {
    target: "http://127.0.0.1:8001",
    changeOrigin: true,
  },
};

// Dentro do objeto passado a defineConfig, junto das demais opções:
// server: { proxy },
// preview: { proxy },
```

Essas opções ficam em `vite.config.ts`. Não coloque `proxy` dentro de `test.server` do Vitest.

## 6. Gerar e iniciar a versão PWA

Na pasta `Frontend`:

```powershell
npm run build
npx vite preview --port 4173 --strictPort
```

Mantenha esse terminal aberto. Acesse no computador:

http://localhost:4173

O build deve gerar o manifesto e o service worker, como `dist/manifest.webmanifest` e `dist/sw.js`. No navegador, confira em **DevTools → Application → Manifest / Service workers**.

Para conferir o proxy do preview, abra outra janela do PowerShell:

```powershell
Invoke-RestMethod 'http://localhost:4173/api/v1/meta/filtros'
```

O retorno deve ser JSON com os filtros. Se retornar HTML, confira o proxy e reinicie o preview.

## 7. Gerar o link HTTPS para os celulares

Com o backend e o preview funcionando, abra **outro terminal do PowerShell** e execute:

```powershell
cloudflared tunnel --url http://localhost:4173 --http-host-header localhost:4173
```

O terminal exibirá um endereço semelhante a este:

```text
https://nome-gerado.trycloudflare.com
```

Copie o endereço HTTPS exibido na execução atual. A mensagem `Registered tunnel connection` indica que a conexão do túnel foi estabelecida.

O parâmetro `--http-host-header localhost:4173` faz o serviço local receber o Host esperado pelo Vite. Não é necessário liberar todos os hosts no Vite.

Compartilhe o link com o outro desenvolvedor. Ele pode abrir pelo Wi-Fi ou pelos dados móveis; não precisa estar na mesma rede do computador.

O link é temporário e qualquer pessoa que o receber poderá acessar o app e as rotas disponibilizadas pelo proxy. Use-o para os testes de demonstração.

## 8. Instalar no celular

### Android

1. Abra o link HTTPS no Chrome, diretamente no navegador.
2. Aguarde a página carregar.
3. Abra o menu **⋮**.
4. Selecione **Instalar aplicativo** ou **Adicionar à tela inicial** e confirme a instalação. O texto pode variar.
5. Abra o app pelo ícone criado.

### iPhone

1. Abra o link HTTPS no Safari.
2. Toque em **Compartilhar**.
3. Selecione **Adicionar à Tela de Início**.
4. Confirme e abra pelo ícone criado.

O outro desenvolvedor não precisa instalar Node, Docker ou cloudflared no celular. Essas ferramentas ficam no computador que está hospedando o teste.

### Limites desse acesso temporário

- Mantenha o computador ligado, conectado à internet e sem suspender.
- Mantenha o Docker, os containers, o preview e o túnel funcionando.
- Ao encerrar o túnel, o link deixa de funcionar.
- Ao criar outro Quick Tunnel, o endereço muda. Compartilhe o novo link e instale novamente se necessário; o ícone anterior continua associado ao endereço antigo.
- Instalar o PWA não hospeda o backend no celular. Consultar novas questões e conferir respostas continuam dependendo da API e da conexão.
- A interface pode ter arquivos em cache, mas isso não significa que a resolução completa de questões funciona offline.

Para manter uma instalação utilizável entre sessões sem trocar o endereço, será necessário usar uma URL estável, por exemplo com hospedagem HTTPS ou um túnel configurado com domínio fixo.

## 9. Rotina para os próximos dias

Depois da preparação inicial, não é necessário reinstalar tudo.

**Terminal 1 — raiz do projeto:**

```powershell
docker compose up -d
docker compose ps
```

**Terminal 2 — pasta `Frontend`:**

```powershell
npm run build
npx vite preview --port 4173 --strictPort
```

**Terminal 3 — PowerShell:**

```powershell
cloudflared tunnel --url http://localhost:4173 --http-host-header localhost:4173
```

Compartilhe o link HTTPS gerado nessa sessão.

## 10. Atualizar o app durante o desenvolvimento

### Alterações no frontend

O preview serve o resultado do último build, não os arquivos-fonte em tempo real.

1. Salve as alterações.
2. No terminal do preview, pressione `Ctrl+C`.
3. Gere e inicie a nova versão:

```powershell
npm run build
npx vite preview --port 4173 --strictPort
```

Pode manter o túnel aberto durante esse processo para preservar o mesmo link. Enquanto o preview estiver parado, o acesso ficará indisponível.

No celular, abra ou recarregue o app. Se aparecer o aviso de nova versão, termine a questão atual e toque em **Atualizar**. As variáveis `VITE_*` também exigem novo build quando alteradas.

Para alterações rápidas com recarregamento automático no computador, execute na pasta `Frontend`:

```powershell
npx vite --port 5173 --strictPort
```

Esse servidor de desenvolvimento é separado do preview na porta `4173`. Use o build e o preview para validar o PWA instalado.

### Alterações no backend

Na raiz do projeto, reconstrua a imagem e atualize os serviços:

```powershell
docker compose up --build -d
```

Se houver mudanças no `package-lock.json` ao atualizar a branch, execute novamente `npm ci --include=dev` antes do build do frontend.

## 11. Encerrar os testes

1. No terminal do cloudflared, pressione `Ctrl+C`.
2. No terminal do preview, pressione `Ctrl+C`.
3. Na raiz do projeto, pare os containers:

```powershell
docker compose stop
```

Isso preserva os containers e seus dados para a próxima inicialização. Evite comandos de exclusão de volumes se quiser manter o banco importado.

## 12. Problemas comuns

| Problema | O que conferir |
| --- | --- |
| `cloudflared` não é reconhecido | Feche o terminal e abra uma nova janela pelo menu Iniciar. Confira `cloudflared --version`. |
| Docker não conecta | Abra o Docker Desktop e aguarde o mecanismo iniciar. Confira `docker compose ps` na raiz do projeto. |
| `502 Bad Gateway` no link | Confira se `http://localhost:4173` abre no computador e se o preview está funcionando na porta correta. |
| App abre, mas não carrega questões | Teste a API em `8001`, depois o proxy em `4173`. Confira o `.env` do frontend e os logs da API. |
| Retorno HTML em `/api/v1/meta/filtros` | Confira o proxy em `vite.config.ts`; reinicie o Vite após mudar sua configuração. |
| Filtros e lista vazios | Confira se o banco recebeu a importação dos dados de demonstração. |
| Porta `4173` ocupada | Encerre o preview antigo antes de iniciar outro. `--strictPort` impede mudar silenciosamente para outra porta. |
| `Blocked request` por hostname | Confira se o túnel foi iniciado com `--http-host-header localhost:4173`. |
| Ícone instalado deixou de acessar | Verifique se o túnel foi encerrado ou se o endereço mudou. Abra o link da sessão atual. |
| Celular mostra versão antiga | Gere novo build, reinicie o preview, reabra o app e aceite o aviso de atualização quando aparecer. |
| Opção de instalar não aparece | Abra o endereço HTTPS no navegador completo, confira o manifesto e o service worker e verifique se o app já está instalado. |
| Aviso de chunk maior que 500 kB | É um aviso de tamanho. Se o build terminou com sucesso, o teste pode continuar; otimizações ficam para uma etapa posterior. |

Para acompanhar os logs do backend, na raiz do projeto:

```powershell
docker compose logs --tail 100 -f api
```

Pressione `Ctrl+C` para sair da visualização dos logs; isso não para a API.

Se o comando instalado ainda não aparecer no PowerShell, atualize o PATH somente da janela atual e confira novamente:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
cloudflared --version
```

## 13. Roteiro de teste no celular

- Abrir o app pelo ícone instalado.
- Selecionar e limpar filtros.
- Alterar ordenação e quantidade de questões por página.
- Navegar entre páginas e conferir a rolagem dos resultados.
- Selecionar uma alternativa sem confundir a seleção com o feedback de acerto.
- Enviar respostas certas e erradas e consultar o gabarito.
- Conferir imagens, fórmulas, mensagens e botões em uma tela pequena.
- Rolar a lista e conferir o acesso aos filtros e ao botão de voltar ao topo.
- Testar o aviso de falta de conexão e a recuperação quando a conexão voltar.
- Após uma mudança de versão, conferir o fluxo de atualização do PWA.

## Referências

- [Cloudflare — Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
- [Vite — opções do preview](https://vite.dev/config/preview-options)
- [MDN — instalação de PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing)

O preview do Vite e o Quick Tunnel deste guia são usados para desenvolvimento e testes. Uma publicação permanente deve usar hospedagem apropriada e um endereço HTTPS estável.
