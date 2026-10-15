import { http, HttpResponse } from "msw/http";

import { filtrosMock } from "./fixtures/filtros";
import { handlersRespostas } from "./handlersRespostas";
import { processarQuestoesMock } from "./processarQuestoes";
import { simularErroMock } from "./simularErro";

const base = (
  import.meta.env.VITE_API_BASE_URL?.trim() || "/api/v1"
).replace(/\/+$/, "");

export const handlers = [
  http.get(`${base}/meta/filtros`, () => {
    const erro = simularErroMock("filtros");

    if (erro) {
      return erro;
    }

    return HttpResponse.json(filtrosMock);
  }),

  http.get(`${base}/questoes`, ({ request }) => {
    const erro = simularErroMock("questoes");

    if (erro) {
      return erro;
    }

    const url = new URL(request.url);
    const resultado = processarQuestoesMock(url.searchParams);

    if (!resultado.ok) {
      return HttpResponse.json(
        {
          erro: {
            codigo: "PARAMETRO_INVALIDO",
            mensagem: resultado.mensagem,
            detalhes: null,
          },
        },
        { status: 422 },
      );
    }

    return HttpResponse.json(resultado.dados);
  }),

  ...handlersRespostas,
];