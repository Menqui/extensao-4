import {
  Box,
  Button,
  Pagination,
} from "@mui/material";

import type {
  EstadoFiltros,
} from "../../lib/parametrosUrl";

interface ControlesListaProps {
  filtros: EstadoFiltros;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
  carregando?: boolean;
}

export function ControlesLista({
  filtros,
  totalPaginas,
  onMudarPagina,
  carregando = false,
}: ControlesListaProps) {
  const paginaForaDoIntervalo =
    filtros.page > Math.max(1, totalPaginas);

  if (!paginaForaDoIntervalo && totalPaginas <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        pt: 2,
      }}
    >
      {paginaForaDoIntervalo ? (
        <Button
          variant="outlined"
          onClick={() => onMudarPagina(1)}
          disabled={carregando}
        >
          Voltar para a primeira página
        </Button>
      ) : (
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
              justifyContent: "center",
              flexWrap: "wrap",
              rowGap: 1,
            },
            "& .MuiPaginationItem-root": {
              minWidth: 44,
              height: 44,
            },
          }}
        />
      )}
    </Box>
  );
}