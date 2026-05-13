import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { authService } from '../services/apiService';
import { usePresencia } from '../hooks/usePresencia';
import type { Usuario, AuthData } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (data: { nombre: string; correo: string; contrasena: string; rol?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: (updatedData?: Partial<Usuario>) => void;
  isAuthenticated: boolean;
  presenciaUsuarios: Record<string, { estado: string; ultimaConexion: string }>;
  socket: {
    unirseAProyecto: (proyectoId: string) => void;
    salirDeProyecto: (proyectoId: string) => void;
    onTareaEstadoCambiado: (cb: any) => () => void;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [presenciaUsuarios, setPresenciaUsuarios] = useState<Record<string, { estado: string; ultimaConexion: string }>>({});

  useEffect(() => {
    const savedToken = localStorage.getItem('sgpe_token');
    const savedRefresh = localStorage.getItem('sgpe_refresh');
    const savedUser = localStorage.getItem('sgpe_usuario');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setRefreshToken(savedRefresh);
      setUsuario(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const guardarSesion = (t: string, rt: string, user: Usuario) => {
    setToken(t);
    setRefreshToken(rt);
    setUsuario(user);
    localStorage.setItem('sgpe_token', t);
    localStorage.setItem('sgpe_refresh', rt);
    localStorage.setItem('sgpe_usuario', JSON.stringify(user));
  };

  const login = useCallback(async (correo: string, contrasena: string) => {
    const { data } = await authService.login(correo, contrasena);
    if (data.success && data.data) {
      guardarSesion(data.data.token, data.data.refreshToken, data.data.usuario);
    }
  }, []);

  const register = useCallback(async (regData: { nombre: string; correo: string; contrasena: string; rol?: string }) => {
    const { data } = await authService.register(regData);
    if (!data.success) throw new Error(data.message || 'Error al registrarse');
  }, []);

  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    setUsuario(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('sgpe_token');
    localStorage.removeItem('sgpe_refresh');
    localStorage.removeItem('sgpe_usuario');
  }, []);

  const refreshUser = useCallback((updatedData?: Partial<Usuario>) => {
    if (updatedData) {
      setUsuario(prev => {
        const updatedUser = { ...prev, ...updatedData } as Usuario;
        localStorage.setItem('sgpe_usuario', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } else {
      const savedUser = localStorage.getItem('sgpe_usuario');
      if (savedUser) setUsuario(JSON.parse(savedUser));
    }
  }, []);

  const value = useMemo(() => ({
    usuario, token, refreshToken, loading, login, register, logout, refreshUser,
    isAuthenticated: !!token,
    presenciaUsuarios,
    socket: null,
  }), [usuario, token, refreshToken, loading, login, register, logout, refreshUser, presenciaUsuarios]);

  usePresencia(token, (update) => {
    setPresenciaUsuarios(prev => ({
      ...prev,
      [update.usuarioId]: { estado: update.estado, ultimaConexion: update.ultimaConexion }
    }));
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
