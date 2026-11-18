import {
  Fab,
  Tooltip,
  useMediaQuery,
  useScrollTrigger,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export function VoltarAoTopo() {
  const mostrar = useScrollTrigger({
    disableHysteresis: true,
    threshold: 400,
  });

  const reduzirMovimento = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  if (!mostrar) {
    return null;
  }

  function voltarAoTopo() {
    window.scrollTo({
      top: 0,
      behavior: reduzirMovimento ? "auto" : "smooth",
    });
  }

  return (
    <Tooltip title="Voltar ao topo">
      <Fab
        type="button"
        color="primary"
        size="medium"
        aria-label="Voltar ao topo da página"
        onClick={voltarAoTopo}
        sx={{
          position: "fixed",
          right: 16,
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          zIndex: (tema) => tema.zIndex.fab,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Tooltip>
  );
}