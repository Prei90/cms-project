import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Simpele toplaag, gebruikt buiten een geselecteerde site (bv. de sitelijst)
export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <strong>CMS Admin</strong>
        <button className="btn" onClick={logout}>
          Uitloggen{user ? ` (${user.name || user.email})` : ""}
        </button>
      </header>
      <Outlet />
    </div>
  );
}
