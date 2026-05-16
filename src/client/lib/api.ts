const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  // Handle blob responses (Excel export)
  if (res.headers.get('Content-Type')?.includes('spreadsheetml')) {
    return res.blob() as unknown as T;
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username: string; password: string; displayName: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: { id: number; username: string; displayName: string } }>('/auth/me'),
  updateProfile: (data: { displayName: string }) =>
    request('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Weeks
  getWeeks: () => request<{ weeks: any[] }>('/weeks'),
  createWeek: (data: { startDate: string; endDate: string }) =>
    request('/weeks', { method: 'POST', body: JSON.stringify(data) }),
  getWeek: (id: number) => request<{ week: any; menus: any[] }>(`/weeks/${id}`),
  getCurrentWeek: () => request<{ week: any }>('/weeks/current'),

  // Menus
  getWeekMenus: (weekId: number) => request<{ menus: any[] }>(`/weeks/${weekId}/menus`),
  createMenu: (weekId: number, data: any) =>
    request(`/weeks/${weekId}/menus`, { method: 'POST', body: JSON.stringify(data) }),
  getMenu: (id: number) => request<{ menu: any }>(`/menus/${id}`),
  updateMenu: (id: number, data: any) =>
    request(`/menus/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMenu: (id: number) => request(`/menus/${id}`, { method: 'DELETE' }),
  updateMenuStatus: (id: number, status: string) =>
    request(`/menus/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  setActualMenu: (id: number, actualMenuName: string) =>
    request(`/menus/${id}/actual`, { method: 'PATCH', body: JSON.stringify({ actualMenuName }) }),

  // Ingredients
  getIngredients: (menuId: number) => request<{ ingredients: any[] }>(`/menus/${menuId}/ingredients`),
  addIngredient: (menuId: number, data: any) =>
    request(`/menus/${menuId}/ingredients`, { method: 'POST', body: JSON.stringify(data) }),
  addActualIngredient: (menuId: number, data: any) =>
    request(`/menus/${menuId}/ingredients`, { method: 'POST', body: JSON.stringify({ ...data, isActual: 1 }) }),
  updateIngredient: (id: number, data: any) =>
    request(`/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIngredient: (id: number) => request(`/ingredients/${id}`, { method: 'DELETE' }),

  // Votes
  vote: (menuId: number, voteType: 'up' | 'down') =>
    request(`/menus/${menuId}/vote`, { method: 'POST', body: JSON.stringify({ voteType }) }),
  getVotes: (menuId: number) => request<{ votes: { up: number; down: number } }>(`/menus/${menuId}/votes`),

  // Comments
  getComments: (menuId: number) => request<{ comments: any[] }>(`/menus/${menuId}/comments`),
  addComment: (menuId: number, content: string) =>
    request(`/menus/${menuId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  replyComment: (commentId: number, content: string) =>
    request(`/comments/${commentId}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
  editComment: (commentId: number, content: string) =>
    request(`/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteComment: (commentId: number) =>
    request(`/comments/${commentId}`, { method: 'DELETE' }),

  // Export
  exportWeek: async (weekId: number) => {
    const res = await fetch(`${BASE}/weeks/${weekId}/export`, { credentials: 'include' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MBG-Rekap.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
