import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SiteLayout() {
  const { siteId } = useParams();
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>CMS Admin</h1>
        <Link
          to="/"
          style={{ color: "var(--color-sidebar-text)", fontSize: "0.8rem", marginBottom: "1rem", padding: "0 0.75rem" }}
        >
          &larr; Wissel van website
        </Link>
        <NavLink to={`/sites/${siteId}`} end>
          Overzicht
        </NavLink>
        <NavLink to={`/sites/${siteId}/themes`}>Thema's</NavLink>
        <NavLink to={`/sites/${siteId}/pages`}>Pagina's</NavLink>
        <NavLink to={`/sites/${siteId}/posts`}>Posts</NavLink>
        <NavLink to={`/sites/${siteId}/menus`}>Menu's</NavLink>
        <NavLink to={`/sites/${siteId}/settings`}>Instellingen</NavLink>
        <NavLink to={`/sites/${siteId}/users`}>Gebruikers</NavLink>
        <button className="logout" onClick={logout}>
          Uitloggen{user ? ` (${user.name || user.email})` : ""}
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
