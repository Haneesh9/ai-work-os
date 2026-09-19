const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'API request failed' }));
    throw new Error(errorData.detail || 'API request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/auth/me'),

  // Workspaces
  getWorkspaces: () => fetchAPI('/workspaces/'),
  createWorkspace: (data: any) => fetchAPI('/workspaces/', { method: 'POST', body: JSON.stringify(data) }),

  // Projects
  getProjects: (workspaceId: string) => fetchAPI(`/projects/?workspace_id=${workspaceId}`),
  createProject: (workspaceId: string, data: any) => fetchAPI(`/projects/?workspace_id=${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),

  // Tasks
  getTasks: (workspaceId: string, params: { tab?: string; projectId?: string; status?: string; priority?: string } = {}) => {
    const query = new URLSearchParams({ workspace_id: workspaceId });
    if (params.tab) query.append('tab', params.tab);
    if (params.projectId) query.append('project_id', params.projectId);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    return fetchAPI(`/tasks/?${query.toString()}`);
  },
  createTask: (workspaceId: string, data: any) => fetchAPI(`/tasks/?workspace_id=${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId: string, workspaceId: string, data: any) => fetchAPI(`/tasks/${taskId}?workspace_id=${workspaceId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (taskId: string, workspaceId: string) => fetchAPI(`/tasks/${taskId}?workspace_id=${workspaceId}`, { method: 'DELETE' }),

  // Documents
  getDocuments: (workspaceId: string) => fetchAPI(`/documents/?workspace_id=${workspaceId}`),
  uploadDocument: async (workspaceId: string, file: File) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload?workspace_id=${workspaceId}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Document upload failed');
    return res.json();
  },

  // AI & Approvals
  getPendingApprovals: (workspaceId: string) => fetchAPI(`/ai/approvals?workspace_id=${workspaceId}`),
  actionApproval: (toolCallId: string, workspaceId: string, approval: boolean) =>
    fetchAPI(`/ai/approvals/${toolCallId}/action?workspace_id=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify({ approval }),
    }),
};
