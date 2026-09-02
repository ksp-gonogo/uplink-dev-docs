// #region main
import { createRoot } from "react-dom/client";
import { ExampleWidget } from "./ExampleWidget";
import { SitrepStream } from "./stream";
import { KitProvider } from "./ui/Provider";

const stream = new SitrepStream("ws://localhost:8090");

createRoot(document.getElementById("root")!).render(
  <KitProvider>
    <ExampleWidget stream={stream} />
  </KitProvider>,
);
// #endregion main
