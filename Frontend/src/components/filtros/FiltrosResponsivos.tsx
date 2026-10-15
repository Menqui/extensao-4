import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";

interface FiltrosResponsivosProps {
  children: ReactNode;
}

export function FiltrosResponsivos({
  children,
}: FiltrosResponsivosProps) {
  const tema = useTheme();

  const desktop = useMediaQuery(
    tema.breakpoints.up("md"),
    { noSsr: true },
  );

  const reduzirMovimento = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  const [aberto, setAberto] = useState(false);

  const id = useId();
  const tituloId = `${id}-titulo`;
  const painelId = `${id}-painel`;

  useEffect(() => {
    if (desktop) {
      setAberto(false);
    }
  }, [desktop]);

  function fechar() {
    setAberto(false);
  }

  if (desktop) {
    return (
      <Box
        component="aside"
        aria-label="Filtros de questões"
        sx={{ minWidth: 0 }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={aberto ? painelId : undefined}
        fullWidth
        sx={{ minHeight: 44 }}
      >
        Filtrar questões
      </Button>

      <Drawer
        anchor="left"
        open={aberto}
        onClose={fechar}
        transitionDuration={reduzirMovimento ? 0 : undefined}
        slotProps={{
          paper: {
            id: painelId,
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": tituloId,
            sx: {
              width: 360,
              maxWidth: "100vw",
            },
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography
              id={tituloId}
              component="h2"
              variant="h6"
            >
              Filtros
            </Typography>

            <IconButton
              aria-label="Fechar filtros"
              onClick={fechar}
              autoFocus
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {children}

          <Button
            variant="contained"
            onClick={fechar}
            fullWidth
            sx={{ minHeight: 44 }}
          >
            Ver questões
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}