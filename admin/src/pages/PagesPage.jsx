import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiListPages, apiCreatePage, apiUpdatePage, apiDeletePage } from "../lib/api";

export default function PagesPage() {
  const { token } = useAuth();
  const [pages, setPages] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await apiListPages(token);
    setPages(data.pages);
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
      await apiCreatePage({ title, content: { html: "<h1>Nieuwe pagina</h1>" } }, token);
      setTitle("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePublish(page) {
    await apiUpdatePage(
      page.id,
      { status: page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
      token
    );
    load();
  }

  async function handleDelete(page) {
    if (!window.confirm(`Pagina "${page.title}" verwijderen?`)) return;
    await apiDeletePage(page.id, token);
    load();
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div>
      <h2>Pagina's</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuwe pagina</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label htmlFor="page-title">Titel</label>
          <input
            className="input"
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">
            Aanmaken
          </button>
        </form>
      </div>
      <div className="card">
        {pages.length === 0 && <p className="info">Nog geen pagina's.</p>}
        {pages.map((page) => (
          <div className="list-item" key={page.id}>
            <div>
              {page.title} — <code>/{page.slug}</code>{" "}
              <span className={`badge ${page.status === "PUBLISHED" ? "badge-active" : ""}`}>
                {page.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link className="btn" to={`/pages/${page.id}/edit`}>
                Bewerken
              </Link>
              <button className="btn" onClick={() => togglePublish(page)}>
                {page.status === "PUBLISHED" ? "Terug naar concept" : "Publiceren"}
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(page)}>
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
