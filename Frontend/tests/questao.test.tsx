import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ListaQuestoes from "../src/components/questoes/ListaQuestoes";
import { questoesMock } from "../src/mocks/fixtures/questoes";

function prepararQuestao() {
  const questao = questoesMock.find((item) => item.id === 1);

  if (!questao) {
    throw new Error("A questão de teste com ID 1 não foi encontrada.");
  }

  const cliente = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  render(
    <QueryClientProvider client={cliente}>
      <ListaQuestoes questoes={[questao]} />
    </QueryClientProvider>,
  );

  return userEvent.setup();
}

describe("Cartão da questão", () => {
  it("permite responder corretamente e tentar novamente", async () => {
    const usuario = prepararQuestao();

    expect(
      screen.getByRole("button", { name: /^Responder$/i }),
    ).toBeDisabled();

    await usuario.click(
    screen.getByRole("radio", { name: /^Alternativa B\b/i })
    );

    await usuario.click(
      screen.getByRole("button", { name: /^Responder$/i }),
    );

    expect(
      await screen.findByText(/Você acertou/i),
    ).toBeInTheDocument();

    for (const alternativa of screen.getAllByRole("radio")) {
      expect(alternativa).toBeDisabled();
    }

    await usuario.click(
      screen.getByRole("button", { name: /^Tentar novamente$/i }),
    );

    for (const alternativa of screen.getAllByRole("radio")) {
      expect(alternativa).toBeEnabled();
      expect(alternativa).not.toBeChecked();
    }

    expect(
      screen.getByRole("button", { name: /^Responder$/i }),
    ).toBeDisabled();
  });

  it("informa o erro e apresenta a resposta correta", async () => {
    const usuario = prepararQuestao();

    await usuario.click(
      screen.getByRole("radio", { name: /^Alternativa A\b/i })
    );

    await usuario.click(
      screen.getByRole("button", { name: /^Responder$/i }),
    );

    const feedback = await screen.findByText(/Você errou/i);

    expect(feedback).toHaveTextContent(/resposta correta.*B/i);

    expect(
      screen.getByRole("radio", { name: /^Alternativa A\b/i })
    ).toBeChecked();
  });

  it("consulta o gabarito sem selecionar uma alternativa", async () => {
    const usuario = prepararQuestao();

    await usuario.click(
      screen.getByRole("button", { name: /^Ver gabarito$/i }),
    );

    expect(
      await screen.findByText(/Gabarito: alternativa B/i),
    ).toBeInTheDocument();

    for (const alternativa of screen.getAllByRole("radio")) {
      expect(alternativa).toBeDisabled();
    }

    expect(
      screen.queryByText(/Você acertou/i),
    ).not.toBeInTheDocument();
  });
});