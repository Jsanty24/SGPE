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
  getAll: (page = 1, limit = 20) => api.get<ApiResponse<Usuario[]>>(`/usuarios?page=${page}&limit=${limit}`),
  getAllActive: () => api.get<ApiResponse<Usuario[]>>('/usuarios/all'),
  buscar: (q: string) => api.get<ApiResponse<Usuario[]>>(`/usuarios/buscar?q=${encodeURIComponent(q)}`),
  update: (id: string, data: Partial<Usuario>) => api.put<ApiResponse<Usuario>>(`/usuarios/${id}`, data),
  changePassword: (id: string, contrasenaActual: string, contrasenaNueva: string) =>
    api.put<ApiResponse>(`/usuarios/${id}/change-password`, { contrasenaActual, contrasenaNueva }),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put<ApiResponse<Usuario>>(`/usuarios/${id}/avatar`, formData);
  },
  updateUbicacion: (id: string, lat: number, lng: number) =>
    api.put<ApiResponse>(`/usuarios/${id}/ubicacion`, { lat, lng }),
  noMolestar: (id: string, data: { activo: boolean; inicio?: string; fin?: string }) =>
    api.patch<ApiResponse>(`/cuenta/${id}/no-molestar`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/usuarios/${id}`),
};

export const proyectoService = {
  getAll: (page = 1, limit = 20) => api.get<ApiResponse<Proyecto[]> & { total: number; page: number; limit: number; totalPages: number }>(`/proyectos?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get<ApiResponse<Proyecto>>(`/proyectos/${id}`),
  create: (data: any) => api.post<ApiResponse<Proyecto>>('/proyectos', data),
  update: (id: string, data: any) => api.put<ApiResponse<Proyecto>>(`/proyectos/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/proyectos/${id}`),
  addMember: (id: string, usuarioId: string) => api.post<ApiResponse>(`/proyectos/${id}/miembros`, { usuarioId }),
  removeMember: (id: string, usuarioId: string) => api.delete<ApiResponse>(`/proyectos/${id}/miembros/${usuarioId}`),
  createHito: (id: string, data: Partial<Hito>) => api.post<ApiResponse<Hito>>(`/proyectos/${id}/hitos`, data),
  updateHito: (id: string, hitoId: string, data: Partial<Hito>) => api.put<ApiResponse<Hito>>(`/proyectos/${id}/hitos/${hitoId}`, data),
  deleteHito: (id: string, hitoId: string) => api.delete<ApiResponse>(`/proyectos/${id}/hitos/${hitoId}`),
};

export const tareaService = {
  getByProyecto: (proyectoId: string) => api.get<ApiResponse<Tarea[]>>(`/tareas/proyecto/${proyectoId}`),
  getMyTasks: () => api.get<ApiResponse<Tarea[]>>('/tareas/mis-tareas'),
  getById: (id: string) => api.get<ApiResponse<Tarea>>(`/tareas/${id}`),
  create: (proyectoId: string, data: Partial<Tarea>) => api.post<ApiResponse<Tarea>>(`/tareas/proyecto/${proyectoId}`, data),
  update: (id: string, data: Partial<Tarea>) => api.put<ApiResponse<Tarea>>(`/tareas/${id}`, data),
  changeEstado: (id: string, estado: string, extra?: { lat?: number; lng?: number }) =>
    api.patch<ApiResponse<Tarea>>(`/tareas/${id}/estado`, { estado, ...extra }),
  reorder: (tareas: { id: string; estado: string; orden: number }[]) => api.patch<ApiResponse>('/tareas/reorder/bulk', { tareas }),
  assign: (id: string, usuarioId: string) => api.post<ApiResponse<Tarea>>(`/tareas/${id}/asignar`, { usuarioId }),
  uploadEvidencia: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    return api.post<ApiResponse<Tarea>>(`/tareas/${id}/evidencia`, formData);
  },
  delete: (id: string) => api.delete<ApiResponse>(`/tareas/${id}`),
};

export const subtareaService = {
  create: (tareaId: string, titulo: string) => api.post<ApiResponse<any>>(`/tareas/${tareaId}/subtareas`, { titulo }),
  update: (subId: string, completada: boolean) => api.put<ApiResponse<any>>(`/tareas/subtareas/${subId}`, { completada }),
  delete: (subId: string) => api.delete<ApiResponse>(`/tareas/subtareas/${subId}`),
};

export const comentarioService = {
  getByTarea: (tareaId: string) => api.get<ApiResponse<Comentario[]>>(`/comentarios/tarea/${tareaId}`),
  create: (tareaId: string, contenido: string) => api.post<ApiResponse<Comentario>>(`/comentarios/tarea/${tareaId}`, { contenido }),
  update: (id: string, contenido: string) => api.put<ApiResponse<Comentario>>(`/comentarios/${id}`, { contenido }),
  delete: (id: string) => api.delete<ApiResponse>(`/comentarios/${id}`),
};

export const archivoService = {
  upload: (tareaId: string, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    return api.post<ApiResponse>(`/archivos/tarea/${tareaId}`, formData);
  },
  getDownloadUrl: (id: string) => `/api/archivos/${id}/download`,
  delete: (id: string) => api.delete<ApiResponse>(`/archivos/${id}`),
};

export const notificacionService = {
  getAll: (page = 1, limit = 20) => api.get<ApiResponse<{ notificaciones: Notificacion[]; noLeidas: number }>>(`/notificaciones?page=${page}&limit=${limit}`),
  markRead: (id: string) => api.patch<ApiResponse>(`/notificaciones/${id}/leer`),
  markAllRead: () => api.patch<ApiResponse>('/notificaciones/leer-todas'),
};

export const reporteService = {
  getDatos: (proyectoId: string) => api.get<ApiResponse>(`/reportes/datos/${proyectoId}`),
  downloadPDF: (proyectoId: string) => api.get(`/reportes/proyecto/${proyectoId}`, { responseType: 'blob' }),
};

export const archivoProyectoService = {
  getByProyecto: (proyectoId: string) => api.get<ApiResponse>(`/archivos-proyecto/proyecto/${proyectoId}`),
  upload: (proyectoId: string, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    return api.post<ApiResponse>(`/archivos-proyecto/proyecto/${proyectoId}`, formData);
  },
  getDownloadUrl: (id: string) => `/api/archivos-proyecto/${id}/download`,
  delete: (id: string) => api.delete<ApiResponse>(`/archivos-proyecto/${id}`),
};

export const historialService = {
  getByTarea: (tareaId: string) => api.get<ApiResponse<HistorialEstado[]>>(`/historial/tarea/${tareaId}`),
};

export const actividadService = {
  getAll: (page = 1, limit = 20) => api.get(`/actividad?page=${page}&limit=${limit}`),
};

export const calendarioService = {
  getMes: (mes: string) => api.get(`/calendario?mes=${mes}`),
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
  enviar: (correo: string) => api.get(`/verificacion/enviar?correo=${encodeURIComponent(correo)}`),
};
