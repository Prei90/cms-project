import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetSite } from "../lib/api";

export default function SiteDashboardPage() {
  const { siteId } = useParams();
  const { token } = useAuth();
  const [site, setSite] = useState(null);

  useEffect(() => {
    apiGetSite(siteId, token).then((data) => setSite(data.site));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  if (!site) return <p>Laden...</p>;

  return (
    <div>
      <h2>{site.name}</h2>
      <p className="info">
        Domein: <code>{site.domain}</code> — jouw rol op deze website: <span className="badge">{site.myRole}</span>
      </p>
      <div className="card">
        <p>Kies links een onderdeel om te beheren.</p>
        <p style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link className="btn" to={`/sites/${siteId}/themes`}>Thema's</Link>
          <Link className="btn" to={`/sites/${siteId}/pages`}>Pagina's</Link>
          <Link className="btn" to={`/sites/${siteId}/posts`}>Posts</Link>
          <Link className="btn" to={`/sites/${siteId}/menus`}>Menu's</Link>
          <Link className="btn" to={`/sites/${siteId}/settings`}>Instellingen</Link>
          <Link className="btn" to={`/sites/${siteId}/users`}>Gebruikers</Link>
        </p>
      </div>
    </div>
  );
}
