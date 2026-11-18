import type { components, operations } from "./tipos-gerados";

export type FiltrosDisponiveis =
  components["schemas"]["FiltrosDisponiveis"];

export type Questao = Omit<
  components["schemas"]["Questao"],
  "fonte_url"
> & {
  fonte_url?: string | null;
};

export type ListaQuestoes = Omit<
  components["schemas"]["ListaQuestoes"],
  "itens"
> & {
  itens: Questao[];
};

export type MidiaQuestao =
  components["schemas"]["MidiaQuestao"];

export type Alternativa =
  components["schemas"]["Alternativa"];

export type PedidoResposta =
  components["schemas"]["PedidoResposta"];

export type ResultadoResposta =
  components["schemas"]["ResultadoResposta"];

export type Gabarito =
  components["schemas"]["Gabarito"];

export type ErroApi =
  components["schemas"]["ErroApi"];

export type ParametrosListaQuestoes = NonNullable<
  operations["listarQuestoes"]["parameters"]["query"]
>;