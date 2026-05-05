import { createBrowserRouter, RouterProvider, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoadingSkeleton from './components/LoadingSkeleton';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import { useDevicePerformance } from './hooks/useDevicePerformance';
import type { ReactNode } from 'react';

const LoginPage           = lazy(() => import('./pages/LoginPage'));
const RegisterPage        = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage  = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage       = lazy(() => import('./pages/DashboardPage'));
const ProyectosListPage   = lazy(() => import('./pages/ProyectosListPage'));
const CrearProyectoPage   = lazy(() => import('./pages/CrearProyectoPage'));
const ProyectoDetailPage  = lazy(() => import('./pages/ProyectoDetailPage'));
const EditarProyectoPage  = lazy(() => import('./pages/EditarProyectoPage'));
const TareaDetailPage     = lazy(() => import('./pages/TareaDetailPage'));
const UsuariosPage        = lazy(() => import('./pages/UsuariosPage'));
const ReportePage         = lazy(() => import('./pages/ReportePage'));
const NotificacionesPage  = lazy(() => import('./pages/NotificacionesPage'));
const MisTareasPage       = lazy(() => import('./pages/MisTareasPage'));
const PerfilPage          = lazy(() => import('./pages/PerfilPage'));
const EquipoPage          = lazy(() => import('./pages/EquipoPage'));
const CalendarioPage      = lazy(() => import('./pages/CalendarioPage'));

const ProtectedRoute = ({ children, roles }: { children: ReactNode; roles?: string[] }) => {
  const { isAuthenticated, usuario, loading } = useAuth();
  if (loading) return <LoadingSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && usuario && !roles.includes(usuario.rol)) return <Navigate to="/proyectos" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton fullScreen />}>
      {isAuthenticated && <CommandPalette />}
      <Routes>
        <Route path="/login"                  element={isAuthenticated ? <Navigate to="/proyectos" replace /> : <LoginPage />} />
        <Route path="/register"               element={isAuthenticated ? <Navigate to="/proyectos" replace /> : <RegisterPage />} />
        <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token"  element={<ResetPasswordPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index                        element={<Navigate to="/proyectos" replace />} />
          <Route path="dashboard"             element={<ProtectedRoute roles={['ADMIN','GERENTE']}><DashboardPage /></ProtectedRoute>} />
          <Route path="proyectos"             element={<ProyectosListPage />} />
          <Route path="proyectos/nuevo"       element={<ProtectedRoute roles={['ADMIN','GERENTE']}><CrearProyectoPage /></ProtectedRoute>} />
          <Route path="proyectos/:id"         element={<ProyectoDetailPage />} />
          <Route path="proyectos/:id/editar"  element={<ProtectedRoute roles={['ADMIN','GERENTE']}><EditarProyectoPage /></ProtectedRoute>} />
          <Route path="proyectos/:id/reporte" element={<ProtectedRoute roles={['ADMIN','GERENTE']}><ReportePage /></ProtectedRoute>} />
          <Route path="tareas/:id"            element={<TareaDetailPage />} />
          <Route path="usuarios"              element={<ProtectedRoute roles={['ADMIN']}><UsuariosPage /></ProtectedRoute>} />
          <Route path="notificaciones"        element={<NotificacionesPage />} />
          <Route path="mis-tareas"            element={<MisTareasPage />} />
          <Route path="equipo"                element={<EquipoPage />} />
          <Route path="calendario"            element={<CalendarioPage />} />
          <Route path="perfil"                element={<PerfilPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/proyectos" replace />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
};

const router = createBrowserRouter([
  {
    path: "*",
    element: <AppRoutes />,
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as any
});

export default function App() {
  const { isLowEnd } = useDevicePerformance();

  return (
    <MotionConfig reducedMotion={isLowEnd ? 'always' : 'never'}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
