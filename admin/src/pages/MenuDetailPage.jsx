import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetMenu,
  apiAddMenuItem,
  apiDeleteMenuItem,
  apiMoveMenuItem,
  apiListPages,
} from "../lib/api";

export default function MenuDetailPage() {
  const { siteId, menuId } = useParams();
  const { token } = useAuth();
  const [menu, setMenu] = useState(null);
  const [pages, setPages] = useState([]);
  const [label, setLabel] = useState("");
  const [linkType, setLinkType] = useState("page"); // "page" of "url"
  const [pageId, setPageId] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [menuData, pagesData] = await Promise.all([
      apiGetMenu(siteId, menuId, token),
      apiListPages(siteId, token),
    ]);
    setMenu(menuData.menu);
    setPages(pagesData.pages);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, menuId]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await apiAddMenuItem(
        siteId,
        menuId,
        linkType === "page" ? { label, pageId } : { label, url },
        token
      );
      setLabel("");
      setUrl("");
      setPageId("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMove(itemId, direction) {
    await apiMoveMenuItem(siteId, menuId, itemId, direction, token);
    load();
  }

  async function handleDelete(itemId) {
    await apiDeleteMenuItem(siteId, menuId, itemId, token);
    load();
  }

  if (!menu) return <p>Laden...</p>;

  return (
    <div>
      <h2>{menu.name}</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Item toevoegen</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAdd}>
          <label htmlFor="item-label">Label</label>
          <input
            className="input"
            id="item-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <label htmlFor="link-type">Link naar</label>
          <select
            className="input"
            id="link-type"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
          >
            <option value="page">Een pagina</option>
            <option value="url">Een los adres (URL)</option>
          </select>
          {linkType === "page" ? (
            <>
              <label htmlFor="item-page">Pagina</label>
              <select
                className="input"
                id="item-page"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                required
              >
                <option value="">Kies een pagina...</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (/{p.slug})
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label htmlFor="item-url">URL</label>
              <input
                className="input"
                id="item-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/blog of https://externe-link.nl"
                required
              />
            </>
          )}
          <button className="btn btn-primary" type="submit">
            Toevoegen
          </button>
        </form>
      </div>
      <div className="card">
        {menu.items.length === 0 && <p className="info">Nog geen items in dit menu.</p>}
        {menu.items.map((item, index) => (
          <div className="list-item" key={item.id}>
            <div>
              {item.label} — <code>{item.page ? `/${item.page.slug}` : item.url}</code>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button className="btn" disabled={index === 0} onClick={() => handleMove(item.id, "up")}>
                ↑
              </button>
              <button
                className="btn"
                disabled={index === menu.items.length - 1}
                onClick={() => handleMove(item.id, "down")}
              >
                ↓
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
