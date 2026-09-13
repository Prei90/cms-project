import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ThemesPage from "./pages/ThemesPage";
import ThemeDetailPage from "./pages/ThemeDetailPage";
import TemplateEditorPage from "./pages/TemplateEditorPage";
import PagesPage from "./pages/PagesPage";
import PageEditorPage from "./pages/PageEditorPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/themes" element={<ThemesPage />} />
              <Route path="/themes/:themeId" element={<ThemeDetailPage />} />
              <Route path="/templates/:templateId/edit" element={<TemplateEditorPage />} />
              <Route path="/pages" element={<PagesPage />} />
              <Route path="/pages/:pageId/edit" element={<PageEditorPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
