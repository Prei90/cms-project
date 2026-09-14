import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiListSites, apiCreateSite } from "../lib/api";

export default function SitesPage() {
  const { token } = useAuth();
  const [sites, setSites] = useState([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await apiListSites(token);
    setSites(data.sites);
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
      await apiCreateSite({ name, domain }, token);
      setName("");
      setDomain("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div className="main" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2>Jouw websites</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuwe website</h3>
        <p className="info">
          Je wordt automatisch ADMIN van de website die je aanmaakt. Vul het domein in zonder
          "https://", bv. <code>mijnsite.nl</code>.
        </p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label htmlFor="site-name">Naam</label>
          <input
            className="input"
            id="site-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label htmlFor="site-domain">Domein</label>
          <input
            className="input"
            id="site-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="mijnsite.nl"
            required
          />
          <button className="btn btn-primary" type="submit">
            Aanmaken
          </button>
        </form>
      </div>
      <div className="card">
        {sites.length === 0 && <p className="info">Je hebt nog geen websites. Maak er hierboven een aan.</p>}
        {sites.map((site) => (
          <div className="list-item" key={site.id}>
            <div>
              <Link to={`/sites/${site.id}`}>{site.name}</Link> — <code>{site.domain}</code>
            </div>
            <span className="badge">{site.myRole}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
