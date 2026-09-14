import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import SiteLayout from "./components/SiteLayout";
import LoginPage from "./pages/LoginPage";
import SitesPage from "./pages/SitesPage";
import SiteDashboardPage from "./pages/SiteDashboardPage";
import ThemesPage from "./pages/ThemesPage";
import ThemeDetailPage from "./pages/ThemeDetailPage";
import TemplateEditorPage from "./pages/TemplateEditorPage";
import PagesPage from "./pages/PagesPage";
import PageEditorPage from "./pages/PageEditorPage";
import PostsPage from "./pages/PostsPage";
import PostEditorPage from "./pages/PostEditorPage";
import MenusPage from "./pages/MenusPage";
import MenuDetailPage from "./pages/MenuDetailPage";
import SettingsPage from "./pages/SettingsPage";
import SiteUsersPage from "./pages/SiteUsersPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            {/* Simpele toplaag: overzicht van je websites */}
            <Route element={<Layout />}>
              <Route path="/" element={<SitesPage />} />
            </Route>

            {/* Alles binnen een geselecteerde website, met eigen zijbalk */}
            <Route element={<SiteLayout />}>
              <Route path="/sites/:siteId" element={<SiteDashboardPage />} />
              <Route path="/sites/:siteId/themes" element={<ThemesPage />} />
              <Route path="/sites/:siteId/themes/:themeId" element={<ThemeDetailPage />} />
              <Route path="/sites/:siteId/templates/:templateId/edit" element={<TemplateEditorPage />} />
              <Route path="/sites/:siteId/pages" element={<PagesPage />} />
              <Route path="/sites/:siteId/pages/:pageId/edit" element={<PageEditorPage />} />
              <Route path="/sites/:siteId/posts" element={<PostsPage />} />
              <Route path="/sites/:siteId/posts/:postId/edit" element={<PostEditorPage />} />
              <Route path="/sites/:siteId/menus" element={<MenusPage />} />
              <Route path="/sites/:siteId/menus/:menuId" element={<MenuDetailPage />} />
              <Route path="/sites/:siteId/settings" element={<SettingsPage />} />
              <Route path="/sites/:siteId/users" element={<SiteUsersPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
