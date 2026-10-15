import { describe, expect, it } from "vitest";

import {
  escreverFiltrosUrl,
  lerFiltrosUrl,
} from "../src/lib/parametrosUrl";

describe("Filtros na URL", () => {
  it("lê vários anos e assuntos sem perder as seleções", () => {
    const busca = new URLSearchParams(
      "ano=2022&ano=2023" +
        "&area=matematica" +
        "&assunto=geometria&assunto=probabilidade" +
        "&aplicacao=regular" +
        "&incluir_anuladas=true",
    );

    const filtros = lerFiltrosUrl(busca);

    expect(filtros.ano).toEqual([2022, 2023]);
    expect(filtros.area).toEqual(["matematica"]);

    expect(filtros.assunto).toEqual([
      "geometria",
      "probabilidade",
    ]);

    expect(filtros.aplicacao).toEqual(["regular"]);
    expect(filtros.incluir_anuladas).toBe(true);
  });

  it("escreve seleções múltiplas como parâmetros repetidos", () => {
    const filtros = lerFiltrosUrl(
      new URLSearchParams(
        "ano=2022&ano=2023" +
          "&assunto=geometria&assunto=probabilidade",
      ),
    );

    const busca = escreverFiltrosUrl(filtros);

    expect(busca.getAll("ano")).toEqual(["2022", "2023"]);

    expect(busca.getAll("assunto")).toEqual([
      "geometria",
      "probabilidade",
    ]);
  });

  it("trata números e ordenação inválidos recebidos pela URL", () => {
    const filtros = lerFiltrosUrl(
      new URLSearchParams(
        "ano=abc&ano=2023" +
          "&page=0&page_size=99&ordem=desconhecida",
      ),
    );

    expect(filtros.ano).toEqual([2023]);
    expect(filtros.page).toBe(1);
    expect(filtros.page_size).toBe(10);
    expect(filtros.ordem).toBe("ano_desc");
  });

  it("preserva a semente aleatória ao mudar de página", () => {
    const filtros = lerFiltrosUrl(
      new URLSearchParams(
        "ordem=aleatoria&semente=42&page_size=1",
      ),
    );

    const proximaPagina = escreverFiltrosUrl({
      ...filtros,
      page: 2,
    });

    expect(proximaPagina.get("ordem")).toBe("aleatoria");
    expect(proximaPagina.get("semente")).toBe("42");
    expect(proximaPagina.get("page")).toBe("2");
    expect(proximaPagina.get("page_size")).toBe("1");
  });

  it("remove a semente quando a ordenação não é aleatória", () => {
    const filtros = lerFiltrosUrl(
      new URLSearchParams("ordem=ano_asc&semente=42"),
    );

    const busca = escreverFiltrosUrl(filtros);

    expect(filtros.ordem).toBe("ano_asc");
    expect(busca.has("semente")).toBe(false);
  });
});