import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "../pages/Home";
import WorkPage from "../pages/WorkPage";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "work/:slug", Component: WorkPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
