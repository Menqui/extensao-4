import { HttpResponse } from "msw/http";

type AlvoErro = "filtros" | "questoes";

const prazos = new Map<AlvoErro, number>();

export function simularErroMock(alvo: AlvoErro) {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_USE_MOCK !== "true" ||
    typeof window === "undefined"
  ) {
    return null;
  }

  const parametros = new URLSearchParams(window.location.search);

  const alvoSelecionado =
    parametros.get("mock_alvo") ?? "questoes";

  if (alvoSelecionado !== alvo) {
    return null;
  }

  const cenario = parametros.get("mock_erro");

  if (cenario === "429") {
    const agora = Date.now();

    let prazo = prazos.get(alvo);

    if (prazo === undefined) {
      prazo = agora + 5_000;
      prazos.set(alvo, prazo);
    }

    // Depois da espera, a requisição volta a funcionar.
    if (agora >= prazo) {
      return null;
    }

    const segundos = Math.ceil((prazo - agora) / 1_000);

    return HttpResponse.json(
      {
        erro: {
          codigo: "LIMITE_EXCEDIDO",
          mensagem: "Muitas solicitações. Aguarde para tentar novamente.",
          detalhes: null,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(segundos),
        },
      },
    );
  }

  if (cenario === "500") {
    return HttpResponse.json(
      {
        erro: {
          codigo: "ERRO_INTERNO",
          mensagem: "Não foi possível concluir a solicitação.",
          detalhes: null,
        },
      },
      { status: 500 },
    );
  }

  if (cenario === "503") {
    return HttpResponse.json(
      {
        erro: {
          codigo: "INDISPONIVEL",
          mensagem: "O serviço está temporariamente indisponível.",
          detalhes: null,
        },
      },
      { status: 503 },
    );
  }

  return null;
}