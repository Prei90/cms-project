import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GrapesEditor from "../components/GrapesEditor";
import { apiGetTemplate, apiUpdateTemplate } from "../lib/api";

export default function TemplateEditorPage() {
  const { siteId, templateId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGetTemplate(siteId, templateId, token).then((data) => setTemplate(data.template));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, templateId]);

  async function handleSave({ html, css }) {
    setSaving(true);
    setMessage("");
    try {
      await apiUpdateTemplate(siteId, templateId, { html, css }, token);
      setMessage("Opgeslagen.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!template) return <p>Laden...</p>;

  return (
    <div>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
        &larr; Terug
      </button>
      <h2>
        {template.name} <span className="badge">{template.type}</span>
      </h2>
      {message && <p className="info">{message}</p>}
      <GrapesEditor
        initialHtml={template.html}
        initialCss={template.css}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
