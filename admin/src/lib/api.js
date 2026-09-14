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

// Sites
export const apiListSites = (token) => request("/sites", { token });
export const apiCreateSite = (data, token) => request("/sites", { method: "POST", body: data, token });
export const apiGetSite = (siteId, token) => request(`/sites/${siteId}`, { token });
export const apiUpdateSite = (siteId, data, token) =>
  request(`/sites/${siteId}`, { method: "PUT", body: data, token });
export const apiDeleteSite = (siteId, token) => request(`/sites/${siteId}`, { method: "DELETE", token });

// Site-gebruikers
export const apiListSiteUsers = (siteId, token) => request(`/sites/${siteId}/users`, { token });
export const apiAddSiteUser = (siteId, data, token) =>
  request(`/sites/${siteId}/users`, { method: "POST", body: data, token });
export const apiUpdateSiteUserRole = (siteId, userId, role, token) =>
  request(`/sites/${siteId}/users/${userId}`, { method: "PUT", body: { role }, token });
export const apiRemoveSiteUser = (siteId, userId, token) =>
  request(`/sites/${siteId}/users/${userId}`, { method: "DELETE", token });

// Thema's
export const apiListThemes = (siteId, token) => request(`/sites/${siteId}/themes`, { token });
export const apiGetTheme = (siteId, id, token) => request(`/sites/${siteId}/themes/${id}`, { token });
export const apiCreateTheme = (siteId, data, token) =>
  request(`/sites/${siteId}/themes`, { method: "POST", body: data, token });
export const apiActivateTheme = (siteId, id, token) =>
  request(`/sites/${siteId}/themes/${id}/activate`, { method: "POST", token });
export const apiCreateTemplate = (siteId, themeId, data, token) =>
  request(`/sites/${siteId}/themes/${themeId}/templates`, { method: "POST", body: data, token });

// Templates
export const apiGetTemplate = (siteId, id, token) => request(`/sites/${siteId}/templates/${id}`, { token });
export const apiUpdateTemplate = (siteId, id, data, token) =>
  request(`/sites/${siteId}/templates/${id}`, { method: "PUT", body: data, token });
export const apiDeleteTemplate = (siteId, id, token) =>
  request(`/sites/${siteId}/templates/${id}`, { method: "DELETE", token });

// Pagina's
export const apiListPages = (siteId, token) => request(`/sites/${siteId}/pages`, { token });
export const apiGetPage = (siteId, id, token) => request(`/sites/${siteId}/pages/${id}`, { token });
export const apiCreatePage = (siteId, data, token) =>
  request(`/sites/${siteId}/pages`, { method: "POST", body: data, token });
export const apiUpdatePage = (siteId, id, data, token) =>
  request(`/sites/${siteId}/pages/${id}`, { method: "PUT", body: data, token });
export const apiDeletePage = (siteId, id, token) =>
  request(`/sites/${siteId}/pages/${id}`, { method: "DELETE", token });

// Posts
export const apiListPosts = (siteId, token) => request(`/sites/${siteId}/posts`, { token });
export const apiGetPost = (siteId, id, token) => request(`/sites/${siteId}/posts/${id}`, { token });
export const apiCreatePost = (siteId, data, token) =>
  request(`/sites/${siteId}/posts`, { method: "POST", body: data, token });
export const apiUpdatePost = (siteId, id, data, token) =>
  request(`/sites/${siteId}/posts/${id}`, { method: "PUT", body: data, token });
export const apiDeletePost = (siteId, id, token) =>
  request(`/sites/${siteId}/posts/${id}`, { method: "DELETE", token });

// Categorieën
export const apiListCategories = (siteId, token) => request(`/sites/${siteId}/categories`, { token });
export const apiCreateCategory = (siteId, data, token) =>
  request(`/sites/${siteId}/categories`, { method: "POST", body: data, token });

// Menu's
export const apiListMenus = (siteId, token) => request(`/sites/${siteId}/menus`, { token });
export const apiGetMenu = (siteId, id, token) => request(`/sites/${siteId}/menus/${id}`, { token });
export const apiCreateMenu = (siteId, data, token) =>
  request(`/sites/${siteId}/menus`, { method: "POST", body: data, token });
export const apiDeleteMenu = (siteId, id, token) =>
  request(`/sites/${siteId}/menus/${id}`, { method: "DELETE", token });
export const apiAddMenuItem = (siteId, menuId, data, token) =>
  request(`/sites/${siteId}/menus/${menuId}/items`, { method: "POST", body: data, token });
export const apiUpdateMenuItem = (siteId, menuId, itemId, data, token) =>
  request(`/sites/${siteId}/menus/${menuId}/items/${itemId}`, { method: "PUT", body: data, token });
export const apiDeleteMenuItem = (siteId, menuId, itemId, token) =>
  request(`/sites/${siteId}/menus/${menuId}/items/${itemId}`, { method: "DELETE", token });
export const apiMoveMenuItem = (siteId, menuId, itemId, direction, token) =>
  request(`/sites/${siteId}/menus/${menuId}/items/${itemId}/move`, {
    method: "POST",
    body: { direction },
    token,
  });

// Instellingen
export const apiGetSettings = (siteId, token) => request(`/sites/${siteId}/settings`, { token });
export const apiUpdateSettings = (siteId, data, token) =>
  request(`/sites/${siteId}/settings`, { method: "PUT", body: data, token });
