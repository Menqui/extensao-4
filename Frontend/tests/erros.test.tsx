import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ErroRequisicao } from "../src/api/erros";

import {
  listarQuestoes,
  obterQuestao,
} from "../src/api/questoes";

import { EstadoErro } from "../src/components/estados/EstadoErro";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Erros e resultados da API", () => {
  it("retorna 404 para uma questão inexistente", async () => {
    await expect(
      obterQuestao(999999),
    ).rejects.toMatchObject({
      status: 404,
      codigo: "QUESTAO_NAO_ENCONTRADA",
    });
  });

  it("retorna 422 para um tamanho de página inválido", async () => {
    await expect(
      listarQuestoes({ page_size: 51 }),
    ).rejects.toMatchObject({
      status: 422,
      codigo: "PARAMETRO_INVALIDO",
    });
  });

  it("retorna uma lista vazia para filtros sem correspondência", async () => {
    const resultado = await listarQuestoes({
      ano: [2022],
      assunto: ["geometria"],
    });

    expect(resultado.total).toBe(0);
    expect(resultado.itens).toEqual([]);
    expect(resultado.total_paginas).toBe(0);
  });
});

describe("Recuperação na interface", () => {
  it("mostra a mensagem do erro 503 e permite tentar novamente", () => {
    const tentarNovamente = vi.fn();

    const erro = new ErroRequisicao(
      "O serviço está temporariamente indisponível.",
      503,
      "INDISPONIVEL",
    );

    render(
      <EstadoErro
        erro={erro}
        onTentarNovamente={tentarNovamente}
      />,
    );

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(
      "O serviço está temporariamente indisponível.",
    );

    const botao = screen.getByRole("button", {
      name: /^Tentar novamente$/i,
    });

    expect(botao).toBeEnabled();

    fireEvent.click(botao);

    expect(tentarNovamente).toHaveBeenCalledTimes(1);
  });

  it("aguarda o prazo do 429 antes de liberar nova tentativa", () => {
    vi.useFakeTimers();

    const tentarNovamente = vi.fn();

    const erro = new ErroRequisicao(
      "Muitas solicitações. Aguarde para tentar novamente.",
      429,
      "LIMITE_EXCEDIDO",
      Date.now() + 3_000,
    );

    render(
      <EstadoErro
        erro={erro}
        onTentarNovamente={tentarNovamente}
      />,
    );

    const botao = screen.getByRole("button", {
      name: /^Tentar novamente$/i,
    });

    expect(botao).toBeDisabled();

    fireEvent.click(botao);

    expect(tentarNovamente).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(botao).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(botao).toBeEnabled();

    // Encerrar a espera não deve disparar a requisição sozinho.
    expect(tentarNovamente).not.toHaveBeenCalled();

    fireEvent.click(botao);

    expect(tentarNovamente).toHaveBeenCalledTimes(1);
  });
});