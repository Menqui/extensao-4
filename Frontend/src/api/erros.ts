export class ErroRequisicao extends Error {
  constructor(
    mensagem: string,
    public readonly status: number | null = null,
    public readonly codigo: string | null = null,
    public readonly tentarNovamenteEm: number | null = null,
  ) {
    super(mensagem);
    this.name = "ErroRequisicao";
  }
}

function ehObjeto(
  valor: unknown,
): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function obterPrazoNovaTentativa(
  cabecalho: string | null,
): number | null {
  if (!cabecalho) return null;

  const valor = cabecalho.trim();

  if (/^\d+$/.test(valor)) {
    const segundos = Number(valor);

    if (!Number.isFinite(segundos)) return null;

    return Date.now() + segundos * 1000;
  }

  const data = Date.parse(valor);

  return Number.isNaN(data)
    ? null
    : Math.max(Date.now(), data);
}

export function criarErroHttp(
  resposta: Response,
  dados: unknown,
): ErroRequisicao {
  const mensagens: Record<number, string> = {
    404: "O conteúdo solicitado não foi encontrado.",
    422: "Confira os parâmetros informados.",
    429: "Muitas solicitações. Aguarde para tentar novamente.",
    500: "Ocorreu um erro no servidor.",
    503: "O serviço está temporariamente indisponível.",
  };

  let mensagem =
    mensagens[resposta.status] ??
    "Não foi possível concluir a solicitação.";

  let codigo: string | null = null;

  if (ehObjeto(dados) && ehObjeto(dados.erro)) {
    const erro = dados.erro;

    if (
      typeof erro.mensagem === "string" &&
      erro.mensagem.trim()
    ) {
      mensagem = erro.mensagem;
    }

    if (typeof erro.codigo === "string") {
      codigo = erro.codigo;
    }
  }

  const prazo =
    resposta.status === 429
      ? obterPrazoNovaTentativa(
          resposta.headers.get("Retry-After"),
        )
      : null;

  return new ErroRequisicao(
    mensagem,
    resposta.status,
    codigo,
    prazo,
  );
}