import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiListThemes, apiCreateTheme, apiActivateTheme } from "../lib/api";

export default function ThemesPage() {
  const { token } = useAuth();
  const [themes, setThemes] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await apiListThemes(token);
    setThemes(data.themes);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await apiCreateTheme({ name }, token);
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleActivate(id) {
    await apiActivateTheme(id, token);
    load();
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div>
      <h2>Thema's</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuw thema</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label htmlFor="theme-name">Naam</label>
          <input
            className="input"
            id="theme-name"
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
        {themes.length === 0 && <p className="info">Nog geen thema's.</p>}
        {themes.map((theme) => (
          <div className="list-item" key={theme.id}>
            <div>
              <Link to={`/themes/${theme.id}`}>{theme.name}</Link>{" "}
              {theme.isActive && <span className="badge badge-active">Actief</span>}
            </div>
            {!theme.isActive && (
              <button className="btn" onClick={() => handleActivate(theme.id)}>
                Activeren
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
