import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { createTheme, ThemeProvider } from "@mui/material";

import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  afterAll,
  afterEach,
  beforeAll,
  expect,
  it,
  vi,
} from "vitest";

import {
  MemoryRouter,
  useLocation,
} from "react-router-dom";

import { Explorar } from "../../src/pages/Explorar";

const tema = createTheme();

let cliente: QueryClient | undefined;

// Simula uma tela desktop neste arquivo de teste.
beforeAll(() => {
  vi.stubGlobal(
    "matchMedia",
    (consulta: string): MediaQueryList => ({
      matches: /min-width/.test(consulta),
      media: consulta,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  );
});

afterEach(() => {
  cleanup();
  cliente?.clear();
  cliente = undefined;
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Permite conferir a URL mantida pelo roteador do teste.
function UrlAtual() {
  const localizacao = useLocation();

  return (
    <output aria-label="URL atual">
      {localizacao.search}
    </output>
  );
}

function lerBuscaAtual() {
  const texto = screen.getByLabelText("URL atual").textContent;

  return new URLSearchParams(texto ?? "");
}

it(
  "filtra por ano, pagina, responde e consulta o gabarito",
  async () => {
    const usuario = userEvent.setup();

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

    render(
      <QueryClientProvider client={cliente}>
        <ThemeProvider theme={tema}>
          <MemoryRouter
            initialEntries={[
              "/?page_size=1&ordem=ano_asc",
            ]}
          >
            <Explorar />
            <UrlAtual />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    // Com ordem crescente, a questão de 2022 aparece primeiro.
    expect(
      await screen.findByRole("heading", {
        name: /Questão 1$/i,
      }),
    ).toBeInTheDocument();

    // Seleciona o ano 2023 no filtro.
    await usuario.click(
      await screen.findByRole("combobox", {
        name: /^Anos$/i,
      }),
    );

    await usuario.click(
      await screen.findByRole("option", {
        name: "2023",
      }),
    );

    await usuario.keyboard("{Escape}");

    expect(
      await screen.findByText("2 questões encontradas"),
    ).toBeInTheDocument();

    expect(lerBuscaAtual().getAll("ano")).toEqual(["2023"]);

    // Após filtrar, a navegação começa na página 1.
    expect(
      lerBuscaAtual().get("page") ?? "1",
    ).toBe("1");

    expect(
      await screen.findByRole("heading", {
        name: /Questão 2$/i,
      }),
    ).toBeInTheDocument();

    // Vai para a segunda página dos resultados de 2023.
    const botaoPagina2 = screen.getByRole("button", {
      name: "Ir para a página 2",
    });

    await waitFor(() => {
      expect(botaoPagina2).toBeEnabled();
    });

    await usuario.click(botaoPagina2);

    expect(
      await screen.findByRole("heading", {
        name: /Questão 3$/i,
      }),
    ).toBeInTheDocument();

    expect(lerBuscaAtual().get("page")).toBe("2");
    expect(lerBuscaAtual().getAll("ano")).toEqual(["2023"]);

    // A questão do triângulo tem resposta correta C.
    await usuario.click(
      screen.getByRole("radio", {
        name: /^Alternativa C\b/i,
      }),
    );

    await usuario.click(
      screen.getByRole("button", {
        name: /^Responder$/i,
      }),
    );

    expect(
      await screen.findByText(/Você acertou/i),
    ).toBeInTheDocument();

    // Reinicia o cartão e consulta o gabarito.
    await usuario.click(
      screen.getByRole("button", {
        name: /^Tentar novamente$/i,
      }),
    );

    await usuario.click(
      screen.getByRole("button", {
        name: /^Ver gabarito$/i,
      }),
    );

    expect(
      await screen.findByText(/Gabarito: alternativa C/i),
    ).toBeInTheDocument();
  },
  10_000,
);