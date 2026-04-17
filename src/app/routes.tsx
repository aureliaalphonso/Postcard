import { createBrowserRouter, Outlet } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { AlbumPage } from "./pages/AlbumPage";
import { SharePage } from "./pages/SharePage";
import { NotFoundPage } from "./pages/NotFoundPage";

function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      {
        path: "/share/:id",
        Component: SharePage,
      },
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: HomePage },
          { path: "album/:id", Component: AlbumPage },
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
]);