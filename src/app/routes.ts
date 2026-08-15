import { createBrowserRouter } from "react-router";
import { lazy } from "react";
import Root from "./Root";

const Home = lazy(() => import("../pages/Home"));
const WorkPage = lazy(() => import("../pages/WorkPage"));
const JourneyPage = lazy(() => import("../pages/JourneyPage"));
const NotFound = lazy(() => import("../pages/NotFound"));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "work/:slug", Component: WorkPage },
      { path: "journey", Component: JourneyPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
