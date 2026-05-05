export type Rol = 'ADMIN' | 'GERENTE' | 'MIEMBRO' | 'CLIENTE' | 'VIEWER';
export type EstadoUsuario = 'ACTIVO' | 'AUSENTE' | 'NO_MOLESTAR' | 'INACTIVO';
export type EstadoProyecto = 'ACTIVO' | 'EN_PAUSA' | 'CERRADO';
export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'EN_REVISION' | 'TERMINADA';
export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';

export interface Usuario {
  id: string;
  codigo?: number | null;
  nombre: string;
  correo: string;
  avatar?: string | null;
  rol: Rol;
  activo: boolean;
  estado?: EstadoUsuario;
  noMolestarActivo?: boolean;
  noMolestarInicio?: string | null;
  noMolestarFin?: string | null;
  ultimaConexion?: string | null;
  ubicacionLat?: number | null;
  ubicacionLng?: number | null;
  ubicacionActualizada?: string | null;
  createdAt?: string;
  _count?: { tareasAsignadas: number; proyectos: number };
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoProyecto;
  cliente?: string;
  gerenteId: string;
  gerente: { id: string; nombre: string; correo?: string };
  miembros: ProyectoUsuario[];
  tareas: Tarea[];
  hitos: Hito[];
  _count?: { tareas: number; miembros: number; hitos: number };
  createdAt: string;
}

export interface ProyectoUsuario {
  id: string;
  proyectoId: string;
  usuarioId: string;
  nombre: string; // shorthand — populated from usuario.nombre in API layer
  usuario: { id: string; nombre: string; correo: string; rol?: Rol };
}

export interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  prioridad: Prioridad;
  fechaLimite: string;
  estado: EstadoTarea;
  orden: number;
  horasEstimadas?: number;
  horasReales?: number;
  proyectoId: string;
  proyecto?: { id: string; nombre: string; estado: EstadoProyecto; gerenteId?: string };
  asignadoAId?: string;
  asignadoA?: { id: string; nombre: string; correo?: string };
  comentarios?: Comentario[];
  archivos?: Archivo[];
  historial?: HistorialEstado[];
  subtareas?: Subtarea[];
  _count?: { comentarios: number; archivos: number; subtareas?: number };
  createdAt: string;
  updatedAt?: string;
}

export interface Comentario {
  id: string;
  contenido: string;
  tareaId: string;
  autorId: string;
  autor: { id: string; nombre: string };
  createdAt: string;
}

export interface Archivo {
  id: string;
  url: string;
  nombre: string;
  mimetype?: string;
  tareaId: string;
  subidoPorId: string;
  subidoPor?: { id: string; nombre: string };
  createdAt: string;
}

export interface HistorialEstado {
  id: string;
  tareaId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  coordenadas?: string | null;
  cambiadoPorId: string;
  cambiadoPor?: { id: string; nombre: string };
  createdAt: string;
}

export interface Notificacion {
  id: string;
  mensaje: string;
  tipo?: string | null;
  referenciaId?: string | null;
  referenciaType?: string | null;
  leida: boolean;
  pendiente?: boolean;
  usuarioId: string;
  createdAt: string;
}

export interface Hito {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  completado: boolean;
  proyectoId: string;
  createdAt: string;
}

export interface Subtarea {
  id: string;
  titulo: string;
  completada: boolean;
  tareaId: string;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface AuthData {
  usuario: Usuario;
  token: string;
  refreshToken: string;
}
