import { createTheme } from "@mui/material/styles";

const tema = createTheme({
 palette: {
  mode: "light",

  primary: {
    main: "#166534",
    dark: "#14532D",
    contrastText: "#FFFFFF",
  },

  secondary: {
    main: "#1D4ED8",
    dark: "#1E40AF",
    contrastText: "#FFFFFF",
  },

  background: {
    default: "#F4F7F5",
    paper: "#FFFFFF",
  },

  text: {
    primary: "#17342A",
    secondary: "#52645B",
  },

  success: {
    main: "#15803D",
    dark: "#166534",
    contrastText: "#FFFFFF",
  },

  error: {
    main: "#B91C1C",
    dark: "#991B1B",
    contrastText: "#FFFFFF",
  },

  info: {
    main: "#1D4ED8",
    contrastText: "#FFFFFF",
  },

  divider: "#D8E3DC",
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

  MuiAppBar: {
    defaultProps: {
      color: "primary",
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderBottom: "3px solid #FACC15",
      },
    },
  },

  MuiLink: {
    defaultProps: {
      color: "secondary",
      underline: "hover",
    },
  },
},
});

export default tema;