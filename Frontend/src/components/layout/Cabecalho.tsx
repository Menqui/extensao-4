import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link, NavLink } from "react-router-dom";

export default function Cabecalho() {
  return (
    <AppBar component="header" position="static" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            py: 1,
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Typography
            component={Link}
            to="/"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "1.25rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              "&:focus-visible": {
                outline: "2px solid currentColor",
                outlineOffset: 4,
              },
            }}
          >
            Explorador ENEM
          </Typography>

          <Box
            component="nav"
            aria-label="Navegação principal"
            sx={{ display: "flex", gap: 1 }}
          >
            <Button
              component={NavLink}
              to="/"
              end
              color="inherit"
              sx={{
                "&.active": {
                  textDecoration: "underline",
                  textUnderlineOffset: "6px",
                },
              }}
            >
              Explorar
            </Button>

            <Button
              component={NavLink}
              to="/como-usar"
              color="inherit"
              sx={{
                "&.active": {
                  textDecoration: "underline",
                  textUnderlineOffset: "6px",
                },
              }}
            >
              Como usar
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}