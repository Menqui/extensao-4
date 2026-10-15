import {
  Box,
  Button,
  MenuItem,
  Pagination,
  Stack,
  TextField,
} from "@mui/material";

import type {
  AtualizacaoFiltros,
  EstadoFiltros,
} from "../../lib/parametrosUrl";

interface ControlesListaProps {
  filtros: EstadoFiltros;
  totalPaginas: number;
  onAlterar: (alteracoes: AtualizacaoFiltros) => void;
  onMudarPagina: (pagina: number) => void;
  carregando?: boolean;
}

export function ControlesLista({
  filtros,
  totalPaginas,
  onAlterar,
  onMudarPagina,
  carregando = false,
}: ControlesListaProps) {
  // Inclui o tamanho vindo da URL, mesmo que seja diferente
  // das opções mais comuns.
  const tamanhos = [
    ...new Set([1, 5, 10, 20, 50, filtros.page_size]),
  ].sort((a, b) => a - b);

  const paginaForaDoIntervalo =
    filtros.page > Math.max(1, totalPaginas);

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField
          select
          label="Ordenar por"
          value={filtros.ordem}
          disabled={carregando}
          onChange={(evento) => {
            const ordem = evento.target.value;

            if (
              ordem === "ano_desc" ||
              ordem === "ano_asc" ||
              ordem === "aleatoria"
            ) {
              onAlterar({ ordem });
            }
          }}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <MenuItem value="ano_desc">
            Ano mais recente
          </MenuItem>

          <MenuItem value="ano_asc">
            Ano mais antigo
          </MenuItem>

          <MenuItem value="aleatoria">
            Ordem aleatória
          </MenuItem>
        </TextField>

        <TextField
          select
          label="Questões por página"
          value={filtros.page_size}
          disabled={carregando}
          onChange={(evento) => {
            const tamanho = Number(evento.target.value);

            if (
              Number.isInteger(tamanho) &&
              tamanho >= 1 &&
              tamanho <= 50
            ) {
              onAlterar({ page_size: tamanho });
            }
          }}
          sx={{
            width: { xs: "100%", sm: 190 },
          }}
        >
          {tamanhos.map((tamanho) => (
            <MenuItem key={tamanho} value={tamanho}>
              {tamanho}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {paginaForaDoIntervalo ? (
        <Button
          variant="outlined"
          onClick={() => onMudarPagina(1)}
          disabled={carregando}
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar para a primeira página
        </Button>
      ) : (
        totalPaginas > 1 && (
          <Pagination
            aria-label="Paginação das questões"
            count={totalPaginas}
            page={filtros.page}
            onChange={(_, pagina) => onMudarPagina(pagina)}
            disabled={carregando}
            color="primary"
            shape="rounded"
            siblingCount={0}
            boundaryCount={1}
            getItemAriaLabel={(tipo, pagina, selecionada) => {
              if (tipo === "page") {
                return selecionada
                  ? `Página ${pagina}, atual`
                  : `Ir para a página ${pagina}`;
              }

              if (tipo === "previous") {
                return "Ir para a página anterior";
              }

              if (tipo === "next") {
                return "Ir para a próxima página";
              }

              return "Navegação entre páginas";
            }}
            sx={{
              "& .MuiPagination-ul": {
                flexWrap: "wrap",
                rowGap: 1,
              },
              "& .MuiPaginationItem-root": {
                minWidth: 44,
                height: 44,
              },
            }}
          />
        )
      )}
    </Stack>
  );
}