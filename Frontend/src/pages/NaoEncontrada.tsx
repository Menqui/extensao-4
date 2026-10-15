import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";

export default function NaoEncontrada() {
  return (
    <>
      <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
        Página não encontrada
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        O endereço acessado não corresponde a uma página do site.
      </Typography>

      <Button component={Link} to="/" variant="contained">
        Voltar para Explorar
      </Button>
    </>
  );
}