import {
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";

import {
    cleanup,
    render,
    screen,
    waitFor,
} from "@testing-library/react";

import { afterEach, describe, expect, it } from "vitest";
import axe from "axe-core";

import ListaQuestoes from "../src/components/questoes/ListaQuestoes";
import { questoesMock } from "../src/mocks/fixtures/questoes";

let cliente: QueryClient | undefined;

afterEach(() => {
    cleanup();
    cliente?.clear();
    cliente = undefined;
});

function renderizarQuestaoComImagem() {
    const questao = questoesMock.find((item) => item.id === 3);

    if (!questao) {
        throw new Error("A questão do triângulo, ID 3, não foi encontrada.");
    }

    cliente = new QueryClient({
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

    return render(
        <QueryClientProvider client={cliente}>
            <ListaQuestoes questoes={[questao]} />
        </QueryClientProvider>,
    );
}
async function aguardarFormula(container: HTMLElement) {
    await waitFor(() => {
        const formula = container.querySelector(
            ".katex-display math",
        );

        expect(formula?.isConnected).toBe(true);

        expect(formula?.namespaceURI).toBe(
            "http://www.w3.org/1998/Math/MathML",
        );

        expect(formula?.textContent).toContain("A");
    });
}
describe("Conteúdo e acessibilidade", () => {
    it("exibe as imagens com descrição e dimensões", async () => {
        renderizarQuestaoComImagem();

        const triangulo = await screen.findByRole("img", {
            name: /Triângulo retângulo com base/i,
        });

        expect(triangulo).toHaveAttribute("width", "360");
        expect(triangulo).toHaveAttribute("height", "240");
        expect(triangulo).toHaveAttribute("loading", "lazy");

        const imagemAlternativa = await screen.findByRole("img", {
            name: /12 centímetros quadrados/i,
        });

        expect(imagemAlternativa).toBeInTheDocument();

        expect(
            screen.getByRole("radio", {
                name: /^Alternativa C\b/i,
            }),
        ).toHaveAccessibleName(/12 centímetros quadrados/i);
    });
    
    it("renderiza a fórmula em bloco com MathML", async () => {
        const { container } = renderizarQuestaoComImagem();

        await aguardarFormula(container);
    });

    it(
        "não apresenta violações nas regras de acessibilidade verificadas",
        async () => {
            const { container } = renderizarQuestaoComImagem();

            // Aguarda o carregamento do KaTeX antes da análise.
            await aguardarFormula(container);

            const resultado = await axe.run(container, {
                runOnly: {
                    type: "tag",
                    values: [
                        "wcag2a",
                        "wcag2aa",
                        "wcag21a",
                        "wcag21aa",
                    ],
                },
                rules: {
                    "color-contrast": {
                        enabled: false,
                    },
                },
            });

            const problemas = resultado.violations.map((violacao) => ({
                regra: violacao.id,
                mensagem: violacao.help,
                elementos: violacao.nodes.map((item) => item.html),
            }));

            expect(problemas).toEqual([]);
        },
        10_000,
    );
});