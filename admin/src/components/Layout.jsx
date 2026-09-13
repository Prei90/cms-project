import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>CMS Admin</h1>
        <NavLink to="/" end>
          Overzicht
        </NavLink>
        <NavLink to="/themes">Thema's</NavLink>
        <NavLink to="/pages">Pagina's</NavLink>
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
