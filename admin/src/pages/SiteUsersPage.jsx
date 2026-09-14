import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiListSiteUsers,
  apiAddSiteUser,
  apiUpdateSiteUserRole,
  apiRemoveSiteUser,
} from "../lib/api";

const ROLES = ["ADMIN", "EDITOR", "AUTHOR"];

export default function SiteUsersPage() {
  const { siteId } = useParams();
  const { token, user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("AUTHOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await apiListSiteUsers(siteId, token);
    setMembers(data.members);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await apiAddSiteUser(siteId, { email, role }, token);
      setEmail("");
      setRole("AUTHOR");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    await apiUpdateSiteUserRole(siteId, userId, newRole, token);
    load();
  }

  async function handleRemove(member) {
    if (!window.confirm(`${member.user.email} verwijderen van deze website?`)) return;
    try {
      await apiRemoveSiteUser(siteId, member.userId, token);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p>Laden...</p>;

  return (
    <div>
      <h2>Gebruikers</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Gebruiker toevoegen</h3>
        <p className="info">
          De gebruiker moet al een account hebben (zelf geregistreerd via de API/inlogscherm)
          voordat je diegene hier kunt toevoegen.
        </p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAdd}>
          <label htmlFor="member-email">E-mailadres</label>
          <input
            className="input"
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="member-role">Rol</label>
          <select className="input" id="member-role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Toevoegen
          </button>
        </form>
      </div>
      <div className="card">
        {members.map((member) => (
          <div className="list-item" key={member.id}>
            <div>
              {member.user.name || member.user.email}{" "}
              <span className="info" style={{ display: "inline", marginBottom: 0 }}>
                ({member.user.email})
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <select
                className="input"
                style={{ marginBottom: 0, width: "auto" }}
                value={member.role}
                onChange={(e) => handleRoleChange(member.userId, e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-danger"
                onClick={() => handleRemove(member)}
                disabled={member.userId === currentUser?.id}
                title={member.userId === currentUser?.id ? "Je kunt jezelf hier niet verwijderen" : ""}
              >
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
