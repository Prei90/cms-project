import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiListPosts,
  apiCreatePost,
  apiUpdatePost,
  apiDeletePost,
  apiListCategories,
  apiCreateCategory,
} from "../lib/api";

export default function PostsPage() {
  const { siteId } = useParams();
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [postsData, categoriesData] = await Promise.all([
      apiListPosts(siteId, token),
      apiListCategories(siteId, token),
    ]);
    setPosts(postsData.posts);
    setCategories(categoriesData.categories);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await apiCreatePost(
        siteId,
        { title, categoryId: categoryId || null, content: { html: "<h1>Nieuw artikel</h1>" } },
        token
      );
      setTitle("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    setError("");
    try {
      await apiCreateCategory(siteId, { name: newCategory }, token);
      setNewCategory("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePublish(post) {
    await apiUpdatePost(siteId, post.id, { status: post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }, token);
    load();
  }

  async function handleDelete(post) {
    if (!window.confirm(`Artikel "${post.title}" verwijderen?`)) return;
    await apiDeletePost(siteId, post.id, token);
    load();
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div>
      <h2>Posts</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuw artikel</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label htmlFor="post-title">Titel</label>
          <input
            className="input"
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <label htmlFor="post-category">Categorie (optioneel)</label>
          <select
            className="input"
            id="post-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Geen categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Aanmaken
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nieuwe categorie</h3>
        <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="new-category">Naam</label>
            <input
              className="input"
              id="new-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
              style={{ marginBottom: 0 }}
            />
          </div>
          <button className="btn" type="submit">
            Toevoegen
          </button>
        </form>
      </div>

      <div className="card">
        {posts.length === 0 && <p className="info">Nog geen artikelen.</p>}
        {posts.map((post) => (
          <div className="list-item" key={post.id}>
            <div>
              {post.title} — <code>/blog/{post.slug}</code>{" "}
              <span className={`badge ${post.status === "PUBLISHED" ? "badge-active" : ""}`}>
                {post.status}
              </span>{" "}
              {post.category && <span className="badge">{post.category.name}</span>}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link className="btn" to={`/sites/${siteId}/posts/${post.id}/edit`}>
                Bewerken
              </Link>
              <button className="btn" onClick={() => togglePublish(post)}>
                {post.status === "PUBLISHED" ? "Terug naar concept" : "Publiceren"}
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(post)}>
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
