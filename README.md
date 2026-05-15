# SGPE - Sistema de Gestión de Proyectos para Empresas

Sistema completo de gestión de proyectos con verificación por email, WebSocket en tiempo real, kanban, calendario, reportes PDF, y modo claro/oscuro.

---

## 🚀 Despliegue

### Producción
- **Frontend:** [Vercel](https://vercel.com) → Directorio raíz: `frontend` → Build: `npm run build`
- **Backend:** [Railway](https://railway.app) → Directorio raíz: `backend` → Start: `npm start`
- **Base de datos:** [Supabase](https://supabase.com) (PostgreSQL)
- **Correos:** [Resend](https://resend.com) o SMTP (Gmail/Mailtrap)

### Variables de Entorno

**Backend (.env):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secreto_aqui
PORT=5000
FRONTEND_URL=https://tudominio.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM="SGPE <tu_correo@gmail.com>"
```

**Frontend (Vercel):**
```env
VITE_API_URL=https://tu-backend.railway.app
```

---

## 📋 Desarrollo Local

### Requisitos
- **Node.js** 18+
- **Cuenta Supabase** (PostgreSQL)
- **Cuenta Resend** (opcional, para correos)

### Instalación
```bash
git clone https://github.com/tu-usuario/SGPE.git
cd SGPE
npm run install:all
```

Configurar `backend/.env` con tus credenciales de Supabase y JWT.

### Ejecutar
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## ✨ Características

### Autenticación y Seguridad
- **Verificación por email** - Código de verificación al registrarse usando Resend
- **JWT** con roles (Admin, Gerente, Miembro, Cliente)
- **Rate limiting** - Bloqueo tras 5 intentos fallidos de login
- **Recuperación de contraseña** con token por email
- **Sanitización HTML** - DOMPurify en contenido generado por usuarios

### Frontend
- **Login 3D** - Esferas animadas con React Three Fiber (se desactiva en dispositivos low-end)
- **Dashboard** - Contadores animados con GSAP, gráficas Recharts (barras, área, pastel, radial)
- **Kanban** - Drag & Drop con Framer Motion, confetti al completar tareas
- **Project Cards** - Efecto 3D tilt al hover
- **Calendario** - Vista mensual con tareas e hitos, colores por estado
- **Modo claro/oscuro** - Paleta dinámica con CSS variables, persistencia en localStorage
- **Rendimiento adaptable** - Detección automática de dispositivo (low-end/mid-range/high-end)
- **Notificaciones en tiempo real** - Badge animado, Notification API del navegador
- **Command Palette** - Búsqueda rápida con Ctrl+K
- **Carga perezosa** - Bundle splitting (three.js, framer, recharts, gsap en chunks separados)

### Backend
- **API REST** - 16 rutas: auth, usuarios, proyectos, tareas, comentarios, archivos, notificaciones, reportes, actividad, calendario, chat, verificación
- **WebSocket (Socket.IO)** - Presencia en tiempo real, rooms por proyecto, typing indicator, cambios de estado
- **Rate limiting** - express-rate-limit con whitelist de IPs de confianza
- **Cron jobs** - Alertas de vencimiento cada hora
- **Reportes PDF** - Descargables por proyecto con PDFKit
- **Notificaciones** - Sistema interno con deduplicación automática
- **Historial de actividad** - Paginado, por proyecto/tarea
- **Time tracking** - Seguimiento de horas reales por tarea
- **Subida de archivos** - Multer con validación de tipo y tamaño
- **Swagger** - Documentación interactiva de la API

### Correos Electrónicos
- **Verificación de cuenta** - Código de 6 dígitos, reenviable cada 60s
- **Bienvenida** - Email HTML responsive con CTA
- **Recuperación de contraseña** - Link temporal seguro
- **Alertas de vencimiento** - Enviadas por cron cada hora
- **Plantillas** - Diseño minimalista modo oscuro

---

## 📁 Estructura del Proyecto

```
SGPE/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     (PostgreSQL - Supabase)
│   │   └── seed.ts
│   ├── src/
│   │   ├── index.ts          (Express + Socket.IO server)
│   │   ├── lib/              (prisma, socket compartido)
│   │   ├── middlewares/      (auth, roles, errorHandler)
│   │   ├── routes/           (16 rutas REST API)
│   │   └── services/         (email, cron, notificaciones, resend)
│   └── .env
├── frontend/
│   └── src/
│       ├── components/       (Navbar, Sidebar, Kanban, Modal, etc.)
│       ├── pages/            (18 páginas)
│       ├── context/          (AuthContext con socket)
│       ├── hooks/            (usePresencia, useNotificaciones, useDevicePerformance)
│       └── services/         (API con Axios, WebSocket)
├── database/
├── docker-compose.yml
├── package.json              (root: concurrently frontend + backend)
└── README.md
```

---

## 🧰 Tecnologías

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Framer Motion, React Three Fiber, GSAP, Recharts, React Hook Form + Zod, Axios, Socket.IO Client

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Supabase), JWT, Bcrypt, Nodemailer/Resend, PDFKit, Socket.IO, Swagger

**DevOps:** Docker, Railway, Vercel, Supabase
