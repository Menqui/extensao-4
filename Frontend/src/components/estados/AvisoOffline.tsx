import Alert from "@mui/material/Alert";

interface AvisoOfflineProps {
  visivel: boolean;
}

export default function AvisoOffline({
  visivel,
}: AvisoOfflineProps) {
  if (!visivel) return null;

  return (
    <Alert severity="warning" sx={{ mt: 3 }}>
      Você está offline. Conecte-se para responder
      ou consultar o gabarito.
    </Alert>
  );
}