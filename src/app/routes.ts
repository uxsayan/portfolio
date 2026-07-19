import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "../pages/Home";
import CaseStudy from "../pages/CaseStudy";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "work/:slug", Component: CaseStudy },
      { path: "*", Component: NotFound },
    ],
  },
]);
