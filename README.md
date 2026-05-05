# SGPE - Sistema de Gestión de Proyectos para Empresas

## 🚀 Despliegue

### Producción
- **Frontend:** [Vercel](https://vercel.com) → Conectar repo → Root: `frontend` → Build: `npm run build`
- **Backend:** [Railway](https://railway.app) → Conectar repo → Root: `backend` → Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
- **Base de datos:** [Supabase](https://supabase.com) (PostgreSQL)

### Variables de Entorno

**Backend (.env):**
```
DATABASE_URL=
JWT_SECRET=
NODE_ENV=
FRONTEND_URL=
```

**Frontend (Vercel):**
```
VITE_API_URL=
```

---

## 📋 Desarrollo Local

### Requisitos
1. **Node.js** 18+
2. **Cuenta en Supabase** (ya configurada)

### Instalación
```bash
npm run install:all
```

### Ejecutar
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🎨 Características

### Frontend
- **Login 3D**: Esferas animadas con React Three Fiber
- **Dashboard**: Contadores animados con GSAP, gráficas Recharts
- **Kanban**: Drag & Drop con Framer Motion, confetti al completar
- **Project Cards**: Efecto 3D tilt al hover
- **Transiciones**: AnimatePresence entre páginas
- **Dark mode** moderno con paleta indigo/violeta

### Backend
- **JWT** autenticación con roles (Admin, Gerente, Miembro, Cliente)
- **Rate limiting**: Bloqueo tras 5 intentos fallidos de login
- **Cron jobs**: Alertas de vencimiento cada hora
- **PDF**: Reportes descargables por proyecto
- **Notificaciones**: Sistema interno con badge animado
- **WebSocket**: Socket.IO para presencia y cambios en tiempo real

---

## 📁 Estructura del Proyecto

```
SGPE/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     (PostgreSQL - Supabase)
│   │   └── seed.ts
│   ├── src/
│   │   ├── index.ts          (servidor Express + Socket.IO)
│   │   ├── middlewares/      (auth, roles, errors)
│   │   ├── routes/           (14 rutas REST API)
│   │   └── services/         (email, cron, notificaciones)
│   └── .env                  (DATABASE_URL Supabase)
├── frontend/
│   └── src/
│       ├── components/        (Sidebar, Kanban, Cards, Modals)
│       ├── pages/             (17 páginas)
│       ├── context/           (AuthContext)
│       ├── hooks/             (useNotificaciones)
│       └── services/          (API con Axios)
├── package.json               (root: concurrently)
└── README.md
```

## Tecnologías

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Framer Motion, React Three Fiber, GSAP, Recharts, React Hook Form + Zod, Axios

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Supabase), JWT, Bcrypt, Nodemailer, PDFKit, Socket.IO
