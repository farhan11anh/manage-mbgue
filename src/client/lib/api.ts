const BASE = '/api';

export interface ApiUser {
  id: number;
  username: string;
  displayName: string;
  isAdmin: number;
  mustChangePassword: number;
}

export interface AdminUser extends ApiUser {
  createdAt: string;
  isApproved: number;
}

export interface WeekSummary {
  weekLabel: string;
  menus: Array<{
    day: string;
    meal: string;
    menuName: string;
    actualMenuName?: string | null;
  }>;
  ingredients: Array<{
    name: string;
    totalQty: number;
    unit: string;
    totalPrice: number;
  }>;
  grandTotal: number;
}

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
    const error = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new Error(error.error || 'Request failed');
  }

  if (res.headers.get('Content-Type')?.includes('spreadsheetml')) {
    return res.blob() as unknown as T;
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    request<{ user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username: string; password: string; displayName: string }) =>
    request<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: ApiUser }>('/auth/me'),
  updateProfile: (data: { displayName: string }) =>
    request<{ user: ApiUser }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword?: string; newPassword: string }) =>
    request<{ message: string; user: ApiUser }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getUsers: () => request<{ users: AdminUser[] }>('/admin/users'),
  approveUser: (userId: number) => request<{ message: string }>(`/admin/approve/${userId}`, { method: 'POST' }),
  rejectUser: (userId: number) => request<{ message: string }>(`/admin/reject/${userId}`, { method: 'POST' }),
  deleteUser: (userId: number) => request<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE' }),
  resetPassword: (userId: number) => request<{ password: string }>(`/admin/reset-password/${userId}`, { method: 'POST' }),
  toggleAdmin: (userId: number) => request<{ message: string; isAdmin: number }>(`/admin/toggle-admin/${userId}`, { method: 'POST' }),

  // Weeks
  getWeeks: () => request<{ weeks: any[] }>('/weeks'),
  createWeek: (data: { startDate: string; endDate: string }) =>
    request('/weeks', { method: 'POST', body: JSON.stringify(data) }),
  getWeek: (id: number) => request<{ week: any; menus: any[] }>(`/weeks/${id}`),
  getCurrentWeek: () => request<{ week: any }>('/weeks/current'),
  getWeekSummary: (weekId: number) => request<WeekSummary>(`/weeks/${weekId}/summary`),

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
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Export gagal' })) as { error?: string };
      throw new Error(error.error || 'Export gagal');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MBG-Rekap.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
};
