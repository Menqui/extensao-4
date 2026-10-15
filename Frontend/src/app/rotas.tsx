import { Route, Routes } from "react-router-dom";

import {Explorar} from "../pages/Explorar";
import ComoUsar from "../pages/ComoUsar";
import NaoEncontrada from "../pages/NaoEncontrada";

export default function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Explorar />} />
      <Route path="/como-usar" element={<ComoUsar />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}