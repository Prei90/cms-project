import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GrapesEditor from "../components/GrapesEditor";
import { apiGetPost, apiUpdatePost } from "../lib/api";

export default function PostEditorPage() {
  const { siteId, postId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGetPost(siteId, postId, token).then((data) => setPost(data.post));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, postId]);

  async function handleSave({ html, css }) {
    setSaving(true);
    setMessage("");
    try {
      await apiUpdatePost(siteId, postId, { content: { html, css } }, token);
      setMessage("Opgeslagen.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!post) return <p>Laden...</p>;

  return (
    <div>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
        &larr; Terug
      </button>
      <h2>
        {post.title}{" "}
        <span className={`badge ${post.status === "PUBLISHED" ? "badge-active" : ""}`}>
          {post.status}
        </span>
      </h2>
      {message && <p className="info">{message}</p>}
      <GrapesEditor
        initialHtml={(post.content && post.content.html) || ""}
        initialCss={(post.content && post.content.css) || ""}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
