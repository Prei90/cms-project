const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new Error((data && data.error) || `Er ging iets mis (${res.status}).`);
  }
  return data;
}

// Auth
export const apiLogin = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } });
export const apiMe = (token) => request("/auth/me", { token });

// Thema's
export const apiListThemes = (token) => request("/themes", { token });
export const apiGetTheme = (id, token) => request(`/themes/${id}`, { token });
export const apiCreateTheme = (data, token) =>
  request("/themes", { method: "POST", body: data, token });
export const apiActivateTheme = (id, token) =>
  request(`/themes/${id}/activate`, { method: "POST", token });

// Templates
export const apiGetTemplate = (id, token) => request(`/templates/${id}`, { token });
export const apiCreateTemplate = (themeId, data, token) =>
  request(`/themes/${themeId}/templates`, { method: "POST", body: data, token });
export const apiUpdateTemplate = (id, data, token) =>
  request(`/templates/${id}`, { method: "PUT", body: data, token });
export const apiDeleteTemplate = (id, token) =>
  request(`/templates/${id}`, { method: "DELETE", token });

// Pagina's
export const apiListPages = (token) => request("/pages", { token });
export const apiGetPage = (id, token) => request(`/pages/${id}`, { token });
export const apiCreatePage = (data, token) =>
  request("/pages", { method: "POST", body: data, token });
export const apiUpdatePage = (id, data, token) =>
  request(`/pages/${id}`, { method: "PUT", body: data, token });
export const apiDeletePage = (id, token) =>
  request(`/pages/${id}`, { method: "DELETE", token });
