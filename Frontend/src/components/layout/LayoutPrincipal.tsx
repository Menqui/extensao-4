import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import Cabecalho from "./Cabecalho";
import Rodape from "./Rodape";

interface LayoutPrincipalProps {
  children: ReactNode;
}

export default function LayoutPrincipal({
  children,
}: LayoutPrincipalProps) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        component="a"
        href="#conteudo-principal"
        sx={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 2000,
          transform: "translateY(-200%)",
          bgcolor: "background.paper",
          color: "text.primary",
          p: 2,
          borderRadius: 1,
          "&:focus": {
            transform: "translateY(0)",
            outline: "3px solid",
            outlineColor: "primary.main",
          },
        }}
      >
        Ir para o conteúdo
      </Box>

      <Cabecalho />

      <Container
        component="main"
        id="conteudo-principal"
        tabIndex={-1}
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: { xs: 3, md: 5 },
        }}
      >
        {children}
      </Container>

      <Rodape />
    </Box>
  );
}