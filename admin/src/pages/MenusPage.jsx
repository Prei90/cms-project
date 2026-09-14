import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiListMenus, apiCreateMenu, apiDeleteMenu } from "../lib/api";

export default function MenusPage() {
  const { siteId } = useParams();
  const { token } = useAuth();
  const [menus, setMenus] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await apiListMenus(siteId, token);
    setMenus(data.menus);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await apiCreateMenu(siteId, { name }, token);
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(menu) {
    if (!window.confirm(`Menu "${menu.name}" verwijderen?`)) return;
    await apiDeleteMenu(siteId, menu.id, token);
    load();
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div>
      <h2>Menu's</h2>
      <p className="info">
        De publieke site gebruikt automatisch het eerst aangemaakte menu als hoofdnavigatie.
      </p>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuw menu</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label htmlFor="menu-name">Naam</label>
          <input
            className="input"
            id="menu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">
            Aanmaken
          </button>
        </form>
      </div>
      <div className="card">
        {menus.length === 0 && <p className="info">Nog geen menu's.</p>}
        {menus.map((menu) => (
          <div className="list-item" key={menu.id}>
            <div>
              <Link to={`/sites/${siteId}/menus/${menu.id}`}>{menu.name}</Link>{" "}
              <span className="badge">{menu.items.length} items</span>
            </div>
            <button className="btn btn-danger" onClick={() => handleDelete(menu)}>
              Verwijderen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
