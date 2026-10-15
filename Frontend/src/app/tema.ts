import { createTheme } from "@mui/material/styles";

const tema = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1565C0",
    },
    secondary: {
      main: "#00695C",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#172B4D",
      secondary: "#526078",
    },
  },

  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
    },
    body1: {
      lineHeight: 1.7,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
        },
      },
    },
  },
});

export default tema;