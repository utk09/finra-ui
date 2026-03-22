import { Route, Routes } from "react-router";

import { Layout } from "./layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { Trade } from "./pages/Trade";
import { Upload } from "./pages/Upload";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="trade" element={<Trade />} />
        <Route path="upload" element={<Upload />} />
      </Route>
    </Routes>
  );
}
