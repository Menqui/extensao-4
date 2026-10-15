import type {
  ParametrosListaQuestoes,
} from "../api/tipos";

export type EstadoFiltros =
  Required<
    Omit<ParametrosListaQuestoes, "semente">
  > &
  Pick<ParametrosListaQuestoes, "semente">;

export type AtualizacaoFiltros =
  Partial<Omit<EstadoFiltros, "page">>;

const ordens: EstadoFiltros["ordem"][] = [
  "ano_desc",
  "ano_asc",
  "aleatoria",
];

function lerInteiro(
  valor: string | null,
): number | undefined {
  if (
    valor === null ||
    !/^[+-]?\d+$/.test(valor.trim())
  ) {
    return undefined;
  }

  const numero = Number(valor);

  return Number.isSafeInteger(numero)
    ? numero
    : undefined;
}

function lerValores(
  busca: URLSearchParams,
  nome: string,
): string[] {
  return [
    ...new Set(
      busca
        .getAll(nome)
        .map((valor) => valor.trim())
        .filter(Boolean),
    ),
  ];
}

export function lerFiltrosUrl(
  busca: URLSearchParams,
): EstadoFiltros {
  const anos = lerValores(busca, "ano")
    .map((valor) => lerInteiro(valor))
    .filter(
      (valor): valor is number =>
        valor !== undefined,
    );

  const ordem =
    ordens.find(
      (item) => item === busca.get("ordem"),
    ) ?? "ano_desc";

  const pagina = lerInteiro(busca.get("page"));

  const tamanho = lerInteiro(
    busca.get("page_size"),
  );

  return {
    ano: [...new Set(anos)],
    area: lerValores(busca, "area"),
    assunto: lerValores(busca, "assunto"),
    aplicacao: lerValores(busca, "aplicacao"),

    incluir_anuladas:
      busca.get("incluir_anuladas") === "true",

    ordem,

    semente:
      ordem === "aleatoria"
        ? lerInteiro(busca.get("semente"))
        : undefined,

    page:
      pagina !== undefined && pagina >= 1
        ? pagina
        : 1,

    page_size:
      tamanho !== undefined &&
      tamanho >= 1 &&
      tamanho <= 50
        ? tamanho
        : 10,
  };
}

export function escreverFiltrosUrl(
  filtros: EstadoFiltros,
): URLSearchParams {
  const busca = new URLSearchParams();

  const camposMultiplos = [
    "ano",
    "area",
    "assunto",
    "aplicacao",
  ] as const;

  for (const campo of camposMultiplos) {
    for (const valor of filtros[campo]) {
      busca.append(campo, String(valor));
    }
  }

  if (filtros.incluir_anuladas) {
    busca.set("incluir_anuladas", "true");
  }

  if (filtros.ordem !== "ano_desc") {
    busca.set("ordem", filtros.ordem);
  }

  if (
    filtros.ordem === "aleatoria" &&
    filtros.semente !== undefined
  ) {
    busca.set(
      "semente",
      String(filtros.semente),
    );
  }

  if (filtros.page !== 1) {
    busca.set("page", String(filtros.page));
  }

  if (filtros.page_size !== 10) {
    busca.set(
      "page_size",
      String(filtros.page_size),
    );
  }

  return busca;
}

export function gerarSemente(): number {
  return Math.floor(
    Math.random() * 2_147_483_647,
  );
}