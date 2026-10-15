import { http, HttpResponse } from "msw/http";

import { gabaritosMock } from "./fixtures/gabaritos";
import { questoesMock } from "./fixtures/questoes";

const baseApi = (
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
).replace(/\/+$/, "");

function questaoNaoEncontrada() {
  return HttpResponse.json(
    {
      erro: {
        codigo: "QUESTAO_NAO_ENCONTRADA",
        mensagem: "Questão não encontrada.",
        detalhes: null,
      },
    },
    { status: 404 },
  );
}

function respostaInvalida() {
  return HttpResponse.json(
    {
      erro: {
        codigo: "PARAMETRO_INVALIDO",
        mensagem: "Informe uma alternativa de A a E.",
        detalhes: null,
      },
    },
    { status: 422 },
  );
}

export const handlersRespostas = [
  http.get(`${baseApi}/questoes/:id`, ({ params }) => {
    const id = Number(params.id);

    const questao = questoesMock.find(
      (item) => item.id === id,
    );

    if (!questao) {
      return questaoNaoEncontrada();
    }

    return HttpResponse.json(questao);
  }),

  http.get(
    `${baseApi}/questoes/:id/gabarito`,
    ({ params }) => {
      const id = Number(params.id);
      const gabarito = gabaritosMock.get(id);

      if (!gabarito) {
        return questaoNaoEncontrada();
      }

      return HttpResponse.json({ gabarito });
    },
  ),

  http.post(
    `${baseApi}/questoes/:id/responder`,
    async ({ params, request }) => {
      const id = Number(params.id);
      const gabarito = gabaritosMock.get(id);

      if (!gabarito) {
        return questaoNaoEncontrada();
      }

      let dados: unknown;

      try {
        dados = await request.json();
      } catch {
        return respostaInvalida();
      }

      if (
        typeof dados !== "object" ||
        dados === null ||
        !("alternativa" in dados) ||
        typeof dados.alternativa !== "string" ||
        !["A", "B", "C", "D", "E"].includes(
          dados.alternativa,
        )
      ) {
        return respostaInvalida();
      }

      return HttpResponse.json({
        correta: dados.alternativa === gabarito,
        gabarito,
        resolucao_disponivel: false,
      });
    },
  ),
];