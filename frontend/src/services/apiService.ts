import api from './api';
import type { ApiResponse, AuthData, Usuario, Proyecto, Tarea, Comentario, Notificacion, Hito, HistorialEstado } from '../types';

export const authService = {
  login: (correo: string, contrasena: string) =>
    api.post<ApiResponse<AuthData>>('/auth/login', { correo, contrasena }),
  register: (data: { nombre: string; correo: string; contrasena: string; rol?: string }) =>
    api.post<ApiResponse<AuthData>>('/auth/register', data),
  forgotPassword: (correo: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { correo }),
  resetPassword: (token: string, contrasena: string) =>
    api.post<ApiResponse>('/auth/reset-password', { token, contrasena }),
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', { refreshToken }),
  logout: () => api.post<ApiResponse>('/auth/logout'),
};

export const usuarioService = {
  getAll: (page = 1, limit = 20) => api.get<ApiResponse<Usuario[]>>(`/users?page=${page}&limit=${limit}`),
  getAllActive: () => api.get<ApiResponse<Usuario[]>>('/users/all'),
  buscar: (q: string) => api.get<ApiResponse<Usuario[]>>(`/users/buscar?q=${encodeURIComponent(q)}`),
  update: (id: string, data: Partial<Usuario>) => api.put<ApiResponse<Usuario>>(`/users/${id}`, data),
  changePassword: (id: string, contrasenaActual: string, contrasenaNueva: string) =>
    api.put<ApiResponse>(`/users/${id}/change-password`, { contrasenaActual, contrasenaNueva }),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put<ApiResponse<Usuario>>(`/users/${id}/avatar`, formData);
  },
  updateUbicacion: (id: string, lat: number, lng: number) =>
    api.put<ApiResponse>(`/users/${id}/ubicacion`, { lat, lng }),
  noMolestar: (id: string, data: { activo: boolean; inicio?: string; fin?: string }) =>
    api.patch<ApiResponse>(`/cuenta/${id}/no-molestar`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/users/${id}`),
};

export const proyectoService = {
  getAll: (page = 1, limit = 20) => api.get<ApiResponse<Proyecto[]> & { total: number; page: number; limit: number; totalPages: number }>(`/projects?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get<ApiResponse<Proyecto>>(`/projects/${id}`),
  create: (data: any) => api.post<ApiResponse<Proyecto>>('/projects', data),
  update: (id: string, data: any) => api.put<ApiResponse<Proyecto>>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/projects/${id}`),
  addMember: (id: string, usuarioId: string) => api.post<ApiResponse>(`/projects/${id}/miembros`, { usuarioId }),
  removeMember: (id: string, usuarioId: string) => api.delete<ApiResponse>(`/projects/${id}/miembros/${usuarioId}`),
  createHito: (id: string, data: Partial<Hito>) => api.post<ApiResponse<Hito>>(`/projects/${id}/hitos`, data),
  updateHito: (id: string, hitoId: string, data: Partial<Hito>) => api.put<ApiResponse<Hito>>(`/projects/${id}/hitos/${hitoId}`, data),
  deleteHito: (id: string, hitoId: string) => api.delete<ApiResponse>(`/projects/${id}/hitos/${hitoId}`),
};

export const tareaService = {
  getByProyecto: (proyectoId: string) => api.get<ApiResponse<Tarea[]>>(`/tasks/proyecto/${proyectoId}`),
  getMyTasks: () => api.get<ApiResponse<Tarea[]>>('/tasks/mis-tareas'),
  getById: (id: string) => api.get<ApiResponse<Tarea>>(`/tasks/${id}`),
  create: (proyectoId: string, data: Partial<Tarea>) => api.post<ApiResponse<Tarea>>(`/tasks/proyecto/${proyectoId}`, data),
  update: (id: string, data: Partial<Tarea>) => api.put<ApiResponse<Tarea>>(`/tasks/${id}`, data),
  changeEstado: (id: string, estado: string, extra?: { lat?: number; lng?: number }) =>
    api.patch<ApiResponse<Tarea>>(`/tasks/${id}/estado`, { estado, ...extra }),
  reorder: (tareas: { id: string; estado: string; orden: number }[]) => api.patch<ApiResponse>('/tasks/reorder/bulk', { tareas }),
  assign: (id: string, usuarioId: string) => api.post<ApiResponse<Tarea>>(`/tasks/${id}/asignar`, { usuarioId }),
  uploadEvidencia: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    return api.post<ApiResponse<Tarea>>(`/tasks/${id}/evidencia`, formData);
  },
  delete: (id: string) => api.delete<ApiResponse>(`/tasks/${id}`),
};

export const subtareaService = {
  create: (tareaId: string, titulo: string) => api.post<ApiResponse<any>>(`/tasks/${tareaId}/subtareas`, { titulo }),
  update: (subId: string, completada: boolean) => api.put<ApiResponse<any>>(`/tasks/subtareas/${subId}`, { completada }),
  delete: (subId: string) => api.delete<ApiResponse>(`/tasks/subtareas/${subId}`),
};

export const comentarioService = {
  getByTarea: (tareaId: string) => api.get<ApiResponse<Comentario[]>>(`/comments/tarea/${tareaId}`),
  create: (tareaId: string, contenido: string) => api.post<ApiResponse<Comentario>>(`/comments/tarea/${tareaId}`, { contenido }),
  update: (id: string, contenido: string) => api.put<ApiResponse<Comentario>>(`/comments/${id}`, { contenido }),
  delete: (id: string) => api.delete<ApiResponse>(`/comments/${id}`),
};

export const archivoService = {
  upload: (tareaId: string, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    return api.post<ApiResponse>(`/files/tarea/${tareaId}`, formData);
  },
  getDownloadUrl: (id: string) => `/api/files/${id}/download`,
  delete: (id: string) => api.delete<ApiResponse>(`/files/${id}`),
};

export const notificacionService = {
  getAll: (page = 1, limit = 20) => api.get<ApiResponse<{ notificaciones: Notificacion[]; noLeidas: number }>>(`/notifications?page=${page}&limit=${limit}`),
  markRead: (id: string) => api.patch<ApiResponse>(`/notifications/${id}/leer`),
  markAllRead: () => api.patch<ApiResponse>('/notifications/leer-todas'),
};

export const reporteService = {
  getDatos: (proyectoId: string) => api.get<ApiResponse>(`/reports/datos/${proyectoId}`),
  downloadPDF: (proyectoId: string) => api.get(`/reports/proyecto/${proyectoId}`, { responseType: 'blob' }),
};

export const archivoProyectoService = {
  getByProyecto: (proyectoId: string) => api.get<ApiResponse>(`/project-files/proyecto/${proyectoId}`),
  upload: (proyectoId: string, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    return api.post<ApiResponse>(`/project-files/proyecto/${proyectoId}`, formData);
  },
  getDownloadUrl: (id: string) => `/api/project-files/${id}/download`,
  delete: (id: string) => api.delete<ApiResponse>(`/project-files/${id}`),
};

export const historialService = {
  getByTarea: (tareaId: string) => api.get<ApiResponse<HistorialEstado[]>>(`/history/tarea/${tareaId}`),
};

export const actividadService = {
  getAll: (page = 1, limit = 20) => api.get(`/activity?page=${page}&limit=${limit}`),
};

export const calendarioService = {
  getMes: (mes: string) => api.get(`/calendar?mes=${mes}`),
};

export const chatService = {
  getMensajes: (proyectoId: string, page = 1, limit = 50) => 
    api.get(`/chat/proyecto/${proyectoId}?page=${page}&limit=${limit}`),
  enviarMensaje: (proyectoId: string, contenido: string) =>
    api.post(`/chat/proyecto/${proyectoId}`, { contenido }),
  editarMensaje: (id: string, contenido: string) =>
    api.put(`/chat/${id}`, { contenido }),
  eliminarMensaje: (id: string) =>
    api.delete(`/chat/${id}`),
};

export const verificacionService = {
  enviar: (correo: string) => api.get(`/verification/enviar?correo=${encodeURIComponent(correo)}`),
};
