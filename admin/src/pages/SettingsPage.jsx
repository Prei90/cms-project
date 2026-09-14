import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetSettings, apiUpdateSettings } from "../lib/api";

export default function SettingsPage() {
  const { siteId } = useParams();
  const { token } = useAuth();
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGetSettings(siteId, token).then((data) => {
      setSiteName(data.settings.siteName || "");
      setLogoUrl(data.settings.logoUrl || "");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await apiUpdateSettings(siteId, { siteName, logoUrl: logoUrl || null }, token);
      setMessage("Opgeslagen.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div>
      <h2>Instellingen</h2>
      <div className="card">
        {message && <p className="info">{message}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="site-name">Sitenaam</label>
          <input
            className="input"
            id="site-name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
          />
          <label htmlFor="logo-url">Logo-URL</label>
          <input
            className="input"
            id="logo-url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://.../logo.png"
          />
          <p className="info">
            Upload eerst een afbeelding via de media-upload van de API (of een externe host) en plak hier de URL.
          </p>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </form>
      </div>
    </div>
  );
}
