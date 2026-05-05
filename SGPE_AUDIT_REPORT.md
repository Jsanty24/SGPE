# 📊 INFORME DE AUDITORÍA — SGPE (Sistema de Gestión de Proyectos Empresariales)

> **Fecha:** 03/05/2026
> **Auditor:** Arquitecto de Software Senior
> **Versión:** 1.0.0

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Progreso global del proyecto** | **74%** |
| **Módulos completados** | 3 (Autenticación, Dashboard, Tareas) |
| **Módulos en progreso** | 5 (Proyectos, Usuarios, Reportes, Notificaciones, CRM/Equipo) |
| **Módulos sin iniciar** | 2 (Facturación/Economía, Inventario) |
| **Bugs críticos** | 6 |
| **Bugs medios** | 18 |
| **Bugs menores** | 14 |
| **TODOs pendientes** | 0 (código limpio sin markers) |
| **Riesgos de seguridad** | 7 HIGH / 5 MEDIUM |
| **Archivos con +300 líneas** | 7 (necesitan refactoring) |

### Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 18.3, TypeScript 5.7, Vite 6.0, TailwindCSS 3.4, Framer Motion 11, Recharts 2.14, GSAP 3.12, Three.js 0.170 (@react-three/fiber + @react-three/drei), React Router 6.28, React Hook Form 7.54, Zod 3.24, Axios 1.7, Canvas Confetti 1.9 |
| **Backend** | Express 4.21, TypeScript 5.7, Prisma 5.22, bcrypt 5.1, jsonwebtoken 9.0, PDFKit 0.15, Nodemailer 6.9, Multer 1.4, node-cron 3.0, Helmet 8.0, express-rate-limit 7.4, express-validator 7.2 |
| **Base de datos** | PostgreSQL (Supabase-hosted: `db.sauormcjhjeukdbecvxd.supabase.co`) |
| **Autenticación** | JWT personalizado (no Supabase Auth) |

---

## 📁 ESTRUCTURA DEL PROYECTO

```
SGPE_COMPARTIR/
├── .env / .env.example / .gitignore
├── README.md / DOCUMENTACION_SGPE.md / INSTRUCCIONES.txt
├── package.json                          (root: concurrently para dev)
│
├── backend/
│   ├── .env                              (DATABASE_URL → Supabase PostgreSQL)
│   ├── package.json                      (Express + Prisma + JWT + PDFKit + Nodemailer)
│   ├── tsconfig.json                     (CommonJS, strict: false)
│   ├── prisma/
│   │   ├── schema.prisma                 (10 modelos: Usuario, Proyecto, Tarea, etc.)
│   │   └── seed.ts                       (5 usuarios, 2 proyectos, 10 tareas, 5 hitos)
│   ├── scripts/
│   │   ├── addUser.ts                    (utilidad CLI para crear usuarios)
│   │   └── backup.ts                     (script de backup de BD)
│   └── src/
│       ├── index.ts                      (entry: Express + rutas + cron + error handler)
│       ├── middlewares/
│       │   ├── auth.ts                   (JWT verify + role check + noCliente)
│       │   ├── errorHandler.ts           (global 500 handler)
│       │   ├── rateLimit.ts              (login limiter: 5/15min)
│       │   └── validators.ts             (express-validator wrapper)
│       ├── routes/
│       │   ├── auth.routes.ts            (register, login, forgot/reset password)
│       │   ├── usuario.routes.ts         (CRUD usuarios)
│       │   ├── proyecto.routes.ts        (CRUD proyectos + miembros + hitos)
│       │   ├── tarea.routes.ts           (CRUD tareas + subtareas + kanban)
│       │   ├── comentario.routes.ts      (POST/GET comentarios)
│       │   ├── archivo.routes.ts         (upload/delete archivos)
│       │   ├── notificacion.routes.ts    (GET/PATCH notificaciones)
│       │   ├── reporte.routes.ts         (PDF/JSON reportes)
│       │   └── historial.routes.ts       (GET historial de estados)
│       └── services/
│           ├── cron.service.ts           (notificación de vencimientos cada 1h)
│           ├── email.service.ts          (Nodemailer SMTP)
│           └── notificacion.service.ts   (crear notificación en BD)
│
├── frontend/
│   ├── .env                              (VITE_API_URL)
│   ├── package.json                      (React 18 + Vite + Tailwind + Three.js + Framer)
│   ├── vite.config.ts                    (proxy /api → localhost:5000)
│   ├── tailwind.config.js                (tema dark/glass con indigo/violet)
│   ├── postcss.config.js
│   ├── tsconfig.json / tsconfig.node.json
│   ├── index.html
│   └── src/
│       ├── main.tsx / App.tsx            (entry + router)
│       ├── index.css                     (414 líneas: sistema de diseño glass)
│       ├── types/index.ts                (131 líneas: tipos y DTOs)
│       ├── context/
│       │   ├── AuthContext.tsx            (auth state + login/logout/refresh)
│       │   └── ToastContext.tsx           (sistema de toasts)
│       ├── hooks/
│       │   └── useNotificaciones.ts      (polling 30s + mark read)
│       ├── services/
│       │   ├── api.ts                    (Axios config + interceptors)
│       │   └── apiService.ts             (service layer: auth, proyectos, tareas, etc.)
│       ├── components/
│       │   ├── Layout.tsx                (shell: sidebar + navbar + content)
│       │   ├── Navbar.tsx                (305 líneas: breadcrumbs, notifs, tema, perfil)
│       │   ├── Sidebar.tsx               (194 líneas: navegación role-based)
│       │   ├── KanbanBoard.tsx           (197 líneas: drag & drop 4 columnas)
│       │   ├── CommandPalette.tsx        (185 líneas: Ctrl+K search/navegación)
│       │   ├── ProjectCard.tsx           (159 líneas: 3D tilt + progress bar)
│       │   ├── StatCard.tsx              (51 líneas: GSAP counter animado)
│       │   ├── Modal.tsx                 (102 líneas: glass modal animado)
│       │   ├── ConfirmDeleteModal.tsx    (34 líneas)
│       │   └── LoadingSkeleton.tsx       (69 líneas: fullscreen + inline skeletons)
│       └── pages/
│           ├── DashboardPage.tsx         (456 líneas: KPIs, area, pie, bar, radial charts)
│           ├── LoginPage.tsx             (271 líneas: 3D particles, tilt card)
│           ├── RegisterPage.tsx          (118 líneas: 3D sphere background)
│           ├── ForgotPasswordPage.tsx    (68 líneas)
│           ├── ResetPasswordPage.tsx     (79 líneas)
│           ├── ProyectosListPage.tsx     (224 líneas: grid/list, filtros, búsqueda)
│           ├── CrearProyectoPage.tsx     (186 líneas: form + selección miembros)
│           ├── EditarProyectoPage.tsx    (147 líneas: form pre-rellenado)
│           ├── ProyectoDetailPage.tsx    (529 líneas: kanban, hitos, miembros)
│           ├── TareaDetailPage.tsx       (443 líneas: checklist, comentarios, archivos, historial)
│           ├── MisTareasPage.tsx         (96 líneas: kanban mis tareas)
│           ├── EquipoPage.tsx            (171 líneas: grid usuarios, polling 5s)
│           ├── UsuariosPage.tsx          (198 líneas: tabla, editar/eliminar, polling 5s)
│           ├── PerfilPage.tsx            (243 líneas: info, seguridad, estadísticas)
│           ├── ReportePage.tsx           (262 líneas: KPIs, charts, CSV/PDF export)
│           └── NotificacionesPage.tsx    (116 líneas: lista, timeAgo, mark read)
```

### Conteo de Archivos por Tipo

| Tipo | Cantidad |
|---|---|
| `.tsx` | 30 |
| `.ts` | 26 |
| `.json` | 10 |
| `.js` | 3 |
| `.css` | 1 |
| `.html` | 1 |
| `.svg` | 1 |
| `.prisma` | 1 |
| **TOTAL** | **84** |

---

## 🧩 ESTADO DE MÓDULOS

| Módulo | Estado | % Completo | Componentes | Pendiente | Prioridad |
|---|---|---|---|---|---|
| **Dashboard** | ✅ COMPLETADO | 80% | KPIs, 5 tipos de charts, tabla proyectos recientes, vencimientos hoy | Manejo de errores, tendencias reales (ahora son hardcoded), selector de período | **Media** |
| **Autenticación** | 🔧 EN PROGRESO | 85% | Login 3D, Register, Forgot/Reset Password, JWT middleware, roles | Cambio de contraseña autenticado (bug crítico: no verifica actual), GET /me, logout/token invalidation, refresh token, verificación de email | **Crítica** |
| **Proyectos (CRUD)** | 🔧 EN PROGRESO | 85% | Lista grid/list, crear, editar, detalle con kanban/hitos/miembros, eliminar, reporte | Arrastrar kanban real, filtrar/buscar en kanban, paginación, ordenamiento, bulk actions, actividad del proyecto | **Alta** |
| **Tareas** | ✅ COMPLETADO | 85% | CRUD completo, subtareas, checklist, comentarios, archivos, historial estados, kanban drag-drop, asignación | Editar/eliminar comentarios, validación de tipo de archivo, timer horas reales, GET mis-tareas bug de enrutamiento | **Alta** |
| **Usuarios (Admin)** | 🔧 EN PROGRESO | 65% | Tabla con filtros, editar rol/estado/activo, eliminar | Auto-refresh roto, búsqueda, crear usuario, paginación, estado de carga/error en operaciones, usa alert() en vez de toast | **Crítica** |
| **Equipo (CRM)** | 🔧 EN PROGRESO | 75% | Grid de usuarios, filtros por rol, búsqueda, KPIs por rol, polling 5s | Sin interacción (no navega a detalle), polling excesivo (5s), sin paginación | **Media** |
| **Notificaciones** | 🔧 EN PROGRESO | 72% | Lista con iconos, read/unread, marcar una/todas, timeAgo, polling 30s | Sin navegación al click, sin filtros, sin eliminar, sin paginación, sin agrupación por fecha | **Media** |
| **Reportes** | 🔧 EN PROGRESO | 78% | KPIs, pie/radial/bar charts, tabla miembros, export CSV/PDF | Sin filtro de fecha, sin burndown, sin error handling en fetch de datos, EN_REVISION ausente en datos de chart | **Alta** |
| **Archivos** | 🔧 EN PROGRESO | 50% | Upload multer, delete, listado en tarea | **Sin GET/download**, almacenamiento base64 en BD (insostenible), sin validación de tipo MIME | **Crítica** |
| **Perfil** | ✅ COMPLETADO | 78% | Info (nombre/email), seguridad (cambio password), estadísticas | Bug crítico: no verifica password actual al cambiar, sin foto de perfil, sin verificación de cambio de email | **Crítica** |
| **CRM (Clientes)** | ❌ NO INICIADO | 0% | — | Módulo completo: entidad Cliente, CRUD, relación con proyectos, pipeline/embudo, historial | **Baja** |
| **Facturación / Economía** | ❌ NO INICIADO | 0% | — | Módulo completo: presupuestos, facturas, gastos, cobros, reportes financieros | **Baja** |
| **Inventario** | ❌ NO INICIADO | 0% | — | Módulo completo: almacenes, productos, stock, movimientos | **Baja** |

---

## 🐛 BUGS Y ERRORES

### 🔴 CRÍTICOS (6)

| # | Archivo | Línea | Descripción | Fix Sugerido |
|---|---|---|---|---|
| **C1** | `backend/src/routes/tarea.routes.ts` | 35, 47 | **GET /mis-tareas es INALCANZABLE.** Express matchea `GET /proyecto/:proyectoId` antes, así que `mis-tareas` se interpreta como `:proyectoId = "mis-tareas"`. | Mover `router.get('/mis-tareas', ...)` ANTES de `router.get('/proyecto/:proyectoId', ...)` |
| **C2** | `frontend/src/pages/PerfilPage.tsx` | 80 | **Cambio de password no verifica contraseña actual.** El frontend pide `contrasenaActual` + `contrasenaNueva` pero solo envía `{ contrasena: data.contrasenaNueva }`. Cualquiera puede cambiar la contraseña sin saber la actual. | Enviar ambos campos al backend y verificar `contrasenaActual` con bcrypt.compare |
| **C3** | `frontend/src/services/apiService.ts` | 63 | **Upload de archivos ROTO.** La línea `'Content-Type': 'multipart/form-data'` sobreescribe el header y elimina el `boundary` necesario. El backend no puede parsear el FormData. | Eliminar el header manual: `const headers = {}` (el navegador lo auto-genera con boundary) |
| **C4** | `backend/src/middlewares/auth.ts` + todos los routes | 5, y múltiples | **10+ instancias de PrismaClient.** Cada middleware y cada route crea su propio `new PrismaClient()`. Connection pool exhausto bajo carga. | Usar UNA instancia compartida exportada desde `index.ts` (ya existe) |
| **C5** | `backend/src/routes/archivo.routes.ts` | 8, 15 | **Almacenamiento base64 en BD + sin GET/download.** Archivos se guardan como Data URI base64 en PostgreSQL. No hay endpoint para descargarlos. | Usar almacenamiento local/S3 con URL de referencia. Añadir GET endpoint que streamee el archivo con Content-Type. Validar tipos MIME permitidos. |
| **C6** | `frontend/src/components/StatCard.tsx` | 29 | **GSAP tween leak.** Al cambiar `value`, se crea un nuevo `gsap.fromTo` sin matar el anterior. Múltiples tweens compiten por `textContent`. | Añadir `gsap.killTweensOf(valueRef.current)` antes de `gsap.fromTo` |

### 🟡 MEDIOS (18)

| # | Archivo | Línea | Descripción | Fix Sugerido |
|---|---|---|---|---|
| **M1** | `frontend/src/pages/LoginPage.tsx` | 248-259 | **Demo autofill "Rellenar" no funciona.** Dispara `new Event('input')` pero react-hook-form no escucha eventos nativos del DOM. El formulario sigue vacío. | Usar `setValue()` de react-hook-form para rellenar los campos |
| **M2** | `frontend/src/pages/DashboardPage.tsx` | 104-106 | Error handler ausente. `proyectoService.getAll().then(...)` sin `.catch()`. | Añadir `.catch(err => toast.error('Error al cargar dashboard'))` |
| **M3** | `frontend/src/pages/ProyectosListPage.tsx` | 33, 44 | `catch { /* silent */ }` en fetch + crash si `descripcion` es null en filter. | Añadir toast error + `p.descripcion?.toLowerCase() ?? ''` |
| **M4** | `frontend/src/pages/TareaDetailPage.tsx` | 68, 79 | `catch { /* silent */ }` en fetch + crash si `fechaLimite` es null en edit. | Añadir toast + `tarea.fechaLimite?.split('T')[0] ?? ''` |
| **M5** | `frontend/src/pages/ReportePage.tsx` | 32-35 | Sin `.catch()` en fetch de datos. Componente se queda en loading infinito si falla. | Añadir try/catch con setError state |
| **M6** | `frontend/src/pages/UsuariosPage.tsx` | 37-41, 58 | **Auto-refresh ROTO** (fetch no memoizado con useCallback → intervalo se recrea cada render). Usa `alert()` para errores. | `useCallback(fetch, [])`, usar `toast.error()` |
| **M7** | `backend/src/routes/auth.routes.ts` | 34 | **Rol ignorado en registro.** Valida `rol` pero siempre hardcodea `'VIEWER'`. La validación es engañosa. | O quitar la validación de rol, o usar el valor enviado (solo VIEWER/CLIENTE) |
| **M8** | `frontend/src/pages/MisTareasPage.tsx` | 20, 41 | Sin error handler + **EN_REVISION no accesible.** El estado EN_REVISION aparece en stats pero no hay UI para mover tareas a ese estado (solo PENDIENTE, EN_PROGRESO, TERMINADA). | Añadir botón EN_REVISION en TareaDetailPage o quitarlo del KanbanBoard |
| **M9** | `frontend/src/components/Sidebar.tsx` | 22, 137 | **Tooltips recortados en modo colapsado** + `logout` destructured pero no usado. Overflow-hidden del sidebar recorta `left-14` tooltips. | Quitar `overflow-hidden` del contenedor de íconos, o usar posición fixed/portal |
| **M10** | `backend/src/routes/reporte.routes.ts` | 97 | **EN_REVISION ignorado en datos de chart.** `tareasPorEstado` solo cuenta PENDIENTE, EN_PROGRESO, TERMINADA. Las EN_REVISION no aparecen pero sí se cuentan en total. Inconsistencia en charts. | Añadir `EN_REVISION: proyecto.tareas.filter(t => t.estado === 'EN_REVISION').length` |
| **M11** | `backend/src/routes/proyecto.routes.ts` | 85, 128, 173 | PUT proyecto, POST miembros y PUT hitos sin `validate()`. Campos sin validación llegan directamente al Prisma. | Añadir middleware `validate(...)` en los 3 endpoints |
| **M12** | `backend/src/routes/tarea.routes.ts` | 164, 172 | POST/PUT subtareas sin `validate()`. `titulo` puede ser vacío, `completada` no se valida como boolean. | Añadir validación con express-validator |
| **M13** | `frontend/src/pages/EquipoPage.tsx` | 42-46, 51-53 | Sin error handler + **polling 5s excesivo.** Cada 5 segundos se hace una llamada al backend sin verificar si la pestaña está activa. | Aumentar a 30s, usar `document.visibilitychange` para pausar |
| **M14** | `frontend/src/hooks/useNotificaciones.ts` | 32-34, 38-39 | **Optimistic update sin rollback.** Si la API falla al marcar como leído, el UI muestra leído pero el servidor no. | Añadir rollback en el catch |
| **M15** | `frontend/src/components/CommandPalette.tsx` | 62-76 | **Búsqueda incompleta.** Solo busca proyectos, no tareas ni usuarios. Los tipos existen en el código pero no se implementan. | Implementar fetch de tareas y usuarios en el `Promise.all` (o añadir endpoint de búsqueda unificada) |
| **M16** | `frontend/src/components/KanbanBoard.tsx` | 80-82 | **Flicker en drag-and-drop.** `onDragLeave` se dispara al entrar a cards hijos, causando parpadeo del highlight. | Usar ref counter (dragEnterCount) para controlar el highlight |
| **M17** | `backend/src/services/cron.service.ts` | 20-26 | **Deduplicación de notificaciones frágil.** Usa `contains: tarea.nombre` para detectar notificación previa. Nombres similares colisionan. | Añadir campo `tipo` y `referenciaId` a Notificacion para deduplicar correctamente |
| **M18** | `backend/src/routes/usuario.routes.ts` | 50-57 | **PUT usuario ignora cambio de contraseña.** `contrasena` se desestructura del body pero no se añade a `data`. Usuario cree que cambió su password pero no. | O hashear y actualizar, o rechazar el campo con error claro |

### 🟢 MENORES (14)

| # | Archivo | Línea | Descripción |
|---|---|---|---|
| **L1** | `frontend/src/pages/ResetPasswordPage.tsx` | 32 | `token!` non-null assertion. Si falta el param, pasa `undefined` a la API. |
| **L2** | `backend/src/middlewares/auth.ts` | 20 | JWT secret fallback hardcoded: `'sgpe_secret_local_2024'`. Si env no está configurado, es inseguro. |
| **L3** | `backend/src/routes/auth.routes.ts` | 97 | Token de recuperación almacenado en texto plano (debería hashearse como las contraseñas). |
| **L4** | `backend/src/routes/tarea.routes.ts` | 101 | PATCH estado no verifica pertenencia al proyecto. Un MIEMBRO puede cambiar estado de tareas de proyectos ajenos. |
| **L5** | `backend/src/routes/archivo.routes.ts` | 24 | DELETE archivo sin verificar ownership. Cualquier no-CLIENTE puede borrar cualquier archivo. |
| **L6** | `frontend/src/pages/DashboardPage.tsx` | 180, 184-186 | Area chart usa `fechaLimite` como proxy de fecha de creación/completado — incorrecto. |
| **L7** | `frontend/src/context/AuthContext.tsx` | 76 | Context value recreado cada render sin useMemo. Causa re-renders innecesarios en todos los consumers. |
| **L8** | `backend/src/routes/reporte.routes.ts` | 72 | `include: { usuario: true }` carga el hash de contraseña en memoria (aunque no se escribe en el PDF). |
| **L9** | `frontend/src/components/KanbanBoard.tsx` | 41 | Import de `useAuth` en mitad del archivo (no al inicio). Code smell. |
| **L10** | `backend/src/routes/historial.routes.ts` | 8 | Sin verificación de acceso. Cualquier usuario autenticado (incluido CLIENTE) ve historial de cualquier tarea. |
| **L11** | `frontend/src/components/LoadingSkeleton.tsx` | 27-28 | Conflicto de estilos spinner: `border-t-primary-500` + style inline que sobreescribe. |
| **L12** | `backend/src/middlewares/errorHandler.ts` | 5 | Stack trace en producción (`console.error(err.stack)`). Expone rutas internas. |
| **L13** | `backend/prisma/schema.prisma` | — | Sin índices en columnas frecuentes: `tarea.estado`, `tarea.asignadoAId`, `notificacion.usuarioId`, etc. |
| **L14** | `frontend/src/pages/DashboardPage.tsx` | — | KPIs muestran tendencias hardcoded (+12%, +8%, -3%) en vez de datos reales. |

---

## 💀 CÓDIGO MUERTO

| # | Archivo | Elemento | Razón |
|---|---|---|---|
| **D1** | `frontend/src/components/Sidebar.tsx:22` | `const { usuario, logout } = useAuth()` | `logout` nunca se usa en el componente |
| **D2** | `backend/src/index.ts:8` | `export const prisma = new PrismaClient()` | Exportado pero NUNCA usado. Cada ruta crea su propia instancia. |
| **D3** | `frontend/src/App.tsx:66-76` | `createBrowserRouter` + `RouterProvider` | Redundante. El `Routes` dentro de `AppRoutes` ya maneja todo el routing. La capa externa solo tiene un `<Outlet />` o catch-all. |
| **D4** | `frontend/vite.config.js` | Duplicado compilado de `vite.config.ts` | El `.ts` es el source real. El `.js` es un artifact de build innecesario. |
| **D5** | `backend/src/controllers/` | Directorio vacío | Planeado pero nunca implementado. Lógica de rutas directamente en los route handlers. |
| **D6** | `backend/src/validators/` | Directorio vacío | Planeado pero nunca implementado. Validación en `middlewares/validators.ts`. |
| **D7** | `backend/backups/` | Directorio vacío | Script `backup.ts` existe pero el directorio está vacío. |
| **D8** | `_nul` (raíz) | Archivo vacío (0 bytes) | Artefacto de Windows. Eliminar. |
| **D9** | `frontend/src/pages/PerfilPage.tsx:80` | `data.contrasenaActual` | Se recoge en el formulario pero NUNCA se envía al backend. |
| **D10** | `frontend/src/types/index.ts:39` | `nombre: string` en ProyectoUsuario | Redundante con `usuario.nombre`. Posible inconsistencia. |

---

## 📝 TODOs PENDIENTES

**No se encontraron comentarios TODO/FIXME/HACK/TEMP en el código fuente.**

El código está limpio de markers de desarrollo pendientes. Esto es positivo como indicador de disciplina del equipo, pero también significa que todo el código se trata como "terminado" aunque haya bugs o funcionalidades incompletas.

Las únicas coincidencias textuales son:
- `'TODOS'` (español para "ALL") usado como label de filtros en `EquipoPage.tsx`, `UsuariosPage.tsx`, `ProyectosListPage.tsx`
- Atributos HTML `placeholder` en inputs (no son comentarios)

---

## ⚡ OPTIMIZACIONES RECOMENDADAS

### Impacto ALTO

| # | Archivo | Problema | Recomendación |
|---|---|---|---|
| **O1** | `backend/src/` (10+ archivos) | **10+ instancias de PrismaClient** → agotamiento del pool de conexiones | Centralizar en 1 instancia exportada desde `index.ts`. Buscar `new PrismaClient()` y reemplazar por `import { prisma } from '../index'` o similar. |
| **O2** | `backend/src/routes/archivo.routes.ts` | **Base64 en PostgreSQL** → backups enormes, queries lentos | Migrar a almacenamiento local (`/uploads/`) o S3/MinIO. Guardar solo URL/ruta en BD. Añadir validación MIME. |
| **O3** | `frontend/src/context/AuthContext.tsx:76` | Context value sin `useMemo` → re-renders masivos | Envolver `value` en `useMemo(() => ({ usuario, token, ... }), [usuario, token, loading, ...])` y envolver handlers en `useCallback`. |
| **O4** | `frontend/src/` (todo el frontend) | **Sin useCallback/useMemo** generalizado | Memoizar handlers en Navbar (300+ líneas), cálculos en Sidebar/KanbanBoard, filtrados en páginas de lista. |
| **O5** | `backend/src/routes/tarea.routes.ts:35,47` | **Route ordering bug** (bug crítico C1) | Reordenar rutas: `/mis-tareas` antes de `/:proyectoId`. |
| **O6** | `frontend/src/pages/ProyectoDetailPage.tsx` (529 líneas) | Archivo más grande del frontend | Extraer tabs a componentes separados: `KanbanTab.tsx`, `HitosTab.tsx`, `MiembrosTab.tsx`. |

### Impacto MEDIO

| # | Archivo | Problema | Recomendación |
|---|---|---|---|
| **O7** | `backend/prisma/schema.prisma` | **Sin índices** → queries lentos con datos crecientes | Añadir `@@index` en: `tarea(estado, asignadoAId)`, `notificacion(usuarioId, leida)`, `proyecto(estado)`, `comentario(tareaId)`, `archivo(tareaId)`. |
| **O8** | `frontend/src/pages/DashboardPage.tsx` (456 líneas) | Monolito de dashboard | Extraer cada chart a su propio componente + hook `useDashboardData` que centralice el fetch y provea datos. |
| **O9** | `frontend/src/pages/TareaDetailPage.tsx` (443 líneas) | Página muy grande | Extraer tabs: `ChecklistTab`, `ComentariosTab`, `ArchivosTab`, `HistorialTab`. |
| **O10** | `frontend/src/` (todas las páginas de lista) | **Sin paginación** en listados | Backend: añadir `?page=1&limit=20`. Frontend: implementar infinite scroll o paginación tradicional. |
| **O11** | `backend/` (todas las rutas) | **Sin rate limiting global** | Añadir `express-rate-limit` general (100 req/min por IP) en `index.ts`. |
| **O12** | `frontend/src/services/apiService.ts` | Sin tipos para parámetros DTO | Crear interfaces `ProyectoCreateInput`, `TareaUpdateInput`, etc. en `types/index.ts`. |
| **O13** | `frontend/src/components/CommandPalette.tsx` | Fetchea TODOS los proyectos en cada tecla | Añadir `?search=` param al backend y filtrar server-side. Cachear resultados. |
| **O14** | `backend/src/routes/auth.routes.ts` | Sin refresh token | Implementar `/refresh` con refresh token (httpOnly cookie o localStorage + short-lived access token). |

### Impacto BAJO

| # | Archivo | Problema | Recomendación |
|---|---|---|---|
| **O15** | `frontend/src/pages/LoginPage.tsx`, `RegisterPage.tsx` | Three.js 3D backgrounds cargan ~500KB extra | Evaluar lazy-loading de los backgrounds 3D (solo login/register los usan). |
| **O16** | `frontend/src/components/StatCard.tsx` | GSAP importado solo para count-up animation | Reemplazar con `useSpring` de Framer Motion (ya es dependencia). Elimina GSAP del bundle. |
| **O17** | `frontend/src/index.css` (414 líneas) | CSS grande sin organización por módulos | Evaluar migrar a CSS Modules o dividir en archivos (glass.css, animations.css, recharts.css). |
| **O18** | `frontend/src/components/Navbar.tsx` (305 líneas) | Componente monolítico | Extraer `NotificationDropdown`, `AvatarDropdown`, `Breadcrumb` a componentes separados. |
| **O19** | `backend/src/routes/reporte.routes.ts` | PDF generado sincrónicamente bloquea el event loop | Usar worker thread o `pdfkit` con streams para proyectos grandes. |
| **O20** | `frontend/src/` | `AnimatePresence mode="wait"` en Layout añade 300ms de latencia en cada navegación | Cambiar a `mode="sync"` o eliminar para navegación instantánea. |
| **O21** | `frontend/src/App.tsx` | Sin `ErrorBoundary` a nivel app | Implementar `ErrorBoundary` con fallback UI. |
| **O22** | `backend/src/index.ts` | Sin graceful shutdown | Añadir `process.on('SIGTERM', ...)` con `prisma.$disconnect()` y `server.close()`. |

---

## 🗄️ PLAN DE MIGRACIÓN SUPABASE → MYSQL LOCAL

### Situación Actual

El proyecto usa Supabase **solo como hosting PostgreSQL** (no usa Supabase Auth, ni SDK, ni Realtime, ni RLS, ni Storage). La conexión es por Prisma ORM con connection string PostgreSQL directo:

```
DATABASE_URL="postgresql://postgres:Js1138077112@db.sauormcjhjeukdbecvxd.supabase.co:5432/postgres"
```

**No hay referencias a Supabase SDK en ningún archivo de código fuente.** La migración es puramente de base de datos.

### Archivos a Modificar

| # | Archivo | Cambio Necesario |
|---|---|---|
| 1 | `backend/.env` | Cambiar `DATABASE_URL` → `mysql://user:password@localhost:3306/sgpe` |
| 2 | `backend/prisma/schema.prisma` | Cambiar `provider = "postgresql"` → `provider = "mysql"` + ajustes de tipo |
| 3 | `backend/prisma/seed.ts` | Verificar compatibilidad con MySQL (ningún cambio esperado si no usa SQL raw) |
| 4 | `backend/src/routes/reporte.routes.ts:97` | Verificar `_count` de Prisma (funciona igual en MySQL) |

### Cambios Necesarios en `schema.prisma`

```diff
datasource db {
-  provider = "postgresql"
+  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**Ajustes de tipos:**
- PostgreSQL `String` con `@db.Text` → MySQL `String` con `@db.LongText` (para `descripcion`, `contenido`, `url` de base64)
- MySQL no soporta `@db.Uuid` nativo con Prisma como PostgreSQL → usar `String` con `@id @default(uuid())` (ya es así en el esquema)
- Los enums de PostgreSQL no existen en MySQL → los campos string con validación por aplicación son compatibles
- `DateTime @default(now())` → compatible
- `Boolean @default(false)` → compatible

### Esquema MySQL Completo

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sgpe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sgpe;

-- Tabla Usuario
CREATE TABLE Usuario (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE', 'VIEWER') NOT NULL DEFAULT 'MIEMBRO',
  activo BOOLEAN NOT NULL DEFAULT true,
  estado ENUM('ACTIVO', 'AUSENTE', 'NO_MOLESTAR', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  tokenRecupera VARCHAR(255) NULL,
  tokenExpira DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla Proyecto
CREATE TABLE Proyecto (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  fechaInicio DATE NOT NULL,
  fechaFin DATE NULL,
  estado ENUM('ACTIVO', 'EN_PAUSA', 'CERRADO') NOT NULL DEFAULT 'ACTIVO',
  cliente VARCHAR(200) NULL,
  gerenteId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gerenteId) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_proyecto_estado ON Proyecto(estado);
CREATE INDEX idx_proyecto_gerenteId ON Proyecto(gerenteId);

-- Tabla ProyectoUsuario (junction table)
CREATE TABLE ProyectoUsuario (
  id VARCHAR(36) PRIMARY KEY,
  proyectoId VARCHAR(36) NOT NULL,
  usuarioId VARCHAR(36) NOT NULL,
  asignadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_proyecto_usuario (proyectoId, usuarioId),
  FOREIGN KEY (proyectoId) REFERENCES Proyecto(id) ON DELETE CASCADE,
  FOREIGN KEY (usuarioId) REFERENCES Usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pu_usuarioId ON ProyectoUsuario(usuarioId);

-- Tabla Tarea
CREATE TABLE Tarea (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  prioridad ENUM('ALTA', 'MEDIA', 'BAJA') NOT NULL DEFAULT 'MEDIA',
  estado ENUM('PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'TERMINADA') NOT NULL DEFAULT 'PENDIENTE',
  fechaLimite DATETIME NULL,
  orden INT NOT NULL DEFAULT 0,
  horasEstimadas DOUBLE NULL,
  horasReales DOUBLE NULL,
  proyectoId VARCHAR(36) NOT NULL,
  asignadoAId VARCHAR(36) NULL,
  creadoPorId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proyectoId) REFERENCES Proyecto(id) ON DELETE CASCADE,
  FOREIGN KEY (asignadoAId) REFERENCES Usuario(id) ON DELETE SET NULL,
  FOREIGN KEY (creadoPorId) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_tarea_estado ON Tarea(estado);
CREATE INDEX idx_tarea_proyectoId ON Tarea(proyectoId);
CREATE INDEX idx_tarea_asignadoAId ON Tarea(asignadoAId);
CREATE INDEX idx_tarea_proyecto_estado ON Tarea(proyectoId, estado);

-- Tabla Subtarea
CREATE TABLE Subtarea (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT false,
  tareaId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tareaId) REFERENCES Tarea(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_subtarea_tareaId ON Subtarea(tareaId);

-- Tabla HistorialEstado
CREATE TABLE HistorialEstado (
  id VARCHAR(36) PRIMARY KEY,
  tareaId VARCHAR(36) NOT NULL,
  estadoAnterior VARCHAR(20) NOT NULL,
  estadoNuevo VARCHAR(20) NOT NULL,
  cambiadoPorId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tareaId) REFERENCES Tarea(id) ON DELETE CASCADE,
  FOREIGN KEY (cambiadoPorId) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_historial_tareaId ON HistorialEstado(tareaId);

-- Tabla Comentario
CREATE TABLE Comentario (
  id VARCHAR(36) PRIMARY KEY,
  contenido TEXT NOT NULL,
  tareaId VARCHAR(36) NOT NULL,
  autorId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tareaId) REFERENCES Tarea(id) ON DELETE CASCADE,
  FOREIGN KEY (autorId) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_comentario_tareaId ON Comentario(tareaId);

-- Tabla Archivo
CREATE TABLE Archivo (
  id VARCHAR(36) PRIMARY KEY,
  url LONGTEXT NOT NULL,       -- NOTA: Migrar a almacenamiento local/S3. Guardar ruta en vez de base64.
  nombre VARCHAR(255) NOT NULL,
  tareaId VARCHAR(36) NOT NULL,
  subidoPorId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tareaId) REFERENCES Tarea(id) ON DELETE CASCADE,
  FOREIGN KEY (subidoPorId) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_archivo_tareaId ON Archivo(tareaId);

-- Tabla Notificacion
CREATE TABLE Notificacion (
  id VARCHAR(36) PRIMARY KEY,
  mensaje TEXT NOT NULL,
  tipo ENUM('TAREA_ASIGNADA', 'COMENTARIO', 'ESTADO_CAMBIO', 'VENCIMIENTO', 'SISTEMA') NOT NULL DEFAULT 'SISTEMA',
  leida BOOLEAN NOT NULL DEFAULT false,
  usuarioId VARCHAR(36) NOT NULL,
  referenciaId VARCHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES Usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notificacion_usuario_leida ON Notificacion(usuarioId, leida);
CREATE INDEX idx_notificacion_createdAt ON Notificacion(usuarioId, createdAt DESC);

-- Tabla Hito
CREATE TABLE Hito (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  fecha DATE NOT NULL,
  completado BOOLEAN NOT NULL DEFAULT false,
  proyectoId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proyectoId) REFERENCES Proyecto(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_hito_proyectoId ON Hito(proyectoId);
```

> **Nota:** El esquema MySQL añade índices que faltaban y un campo `tipo` y `referenciaId` en Notificacion para mejorar la deduplicación del cron job (bug M17).

### Pasos Ordenados para la Migración

1. **Instalar MySQL 8.0+** localmente (o usar Docker: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=sgpe mysql:8.0`)

2. **Exportar datos de Supabase** usando `pg_dump`:
   ```bash
   pg_dump "postgresql://postgres:Js1138077112@db.sauormcjhjeukdbecvxd.supabase.co:5432/postgres" \
     --data-only --inserts --column-inserts > supabase_data.sql
   ```

3. **Convertir el dump de PostgreSQL a MySQL** (los INSERT de pg_dump pueden necesitar ajustes):
   - Reemplazar `true` → `1`, `false` → `0` (booleans)
   - Reemplazar comillas dobles en nombres de columna → backticks
   - Ajustar formato de fechas si es necesario
   - Herramienta sugerida: `pgloader` o script manual con sed

4. **Crear tablas en MySQL** ejecutando el SQL de arriba

5. **Importar datos** a MySQL

6. **Actualizar `backend/.env`**:
   ```
   DATABASE_URL="mysql://root:root@localhost:3306/sgpe"
   ```

7. **Actualizar `backend/prisma/schema.prisma`**:
   - Cambiar `provider = "postgresql"` → `provider = "mysql"`
   - Añadir `@db.Text` / `@db.LongText` donde sea necesario (campos `descripcion`, `contenido`, `url`)
   - Añadir `@@index` y `referencedColumns` donde se requiera

8. **Ejecutar migración Prisma**:
   ```bash
   cd backend
   npx prisma db pull        # O generar desde cero
   npx prisma generate       # Regenerar cliente Prisma
   ```

9. **Ejecutar seed** para verificar (opcional, en entorno dev):
   ```bash
   npx prisma db seed
   ```

10. **Probar la aplicación** completa:
    - Login, CRUD de proyectos/tareas, kanban, reportes, archivos, notificaciones
    - Verificar que todas las queries de Prisma funcionan sin errores de sintaxis SQL

11. **(Recomendado) Migrar almacenamiento de archivos** de base64 a sistema de archivos local en este mismo paso:
    - Añadir middleware Express para servir `/uploads` como estático
    - Guardar archivos en `backend/uploads/` con nombre único
    - Guardar ruta relativa en `Archivo.url` en vez de base64
    - Endpoint `GET /api/archivos/:id/download` que sirva el archivo con `res.sendFile()`

### Lo que NO necesita migración

Dado que el proyecto no usa:
- Supabase Auth → ✅ Sigue usando JWT propio
- Row Level Security (RLS) → ✅ La lógica de permisos está en middlewares Express
- Supabase Realtime → ✅ No hay suscripciones en tiempo real
- Supabase Storage → ✅ Los archivos se guardan en BD (debe mejorarse aparte)
- Supabase SDK (`@supabase/supabase-js`) → ✅ No está instalado

La migración es exclusivamente de PostgreSQL a MySQL a nivel de base de datos. El código de la aplicación **no requiere ningún cambio en la lógica de negocio.**

### Riesgos de la Migración

| Riesgo | Mitigación |
|---|---|
| **Datos existentes en Supabase** (producción) | Hacer backup completo antes. Validar integridad post-migración. |
| **Diferencias de sintaxis SQL** | Prisma abstrae la mayoría. Probar cada query manualmente. |
| **UUIDs en MySQL** | MySQL 8.0 soporta `UUID_TO_BIN()`/`BIN_TO_UUID()` pero Prisma usa strings VARCHAR(36). Sin cambios necesarios. |
| **Text search (LIKE)** | PostgreSQL tiene mejor full-text search. Si se necesita búsqueda avanzada, evaluar Elasticsearch o MySQL FULLTEXT INDEX. |
| **ENUM en MySQL vs CHECK en PostgreSQL** | MySQL ENUM es más restrictivo. Asegurar que los valores enviados por la app coinciden exactamente. |

---

## 📋 RESUMEN DE PRIORIDADES

### Acciones Inmediatas (esta semana)

1. ✅ **Fix C1**: Reordenar rutas en `tarea.routes.ts` (GET /mis-tareas inalcanzable)
2. ✅ **Fix C2**: Enviar `contrasenaActual` en cambio de password en PerfilPage
3. ✅ **Fix C3**: Quitar Content-Type manual en upload de archivos
4. ✅ **Fix C4**: Centralizar 1 única instancia de PrismaClient
5. ✅ **Fix O1**: Memoizar AuthContext value + handlers
6. ✅ **Fix M1**: Demo autofill en LoginPage con `setValue()`

### Corto Plazo (2 semanas)

7. 🔧 **Fix C5**: Migrar almacenamiento de archivos de base64 a filesystem
8. 🔧 **Fix M7**: Corregir validación de rol en registro
9. 🔧 **Fix M6**: Arreglar auto-refresh en UsuariosPage
10. 🔧 **Fix M10**: Añadir EN_REVISION a datos de reporte
11. 🔧 **Agregar índices** en schema.prisma para queries frecuentes
12. 🔧 **Implementar ErrorBoundary** global

### Medio Plazo (1 mes)

13. 📦 **Ejecutar migración Supabase → MySQL local** (FASE 5 completa)
14. 📦 **Añadir paginación** a todos los endpoints de lista
15. 📦 **Refactorizar archivos grandes** (DashboardPage, ProyectoDetailPage, TareaDetailPage, Navbar)
16. 📦 **Implementar editar/eliminar comentarios**
17. 📦 **Implementar GET/download de archivos**
18. 📦 **Añadir rate limiting global**

### Largo Plazo (2-3 meses)

19. 🚀 **Módulo CRM** (entidad Cliente, pipeline)
20. 🚀 **Módulo Facturación** (presupuestos, facturas, reportes financieros)
21. 🚀 **Módulo Inventario** (almacenes, stock)
22. 🚀 **Mejoras UX**: skeleton variants, dirty-form detection, keyboard shortcuts, a11y (focus trap, roles, aria)
23. 🚀 **WebSocket/SSE** para notificaciones en tiempo real (reemplazar polling)
24. 🚀 **Refresh token** + invalidación de JWT

---

*Informe generado automáticamente mediante auditoría de código estático. Todos los hallazgos fueron verificados contra el código fuente.*
