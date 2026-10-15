import {
  criarErroHttp,
  ErroRequisicao,
} from "./erros";

function montarUrl(caminho: string): URL {
  const baseConfigurada =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    "/api/v1";

  const baseNormalizada =
    baseConfigurada.replace(/\/+$/, "") + "/";

  const base = new URL(
    baseNormalizada,
    window.location.origin,
  );

  return new URL(
    caminho.replace(/^\/+/, ""),
    base,
  );
}

export async function requisicao<T>(
  caminho: string,
  opcoes: RequestInit = {},
): Promise<T> {
  const cabecalhos = new Headers(opcoes.headers);

  cabecalhos.set("Accept", "application/json");

  let resposta: Response;

  try {
    resposta = await fetch(montarUrl(caminho), {
      ...opcoes,
      headers: cabecalhos,
    });
  } catch (erro: unknown) {
    const foiCancelada =
      opcoes.signal?.aborted ||
      (erro instanceof Error &&
        erro.name === "AbortError");

    if (foiCancelada) {
      throw erro;
    }

    throw new ErroRequisicao(
      "Não foi possível conectar ao serviço. " +
        "Confira sua conexão e tente novamente.",
    );
  }

  const tipoConteudo = (
    resposta.headers.get("Content-Type") ?? ""
  ).toLowerCase();

  const ehJson =
    tipoConteudo.includes("application/json") ||
    tipoConteudo.includes("+json");

  let dados: unknown = null;

  if (ehJson) {
    try {
      dados = await resposta.json();
    } catch {
      if (resposta.ok) {
        throw new ErroRequisicao(
          "O serviço retornou um JSON inválido.",
          resposta.status,
        );
      }
    }
  }

  if (!resposta.ok) {
    throw criarErroHttp(resposta, dados);
  }

  if (!ehJson) {
    throw new ErroRequisicao(
      "O serviço retornou um formato inesperado. " +
        "Confira a configuração da API.",
      resposta.status,
    );
  }

  return dados as T;
}