import { BrowserRouter } from "react-router-dom";

import LayoutPrincipal from "../components/layout/LayoutPrincipal";
import Rotas from "./rotas";

export default function App() {
  return (
    <BrowserRouter>
      <LayoutPrincipal>
        <Rotas />
      </LayoutPrincipal>
    </BrowserRouter>
  );
}