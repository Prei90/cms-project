import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GrapesEditor from "../components/GrapesEditor";
import { apiGetPage, apiUpdatePage } from "../lib/api";

export default function PageEditorPage() {
  const { pageId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGetPage(pageId, token).then((data) => setPage(data.page));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  async function handleSave({ html, css }) {
    setSaving(true);
    setMessage("");
    try {
      await apiUpdatePage(pageId, { content: { html, css } }, token);
      setMessage("Opgeslagen.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!page) return <p>Laden...</p>;

  return (
    <div>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
        &larr; Terug
      </button>
      <h2>
        {page.title}{" "}
        <span className={`badge ${page.status === "PUBLISHED" ? "badge-active" : ""}`}>
          {page.status}
        </span>
      </h2>
      {message && <p className="info">{message}</p>}
      <GrapesEditor
        initialHtml={(page.content && page.content.html) || ""}
        initialCss={(page.content && page.content.css) || ""}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
