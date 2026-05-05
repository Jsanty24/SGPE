# SGPE Changes — Auditoria y Mejoras Completas

## Resumen de cambios por seccion

---

### SECCION 0 — Auditoria y Reparacion de Bugs

**Archivos modificados (backend):**
- `backend/src/lib/prisma.ts` — Cambiado a exportacion nombrada `{ prisma }`, configuracion de connection pool, middleware de query lenta, prevencion de instancias multiples en desarrollo
- `backend/src/index.ts` — JWT_SECRET sin fallback, health check mejorado, graceful shutdown con SIGTERM/SIGINT, socket rooms para proyectos, export shared io
- `backend/src/middlewares/auth.ts` — JWT_SECRET requerido (lanza error si no existe), sin fallback hardcoded
- `backend/src/middlewares/errorHandler.ts` — No expone stack trace en produccion, manejo de PrismaClientKnownRequestError (P2002, P2025, P2003), ZodError, JsonWebTokenError, TokenExpiredError, MulterError
- `backend/src/routes/auth.routes.ts` — JWT_SECRET sin fallback, integracion sendWelcomeEmail despues del registro
- `backend/src/routes/tarea.routes.ts` — Verifica pertenencia al proyecto antes de cambiar estado (L4), endpoint PATCH /:id/tiempo para time tracking, emision Socket.IO en cambio de estado
- `backend/src/routes/archivo.routes.ts` — Verifica ownership antes de DELETE (L5, solo propietario o ADMIN)
- `backend/src/routes/historial.routes.ts` — Verifica acceso al proyecto de la tarea (L10)
- `backend/src/routes/usuario.routes.ts` — Hashea contrasena si se envia en PUT (M18)
- `backend/src/services/cron.service.ts` — Notificaciones con tipo/referenciaId para deduplicar (M17)
- `backend/src/services/notificacion.service.ts` — Parametros opcionales (tipo, referenciaId, referenciaType) con deduplicacion automatica
- `backend/src/services/email.service.ts` — Funcion sendWelcomeEmail con HTML responsive
- **Todos los archivos de rutas** — Cambiado `import prisma from` a `import { prisma } from` (12 archivos)

**Archivos modificados (frontend):**
- `frontend/src/pages/ResetPasswordPage.tsx` — Validar token antes de llamar API (L1)
- `frontend/src/pages/EquipoPage.tsx` — Eliminado polling de 30s (M13, reemplazado por WebSocket)
- `frontend/src/components/CommandPalette.tsx` — Busqueda de usuarios en Promise.all (M15)

**Archivos eliminados:**
- `frontend/vite.config.js` — Duplicado de vite.config.ts (D4)
- `backend/src/controllers/` — Directorio vacio (D5)
- `backend/src/validators/` — Directorio vacio (D6)
- `_nul` — Archivo de 0 bytes en raiz (D8)

---

### SECCION 1 — Optimizacion de Rendimiento

**Archivos creados:**
- `frontend/src/hooks/useDevicePerformance.ts` — Deteccion de dispositivo (isLowEnd, isMidRange, isHighEnd) basado en CPU, RAM, prefers-reduced-motion, y benchmark opcional

**Archivos modificados:**
- `frontend/src/pages/LoginPage.tsx` — Three.js condicional (no se renderiza en low-end, 500 particulas en mid-range, 2500 en high-end), fondo CSS gradient en low-end, willChange: 'transform'
- `frontend/src/pages/RegisterPage.tsx` — Misma logica de deteccion que LoginPage
- `frontend/src/App.tsx` — `<MotionConfig reducedMotion="always">` en low-end para desactivar animaciones Framer Motion
- `frontend/src/components/StatCard.tsx` — GSAP desactivado en low-end, muestra valor directamente
- `frontend/src/pages/DashboardPage.tsx` — `isAnimationActive={!isLowEnd}` en AreaChart, PieChart, BarChart, RadialBarChart; GSAP desactivado en low-end
- `frontend/vite.config.ts` — Bundle splitting manual (three, framer, recharts, gsap en chunks separados)
- `frontend/tailwind.config.js` — Agregada animacion gradientShift

---

### SECCION 2 — Paleta de Colores y Modo Claro/Oscuro

**Archivos modificados:**
- `frontend/tailwind.config.js` — Colores `dark-*` ahora usan CSS variables (`var(--bg-color)` etc.) en vez de valores hex fijos. Agregado `darkMode: 'class'`
- `frontend/src/index.css` — `.glass-table th` usa `var(--surface-color)`, `.filter-pill.active` usa `var(--color-primary)`, `.tab-item.active` usa `var(--color-primary)`, `.recharts-tooltip-wrapper` usa variables CSS
- `frontend/src/components/Modal.tsx` — Backdrop y panel usan CSS variables para adaptarse a tema claro/oscuro
- `frontend/src/components/LoadingSkeleton.tsx` — Spinner usa `var(--color-primary)` y `var(--glass-border)`
- `frontend/src/components/Navbar.tsx` — Toggle de tema ahora tambien agrega/quita clase `dark` en `<html>`

---

### SECCION 3 — Correo de Bienvenida

**Archivos creados:**
- `backend/.env.example` — Variables de entorno para configuracion de correo

**Archivos modificados:**
- `backend/.env` — Agregadas variables EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
- `backend/src/services/email.service.ts` — `sendWelcomeEmail()` con HTML responsive (header oscuro, CTA button, footer)
- `backend/src/routes/auth.routes.ts` — Llama a `sendWelcomeEmail()` despues de crear usuario

---

### SECCION 4 — Mejoras de Funcionalidad

Ya implementado previamente en el codigo:
- 4A: Roles en registro (select en RegisterPage, bloqueo ADMIN en backend)
- 4B: ID visible (PerfilPage y UsuariosPage ya muestran ID con boton copiar)
- 4C: Visibilidad por rol (usuario.routes.ts GET / filtra segun rol)
- 4D: Avatar funcional (PATCH /:id/avatar con multer)
- 4E: Equipo simetrico (CSS Grid responsive)
- 4F: WebSocket presencia (Socket.IO ya integrado con presencia:actualizar)

---

### SECCION 5 — Funcionalidades Faltantes

**Archivos creados:**
- `backend/src/routes/actividad.routes.ts` — GET /api/actividad?page&limit con historial de cambios de estado
- `backend/src/routes/calendario.routes.ts` — GET /api/calendario?mes=YYYY-MM con tareas e hitos
- `frontend/src/pages/CalendarioPage.tsx` — Vista mensual con grid CSS, colores por estado, panel de detalle, leyenda

**Archivos modificados:**
- `backend/src/index.ts` — Registradas rutas de actividad y calendario
- `backend/src/routes/tarea.routes.ts` — Nuevo endpoint PATCH /:id/tiempo para time tracking (horasReales)
- `frontend/src/services/apiService.ts` — Agregados `actividadService.getAll()`, `calendarioService.getMes()`
- `frontend/src/App.tsx` — Registrada ruta `/calendario`
- `frontend/src/components/Sidebar.tsx` — Agregado boton "Calendario"
- `frontend/src/types/index.ts` — Notificacion ahora incluye tipo, referenciaId, referenciaType, pendiente

**Comentario edit/delete** — Ya implementado (PUT/DELETE en comentario.routes.ts con verificacion de autor)

---

### SECCION 6 — Funcionalidades Avanzadas Socket.IO

**Archivos creados:**
- `backend/src/lib/socket.ts` — Modulo compartido para instancia Socket.IO (setIO/getIO, evita dependencias circulares)
- `frontend/src/hooks/usePushNotifications.ts` — Notificaciones del navegador (Notification API), solo cuando la pestana no esta visible

**Archivos modificados:**
- `backend/src/index.ts` — Socket.IO maneja eventos `proyecto:unirse`, `proyecto:salir`, `comentario:escribiendo`, `comentario:dejoDeEscribir`
- `backend/src/routes/tarea.routes.ts` — Cambio de estado emite `tarea:estadoCambiado` al room del proyecto via Socket.IO
- `frontend/src/hooks/usePresencia.ts` — Nuevos metodos: `unirseAProyecto()`, `salirDeProyecto()`, `onTareaEstadoCambiado()`, `emitirEscribiendo()`, `emitirDejoDeEscribir()`, `onEscribiendo()`, `onDejoDeEscribir()`
- `frontend/src/context/AuthContext.tsx` — Expone propiedades de socket en el contexto

---

## Dependencias nuevas instaladas

Todas las dependencias ya estaban presentes en package.json. No se requieren instalaciones adicionales.

---

## Variables de entorno nuevas requeridas

En `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password_aqui
EMAIL_FROM="SGPE Sistema <tu_correo@gmail.com>"
```

---

## Migracion de Prisma

No se modifico el schema.prisma. No se requieren migraciones adicionales.

---

## Instrucciones para correr

```bash
# Backend
cd backend
npm run dev

# Frontend  
cd frontend
npm run dev

# Ambos simultaneamente (desde raiz)
npm run dev
```

### Configurar correo (Gmail):
1. Activar verificacion en 2 pasos en tu cuenta Google
2. Crear contraseña de aplicacion para "Correo"
3. Usar la contraseña de 16 digitos en EMAIL_PASS

### Configurar correo (Mailtrap para desarrollo):
1. Crear cuenta en mailtrap.io
2. Copiar credenciales SMTP al .env:
   - EMAIL_HOST=sandbox.smtp.mailtrap.io
   - EMAIL_PORT=2525

---

## Verificacion

- Backend inicia en http://localhost:5000
- Health check: GET http://localhost:5000/api/health
- Frontend en http://localhost:5173
- WebSocket activo en puerto 5000
- Modo claro/oscuro funcional con persistencia en localStorage
