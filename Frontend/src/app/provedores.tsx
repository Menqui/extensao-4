import type { ReactNode } from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
} from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import tema from "./tema";

const clienteConsulta = new QueryClient();

interface ProvedoresProps {
  children: ReactNode;
}

export default function Provedores({ children }: ProvedoresProps) {
  return (
    <QueryClientProvider client={clienteConsulta}>
      <ThemeProvider theme={tema}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            [
              "a:focus-visible, " +
              "button:focus-visible, " +
              "input:focus-visible, " +
              "select:focus-visible, " +
              "textarea:focus-visible, " +
              "[tabindex]:focus-visible, " +
              ".MuiButtonBase-root.Mui-focusVisible"
            ]: {
              outline: "3px solid #172B4D",
              outlineOffset: "3px",
            },

            ".MuiAutocomplete-listbox .MuiAutocomplete-option": {
              minHeight: 44,
            },

            ".MuiMenu-list .MuiMenuItem-root": {
              minHeight: 44,
            },

            "@media (prefers-reduced-motion: reduce)": {
              "*, *::before, *::after": {
                animationDuration: "0.01ms !important",
                animationIterationCount: "1 !important",
                transitionDuration: "0.01ms !important",
                scrollBehavior: "auto !important",
              },
            },
          }}
        />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}