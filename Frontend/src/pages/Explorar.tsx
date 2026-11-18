import {
  Alert,
  Box,
  Skeleton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ControlesLista } from "../components/questoes/ControlesLista";
import { PainelFiltros } from "../components/filtros/PainelFiltros";
import ListaQuestoes from "../components/questoes/ListaQuestoes";
import useFiltrosDisponiveis from "../hooks/useFiltrosDisponiveis";
import useFiltrosUrl from "../hooks/useFiltrosUrl";
import useQuestoes from "../hooks/useQuestoes";
import { EstadoErro } from "../components/estados/EstadoErro";
import { FiltrosResponsivos } from "../components/filtros/FiltrosResponsivos";
import { VoltarAoTopo } from "../components/VoltarAoTopo";

export function Explorar() {
  const {
    filtros,
    atualizarFiltros,
    mudarPagina,
    limparFiltros,
  } = useFiltrosUrl();

  const consultaFiltros = useFiltrosDisponiveis();
  const consultaQuestoes = useQuestoes(filtros);

  const usandoMock =
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_MOCK === "true";

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h1">
          Explorar questões
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Encontre questões do ENEM e pratique no seu ritmo.
        </Typography>
      </Box>

      {usandoMock && (
        <Alert severity="info">
          Ambiente de demonstração com questões simuladas.
        </Alert>
      )}

      <Box
        sx={{
          display: {
            xs: "flex",
            md: "grid",
          },
          flexDirection: "column",
          gridTemplateColumns: {
            md: "300px minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: {
            xs: "stretch",
            md: "start",
          },
        }}
      >
        <FiltrosResponsivos>
          {consultaFiltros.isPending && (
            <Box role="status" aria-label="Carregando filtros">
              <Skeleton
                variant="rounded"
                height={420}
                animation={false}
              />
            </Box>
          )}

          {consultaFiltros.isError && (
            <EstadoErro
              erro={consultaFiltros.error}
              onTentarNovamente={() => {
                void consultaFiltros.refetch();
              }}
              carregando={consultaFiltros.isFetching}
            />
          )}

          {consultaFiltros.isSuccess && (
            <PainelFiltros
              dados={consultaFiltros.data}
              filtros={filtros}
              onAlterar={atualizarFiltros}
              onLimpar={limparFiltros}
              carregandoExibicao={
                consultaQuestoes.isFetching ||
                consultaQuestoes.isPlaceholderData
              }
            />
          )}
        </FiltrosResponsivos>

        <Box
          id="resultados-questoes"
          sx={{
            minWidth: 0,
            scrollMarginTop: 88,
          }}
        >
          {consultaQuestoes.isPending && (
            <Stack
              spacing={2}
              role="status"
              aria-label="Carregando questões"
            >
              <Typography>Carregando questões…</Typography>

              <Skeleton
                variant="rounded"
                height={300}
                animation={false}
              />

              <Skeleton
                variant="rounded"
                height={300}
                animation={false}
              />
            </Stack>
          )}

          {consultaQuestoes.isError && (
            <EstadoErro
              erro={consultaQuestoes.error}
              onTentarNovamente={() => {
                void consultaQuestoes.refetch();
              }}
              carregando={consultaQuestoes.isFetching}
            />
          )}

          {consultaQuestoes.isSuccess && (
            <Stack spacing={2}>
              <Typography
                role="status"
                aria-live="polite"
                aria-atomic="true"
                color="text.secondary"
              >
                {consultaQuestoes.isPlaceholderData
                  ? "Atualizando resultados…"
                  : consultaQuestoes.data.total === 1
                    ? "1 questão encontrada"
                    : `${consultaQuestoes.data.total} questões encontradas`}
              </Typography>
              <Box sx={{ minHeight: 4 }}>
                {consultaQuestoes.isFetching && (
                  <LinearProgress aria-label="Atualizando questões" />
                )}
              </Box>
              <Box
                inert={consultaQuestoes.isPlaceholderData}
                aria-busy={consultaQuestoes.isFetching}
                sx={{
                  opacity: consultaQuestoes.isPlaceholderData ? 0.5 : 1,
                }}
              >
                {consultaQuestoes.data.itens.length === 0 ? (
                  <Alert severity="info">
                    {consultaQuestoes.data.total > 0
                      ? "Esta página está vazia. Volte para a primeira página."
                      : "Nenhuma questão encontrada. Tente remover algum filtro."}
                  </Alert>
                ) : (
                  <ListaQuestoes
                    questoes={consultaQuestoes.data.itens}
                  />
                )}
              </Box>
              <ControlesLista
                filtros={filtros}
                totalPaginas={consultaQuestoes.data.total_paginas}
                onMudarPagina={(pagina) => {
                  mudarPagina(pagina);

                  document
                    .getElementById("resultados-questoes")
                    ?.scrollIntoView({
                      block: "start",
                      behavior: "instant",
                    });
                }}
                carregando={
                  consultaQuestoes.isFetching ||
                  consultaQuestoes.isPlaceholderData
                }
              />
            </Stack>
          )}
        </Box>
      </Box>
      <VoltarAoTopo />
    </Stack>
  );
}