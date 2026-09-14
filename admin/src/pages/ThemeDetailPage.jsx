import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetTheme, apiCreateTemplate } from "../lib/api";

const TYPES = ["HEADER", "FOOTER", "PAGE", "POST", "ARCHIVE"];

export default function ThemeDetailPage() {
  const { siteId, themeId } = useParams();
  const { token } = useAuth();
  const [theme, setTheme] = useState(null);
  const [type, setType] = useState("PAGE");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await apiGetTheme(siteId, themeId, token);
    setTheme(data.theme);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, themeId]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await apiCreateTemplate(
        siteId,
        themeId,
        { type, name, html: "<h1>Nieuwe template</h1>", css: "" },
        token
      );
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!theme) return <p>Laden...</p>;

  return (
    <div>
      <h2>{theme.name}</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuwe template</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label htmlFor="template-type">Type</label>
          <select
            className="input"
            id="template-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label htmlFor="template-name">Naam</label>
          <input
            className="input"
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">
            Toevoegen
          </button>
        </form>
      </div>
      <div className="card">
        {theme.templates.length === 0 && <p className="info">Nog geen templates.</p>}
        {theme.templates.map((tpl) => (
          <div className="list-item" key={tpl.id}>
            <div>
              <span className="badge">{tpl.type}</span> {tpl.name}
            </div>
            <Link className="btn" to={`/sites/${siteId}/templates/${tpl.id}/edit`}>
              Bewerken
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
