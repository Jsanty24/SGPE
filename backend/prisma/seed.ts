import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos...');
  await prisma.$transaction([
    prisma.historialEstado.deleteMany(),
    prisma.subtarea.deleteMany(),
    prisma.archivo.deleteMany(),
    prisma.archivoProyecto.deleteMany(),
    prisma.comentario.deleteMany(),
    prisma.mensajeChat.deleteMany(),
    prisma.notificacion.deleteMany(),
    prisma.tarea.deleteMany(),
    prisma.hito.deleteMany(),
    prisma.proyectoUsuario.deleteMany(),
    prisma.proyecto.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);

  const hash = await bcrypt.hash('Admin123*', 12);

  console.log('👥 Creando usuarios...');
  const admin = await prisma.usuario.create({
    data: { codigo: 1, nombre: 'Martín Páez', correo: 'admin@sgpe.com', contrasena: hash, rol: 'ADMIN', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const gerente1 = await prisma.usuario.create({
    data: { codigo: 2, nombre: 'Laura Castillo', correo: 'laura@sgpe.com', contrasena: hash, rol: 'GERENTE', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const gerente2 = await prisma.usuario.create({
    data: { codigo: 3, nombre: 'Carlos Mendoza', correo: 'carlos@sgpe.com', contrasena: hash, rol: 'GERENTE', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const miembro1 = await prisma.usuario.create({
    data: { codigo: 4, nombre: 'Ana García', correo: 'ana@sgpe.com', contrasena: hash, rol: 'MIEMBRO', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const miembro2 = await prisma.usuario.create({
    data: { codigo: 5, nombre: 'Diego Rojas', correo: 'diego@sgpe.com', contrasena: hash, rol: 'MIEMBRO', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const miembro3 = await prisma.usuario.create({
    data: { codigo: 6, nombre: 'Sofía Herrera', correo: 'sofia@sgpe.com', contrasena: hash, rol: 'MIEMBRO', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const miembro4 = await prisma.usuario.create({
    data: { codigo: 7, nombre: 'Jorge Núñez', correo: 'jorge@sgpe.com', contrasena: hash, rol: 'MIEMBRO', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const cliente1 = await prisma.usuario.create({
    data: { codigo: 8, nombre: 'Ricardo Vidal', correo: 'ricardo@sgpe.com', contrasena: hash, rol: 'CLIENTE', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });
  const viewer1 = await prisma.usuario.create({
    data: { codigo: 9, nombre: 'Elena Torres', correo: 'elena@sgpe.com', contrasena: hash, rol: 'VIEWER', activo: true, estado: 'ACTIVO', emailVerificado: true },
  });

  const todos = [admin, gerente1, gerente2, miembro1, miembro2, miembro3, miembro4, cliente1, viewer1];
  const miembros = [miembro1, miembro2, miembro3, miembro4];

  const ahora = new Date();
  const f = (dias: number) => new Date(ahora.getTime() + dias * 86400000);
  const fv = (dias: number) => new Date(ahora.getTime() + dias * 86400000).toISOString();

  console.log('📁 Creando proyectos...');

  // PROYECTO 1 — ACTIVO, App movil
  const p1 = await prisma.proyecto.create({
    data: {
      nombre: 'App Móvil Fintech', descripcion: 'Desarrollo de aplicación móvil para gestión de finanzas personales con integración bancaria y notificaciones push.', cliente: 'Fintech Plus S.A.', fechaInicio: f(-30), fechaFin: f(90), estado: 'ACTIVO', gerenteId: gerente1.id,
      miembros: { create: [{ usuarioId: miembro1.id }, { usuarioId: miembro2.id }, { usuarioId: miembro3.id }] },
    },
  });

  const crearTareas = async (proyectoId: string, asignados: typeof miembros, baseDias: number) => {
    const tareas = [
      { nombre: 'Diseño de wireframes', desc: 'Crear wireframes de baja fidelidad para flujo principal: login, dashboard, transferencias.', prioridad: 'ALTA', estado: 'TERMINADA', dias: 30, horasEst: 24, horasReales: 22, asignado: 0 },
      { nombre: 'Diseño UI en Figma', desc: 'Diseño de alta fidelidad con Design System completo: botones, inputs, cards, tipografía, paleta de colores.', prioridad: 'ALTA', estado: 'TERMINADA', dias: 22, horasEst: 32, horasReales: 30, asignado: 0 },
      { nombre: 'Setup del proyecto React Native', desc: 'Inicializar proyecto con Expo, configurar TypeScript, ESLint, Prettier, Husky, y CI con GitHub Actions.', prioridad: 'ALTA', estado: 'TERMINADA', dias: 20, horasEst: 8, horasReales: 7, asignado: 1 },
      { nombre: 'Autenticación con Firebase', desc: 'Implementar login, registro, recuperación de contraseña con Firebase Auth y validación de formularios.', prioridad: 'ALTA', estado: 'TERMINADA', dias: 15, horasEst: 16, horasReales: 18, asignado: 1 },
      { nombre: 'Integración API bancaria', desc: 'Conectar con API de open banking para obtener saldos, movimientos y realizar transferencias con OAuth 2.0.', prioridad: 'ALTA', estado: 'EN_PROGRESO', dias: -5, horasEst: 40, horasReales: 15, asignado: 2 },
      { nombre: 'Dashboard de gastos con gráficos', desc: 'Pantalla principal con gráficos de torta, barras y resumen de gastos por categoría usando Victory Charts.', prioridad: 'ALTA', estado: 'EN_PROGRESO', dias: -10, horasEst: 24, horasReales: 10, asignado: 0 },
      { nombre: 'Notificaciones push', desc: 'Configurar Firebase Cloud Messaging para alertas de transacciones, presupuestos y recordatorios.', prioridad: 'MEDIA', estado: 'PENDIENTE', dias: 20, horasEst: 12, horasReales: 0, asignado: 1 },
      { nombre: 'Modo oscuro', desc: 'Implementar tema oscuro completo con persistencia en AsyncStorage y transiciones suaves.', prioridad: 'MEDIA', estado: 'PENDIENTE', dias: 25, horasEst: 8, horasReales: 0, asignado: 2 },
      { nombre: 'Test unitarios con Jest', desc: 'Escribir tests unitarios para servicios, hooks personalizados, y utilidades. Cobertura mínima 80%.', prioridad: 'MEDIA', estado: 'PENDIENTE', dias: 35, horasEst: 20, horasReales: 0, asignado: 3 },
      { nombre: 'E2E con Detox', desc: 'Configurar pruebas end-to-end para flujos críticos: registro, login, transferencia, consulta de saldo.', prioridad: 'BAJA', estado: 'PENDIENTE', dias: 45, horasEst: 16, horasReales: 0, asignado: 3 },
      { nombre: 'App Store submission', desc: 'Preparar assets, screenshots, descripción, política de privacidad, y publicar en App Store y Google Play.', prioridad: 'BAJA', estado: 'PENDIENTE', dias: 60, horasEst: 10, horasReales: 0, asignado: 1 },
      { nombre: 'Onboarding interactivo', desc: 'Tutorial paso a paso con animaciones Lottie para primeros usuarios: conectar banco, crear presupuesto.', prioridad: 'MEDIA', estado: 'EN_REVISION', dias: -2, horasEst: 12, horasReales: 10, asignado: 2 },
    ];

    for (const t of tareas) {
      const tarea = await prisma.tarea.create({
        data: {
          nombre: t.nombre, descripcion: t.desc, prioridad: t.prioridad, estado: t.estado,
          fechaLimite: f(baseDias + t.dias), horasEstimadas: t.horasEst, horasReales: (t as any).horasReales,
          proyectoId, asignadoAId: t.dias >= 0 ? asignados[t.asignado].id : null,
          orden: 0,
        },
      });

      // Subtareas para algunas
      if (t.estado !== 'TERMINADA') {
        await prisma.subtarea.createMany({
          data: [
            { titulo: 'Revisar requerimientos', completada: true, tareaId: tarea.id },
            { titulo: 'Implementar solución', completada: t.estado === 'EN_REVISION', tareaId: tarea.id },
            { titulo: 'Probar y documentar', completada: false, tareaId: tarea.id },
          ],
        });
      }

      // Historial de estados
      if (t.estado !== 'PENDIENTE') {
        await prisma.historialEstado.create({
          data: { tareaId: tarea.id, estadoAnterior: 'PENDIENTE', estadoNuevo: t.estado === 'TERMINADA' ? 'EN_PROGRESO' : t.estado, cambiadoPorId: asignados[t.asignado].id },
        });
        if (t.estado === 'TERMINADA') {
          await prisma.historialEstado.create({
            data: { tareaId: tarea.id, estadoAnterior: 'EN_PROGRESO', estadoNuevo: 'TERMINADA', cambiadoPorId: asignados[t.asignado].id },
          });
        }
        if (t.estado === 'EN_REVISION') {
          await prisma.historialEstado.create({
            data: { tareaId: tarea.id, estadoAnterior: 'EN_PROGRESO', estadoNuevo: 'EN_REVISION', cambiadoPorId: asignados[t.asignado].id },
          });
        }
      }

      // Comentarios en tareas no pendientes
      if (t.estado !== 'PENDIENTE') {
        await prisma.comentario.createMany({
          data: [
            { contenido: 'Iniciando trabajo en esta tarea. Revisé los diseños de Figma y todo cuadra.', tareaId: tarea.id, autorId: asignados[t.asignado].id },
            { contenido: t.estado === 'TERMINADA' ? '✅ Tarea completada. Todos los tests pasan y el diseño es pixel-perfect.' : 'Avanzando bien, encontré un edge case con el manejo de errores de la API pero ya lo resolví.', tareaId: tarea.id, autorId: asignados[t.asignado].id },
          ],
        });
      }
    }

    // Hitos
    await prisma.hito.createMany({
      data: [
        { titulo: 'MVP listo para QA', descripcion: 'Funcionalidades core completas y desplegadas en staging.', fecha: f(baseDias + 15), completado: false, proyectoId },
        { titulo: 'Lanzamiento Beta', descripcion: 'Versión beta para usuarios seleccionados.', fecha: f(baseDias + 45), completado: false, proyectoId },
        { titulo: 'Lanzamiento oficial', descripcion: 'Publicación en stores y campaña de marketing.', fecha: f(baseDias + 90), completado: false, proyectoId },
      ],
    });
  };

  await crearTareas(p1.id, [miembro1, miembro2, miembro3, miembro4], 0);

  // PROYECTO 2 — ACTIVO, Plataforma web
  const p2 = await prisma.proyecto.create({
    data: {
      nombre: 'Plataforma E-Learning', descripcion: 'Plataforma web de cursos online con video streaming, progreso del alumno, certificados y panel de administración.', cliente: 'EduTech Global', fechaInicio: f(-60), fechaFin: f(120), estado: 'ACTIVO', gerenteId: gerente2.id,
      miembros: { create: [{ usuarioId: miembro1.id }, { usuarioId: miembro3.id }, { usuarioId: miembro4.id }] },
    },
  });

  await prisma.tarea.createMany({
    data: [
      { nombre: 'Arquitectura del backend', descripcion: 'Definir estructura de microservicios: auth, courses, payments, certificates. Documentar API con Swagger.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-40), horasEstimadas: 16, horasReales: 14, proyectoId: p2.id, asignadoAId: miembro3.id },
      { nombre: 'Modelo de base de datos', descripcion: 'Diseñar schema PostgreSQL con Prisma: usuarios, cursos, lecciones, quizzes, progreso, certificados.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-35), horasEstimadas: 12, horasReales: 10, proyectoId: p2.id, asignadoAId: miembro3.id },
      { nombre: 'Reproductor de video con HLS', descripcion: 'Integrar Video.js con streaming adaptativo HLS para reproducción fluida en cualquier dispositivo y velocidad.', prioridad: 'ALTA', estado: 'EN_PROGRESO', fechaLimite: f(5), horasEstimadas: 20, horasReales: 8, proyectoId: p2.id, asignadoAId: miembro4.id },
      { nombre: 'Sistema de quizzes interactivos', descripcion: 'Crear componente de quiz con preguntas de opción múltiple, verdadero/falso, drag & drop. Corrección automática.', prioridad: 'ALTA', estado: 'EN_PROGRESO', fechaLimite: f(10), horasEstimadas: 24, horasReales: 6, proyectoId: p2.id, asignadoAId: miembro1.id },
      { nombre: 'Panel de administración', descripcion: 'Dashboard para admin: CRUD de cursos, usuarios, reportes de progreso, ingresos. Roles: superadmin, instructor.', prioridad: 'MEDIA', estado: 'PENDIENTE', fechaLimite: f(20), horasEstimadas: 30, horasReales: 0, proyectoId: p2.id, asignadoAId: miembro3.id },
      { nombre: 'Generación de certificados PDF', descripcion: 'Al completar curso, generar certificado personalizado con PDFKit. Datos: nombre, curso, fecha, horas, código QR.', prioridad: 'MEDIA', estado: 'PENDIENTE', fechaLimite: f(30), horasEstimadas: 10, horasReales: 0, proyectoId: p2.id, asignadoAId: miembro4.id },
      { nombre: 'Sistema de pagos con Stripe', descripcion: 'Integrar Stripe Checkout para pagos únicos y suscripciones. Webhooks para activar acceso al curso.', prioridad: 'ALTA', estado: 'EN_REVISION', fechaLimite: f(-3), horasEstimadas: 16, horasReales: 14, proyectoId: p2.id, asignadoAId: miembro1.id },
      { nombre: 'SEO y Open Graph', descripcion: 'Optimizar meta tags, sitemap, robots.txt, schema.org, Open Graph para compartir en redes sociales.', prioridad: 'BAJA', estado: 'PENDIENTE', fechaLimite: f(50), horasEstimadas: 8, horasReales: 0, proyectoId: p2.id, asignadoAId: miembro4.id },
    ],
  });

  // PROYECTO 3 — EN_PAUSA
  const p3 = await prisma.proyecto.create({
    data: {
      nombre: 'Rediseño Portal Corporativo', descripcion: 'Rediseño completo del sitio web corporativo con nuevo branding, blog integrado, y multi-idioma.', cliente: 'Corp International', fechaInicio: f(-90), fechaFin: f(60), estado: 'EN_PAUSA', gerenteId: gerente1.id,
      miembros: { create: [{ usuarioId: miembro2.id }, { usuarioId: miembro4.id }] },
    },
  });

  await prisma.tarea.createMany({
    data: [
      { nombre: 'Auditoría de UX actual', descripcion: 'Analizar métricas del sitio actual: tasa de rebote, heatmaps, encuestas de satisfacción. Identificar puntos de dolor.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-70), horasEstimadas: 8, horasReales: 7, proyectoId: p3.id, asignadoAId: miembro2.id },
      { nombre: 'Nuevo branding y guía de estilo', descripcion: 'Definir nueva identidad visual: logo, paleta, tipografía, iconografía, tone of voice.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-55), horasEstimadas: 20, horasReales: 22, proyectoId: p3.id, asignadoAId: miembro2.id },
      { nombre: 'Diseño responsive home + landing', descripcion: 'Diseñar homepage, landing de servicios, y página de contacto. Mobile-first con breakpoints para tablet y desktop.', prioridad: 'ALTA', estado: 'EN_PROGRESO', fechaLimite: f(10), horasEstimadas: 24, horasReales: 12, proyectoId: p3.id, asignadoAId: miembro4.id },
      { nombre: 'Integración CMS Headless', descripcion: 'Configurar Strapi como CMS headless para blog y páginas institucionales. Conectar con Next.js frontend.', prioridad: 'MEDIA', estado: 'PENDIENTE', fechaLimite: f(30), horasEstimadas: 16, horasReales: 0, proyectoId: p3.id, asignadoAId: miembro4.id },
      { nombre: 'Sistema multi-idioma i18n', descripcion: 'Implementar next-intl con soporte ES/EN. Traducción de contenido estático y dinámico desde CMS.', prioridad: 'MEDIA', estado: 'PENDIENTE', fechaLimite: f(40), horasEstimadas: 12, horasReales: 0, proyectoId: p3.id, asignadoAId: miembro2.id },
    ],
  });

  // PROYECTO 4 — CERRADO
  const p4 = await prisma.proyecto.create({
    data: {
      nombre: 'Sistema de Inventario Interno', descripcion: 'Aplicación web interna para gestión de inventario, stock, proveedores y órdenes de compra.', cliente: 'SGPE (Interno)', fechaInicio: f(-120), fechaFin: f(-10), estado: 'CERRADO', gerenteId: gerente2.id,
      miembros: { create: [{ usuarioId: miembro1.id }, { usuarioId: miembro3.id }] },
    },
  });

  await prisma.tarea.createMany({
    data: [
      { nombre: 'Relevamiento de necesidades', descripcion: 'Entrevistas con equipo de logística para definir requerimientos funcionales y no funcionales.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-110), horasEstimadas: 8, horasReales: 6, proyectoId: p4.id, asignadoAId: miembro1.id },
      { nombre: 'CRUD de productos y stock', descripcion: 'ABM de productos con código de barras, categorías, stock mínimo, precio de costo y venta.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-90), horasEstimadas: 20, horasReales: 18, proyectoId: p4.id, asignadoAId: miembro3.id },
      { nombre: 'Dashboard de reportes', descripcion: 'Reportes exportables a Excel: productos más vendidos, stock bajo, rotación, valuación FIFO.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-60), horasEstimadas: 16, horasReales: 14, proyectoId: p4.id, asignadoAId: miembro1.id },
      { nombre: 'Integración con ERP', descripcion: 'Sincronización bidireccional con SAP Business One via API REST. Mapeo de productos, órdenes y facturas.', prioridad: 'MEDIA', estado: 'TERMINADA', fechaLimite: f(-30), horasEstimadas: 24, horasReales: 28, proyectoId: p4.id, asignadoAId: miembro3.id },
      { nombre: 'Despliegue y capacitación', descripcion: 'Deploy en servidor interno, migración de datos legacy, capacitación a 15 empleados en 3 turnos.', prioridad: 'MEDIA', estado: 'TERMINADA', fechaLimite: f(-10), horasEstimadas: 8, horasReales: 10, proyectoId: p4.id, asignadoAId: miembro1.id },
    ],
  });

  // PROYECTO 5 — ACTIVO, pequeño
  const p5 = await prisma.proyecto.create({
    data: {
      nombre: 'Landing Page Producto SaaS', descripcion: 'Diseño y desarrollo de landing page para nuevo producto SaaS con scroll animations, formulario de demo, y analytics.', cliente: 'CloudFlow Inc.', fechaInicio: f(-5), fechaFin: f(14), estado: 'ACTIVO', gerenteId: gerente1.id,
      miembros: { create: [{ usuarioId: miembro2.id }] },
    },
  });

  await prisma.tarea.createMany({
    data: [
      { nombre: 'Diseño de la landing en Figma', descripcion: 'Diseñar hero section, features grid, pricing table, testimonials, FAQ, y footer con CTA.', prioridad: 'ALTA', estado: 'TERMINADA', fechaLimite: f(-2), horasEstimadas: 12, horasReales: 11, proyectoId: p5.id, asignadoAId: miembro2.id },
      { nombre: 'Maquetación HTML/CSS', descripcion: 'Convertir diseño a Next.js con Tailwind. Animaciones con Framer Motion: parallax, fade-in, scroll-trigger.', prioridad: 'ALTA', estado: 'EN_PROGRESO', fechaLimite: f(3), horasEstimadas: 16, horasReales: 5, proyectoId: p5.id, asignadoAId: miembro2.id },
      { nombre: 'Formulario de solicitud demo', descripcion: 'Formulario multi-step con validación, integración con HubSpot API para crear leads automáticamente.', prioridad: 'MEDIA', estado: 'PENDIENTE', fechaLimite: f(7), horasEstimadas: 8, horasReales: 0, proyectoId: p5.id, asignadoAId: miembro2.id },
      { nombre: 'Configurar Google Analytics 4', descripcion: 'Instalar GA4, crear eventos personalizados (click CTA, scroll depth, form start/complete), conectar con Google Ads.', prioridad: 'BAJA', estado: 'PENDIENTE', fechaLimite: f(10), horasEstimadas: 4, horasReales: 0, proyectoId: p5.id, asignadoAId: miembro2.id },
      { nombre: 'Optimización de rendimiento', descripcion: 'Lighthouse score > 90 en mobile y desktop. Optimizar imágenes con next/image, lazy loading, minimizar CSS/JS.', prioridad: 'MEDIA', estado: 'PENDIENTE', fechaLimite: f(12), horasEstimadas: 6, horasReales: 0, proyectoId: p5.id, asignadoAId: miembro2.id },
    ],
  });

  // Hitos para proyectos sin hitos
  await prisma.hito.createMany({
    data: [
      { titulo: 'Diseño aprobado', fecha: f(5), completado: true, proyectoId: p2.id },
      { titulo: 'Demo a cliente', fecha: f(25), proyectoId: p2.id },
      { titulo: 'Lanzamiento', fecha: f(90), proyectoId: p2.id },
      { titulo: 'Demo lista', fecha: f(10), proyectoId: p5.id },
      { titulo: 'Publicación', fecha: f(14), proyectoId: p5.id },
    ],
  });

  // Miembros adicionales para visibilidad
  await prisma.proyectoUsuario.createMany({
    data: [
      { proyectoId: p1.id, usuarioId: miembro4.id },
      { proyectoId: p2.id, usuarioId: miembro2.id },
      { proyectoId: p2.id, usuarioId: cliente1.id },
      { proyectoId: p1.id, usuarioId: cliente1.id },
    ],
  });

  // Chat messages
  await prisma.mensajeChat.createMany({
    data: [
      { contenido: 'Buen día equipo! Cómo va el avance de la integración bancaria?', proyectoId: p1.id, autorId: gerente1.id },
      { contenido: 'Va bien! Ya tengo el OAuth funcionando y estoy mapeando los endpoints de saldos.', proyectoId: p1.id, autorId: miembro3.id },
      { contenido: 'Genial! El cliente preguntó si podemos tener una demo la próxima semana.', proyectoId: p1.id, autorId: gerente1.id },
      { contenido: 'Para la demo necesitamos tener al menos el dashboard de gastos funcionando. @Ana cómo vas con eso?', proyectoId: p1.id, autorId: gerente1.id },
      { contenido: 'Estoy terminando los gráficos de torta. Para el viernes está listo el dashboard completo.', proyectoId: p1.id, autorId: miembro1.id },
    ],
  });

  // Notificaciones variadas para todos los usuarios
  console.log('🔔 Creando notificaciones...');

  const ahora2 = new Date();
  const hace = (horas: number) => new Date(ahora2.getTime() - horas * 3600000);

  await prisma.notificacion.createMany({
    data: [
      // Admin
      { usuarioId: admin.id, mensaje: '🎉 Bienvenido a SGPE! El sistema esta listo para gestionar tus proyectos.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: admin.id, mensaje: '📊 5 proyectos activos en el sistema. Revisa el dashboard para ver el progreso.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.2) },
      { usuarioId: admin.id, mensaje: '👥 Se han registrado 9 usuarios en la plataforma.', tipo: 'SISTEMA', leida: true, createdAt: hace(24) },

      // Laura (Gerente 1)
      { usuarioId: gerente1.id, mensaje: '🎉 Bienvenida a SGPE, Laura! Tienes 2 proyectos asignados como gerente.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: gerente1.id, mensaje: '✅ Ana Garcia marco como terminada "Diseño de wireframes" en App Movil Fintech.', tipo: 'ESTADO_CAMBIO', referenciaId: 'task-1', referenciaType: 'tarea', leida: false, createdAt: hace(1) },
      { usuarioId: gerente1.id, mensaje: '✅ Ana Garcia marco como terminada "Diseno UI en Figma" en App Movil Fintech.', tipo: 'ESTADO_CAMBIO', referenciaId: 'task-2', referenciaType: 'tarea', leida: true, createdAt: hace(2) },
      { usuarioId: gerente1.id, mensaje: '🚀 La tarea "Integracion API bancaria" esta en progreso por Sofia Herrera.', tipo: 'ESTADO_CAMBIO', referenciaId: 'task-5', referenciaType: 'tarea', leida: false, createdAt: hace(3) },
      { usuarioId: gerente1.id, mensaje: '💬 Tienes 5 mensajes nuevos en el chat de App Movil Fintech.', tipo: 'CHAT_MENSAJE', leida: false, createdAt: hace(0.5) },
      { usuarioId: gerente1.id, mensaje: '📅 El hito "MVP listo para QA" vence en 15 dias en App Movil Fintech.', tipo: 'VENCIMIENTO', leida: false, createdAt: hace(0.3) },

      // Carlos (Gerente 2)
      { usuarioId: gerente2.id, mensaje: '🎉 Bienvenido a SGPE, Carlos! Tienes 2 proyectos como gerente.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: gerente2.id, mensaje: '✅ Jorge Nunez completo "Arquitectura del backend" en Plataforma E-Learning.', tipo: 'ESTADO_CAMBIO', leida: false, createdAt: hace(5) },
      { usuarioId: gerente2.id, mensaje: '🔍 "Sistema de pagos con Stripe" esta en revision por Ana Garcia.', tipo: 'ESTADO_CAMBIO', leida: false, createdAt: hace(4) },
      { usuarioId: gerente2.id, mensaje: '📅 El proyecto "Plataforma E-Learning" tiene fecha de entrega en 120 dias.', tipo: 'VENCIMIENTO', leida: true, createdAt: hace(48) },

      // Ana (Miembro 1)
      { usuarioId: miembro1.id, mensaje: '🎉 Bienvenida a SGPE, Ana! Estas asignada a 3 proyectos.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: miembro1.id, mensaje: '📋 Se te asigno "Dashboard de gastos con graficos" en App Movil Fintech.', tipo: 'TAREA_ASIGNADA', referenciaId: 'task-6', referenciaType: 'tarea', leida: false, createdAt: hace(1) },
      { usuarioId: miembro1.id, mensaje: '📋 Nueva tarea: "Sistema de quizzes interactivos" en Plataforma E-Learning.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(2) },
      { usuarioId: miembro1.id, mensaje: '💬 Laura Castillo te menciono en el chat: "@Ana como vas con eso?"', tipo: 'MENCION', leida: false, createdAt: hace(0.5) },
      { usuarioId: miembro1.id, mensaje: '📅 La tarea "Dashboard de gastos" vencio hace 10 dias. Actualiza el estado.', tipo: 'VENCIMIENTO', referenciaId: 'task-6', referenciaType: 'tarea', leida: true, createdAt: hace(12) },

      // Diego (Miembro 2)
      { usuarioId: miembro2.id, mensaje: '🎉 Bienvenido a SGPE, Diego! Estas en 3 proyectos.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: miembro2.id, mensaje: '📋 Se te asigno "Modo oscuro" en App Movil Fintech.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(1) },
      { usuarioId: miembro2.id, mensaje: '📋 Nueva tarea: "Maquetacion HTML/CSS" en Landing Page Producto SaaS.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(3) },
      { usuarioId: miembro2.id, mensaje: '✅ Tu tarea "Diseno de la landing en Figma" fue marcada como terminada.', tipo: 'ESTADO_CAMBIO', leida: true, createdAt: hace(4) },

      // Sofia (Miembro 3)
      { usuarioId: miembro3.id, mensaje: '🎉 Bienvenida a SGPE, Sofia! Estas en 3 proyectos.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: miembro3.id, mensaje: '📋 Se te asigno "Test unitarios con Jest" en App Movil Fintech.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(1) },
      { usuarioId: miembro3.id, mensaje: '📋 Nueva tarea: "Panel de administracion" en Plataforma E-Learning.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(2) },
      { usuarioId: miembro3.id, mensaje: '📅 La tarea "Integracion API bancaria" esta proxima a vencer.', tipo: 'VENCIMIENTO', referenciaId: 'task-5', referenciaType: 'tarea', leida: false, createdAt: hace(0.3) },

      // Jorge (Miembro 4)
      { usuarioId: miembro4.id, mensaje: '🎉 Bienvenido a SGPE, Jorge! Estas en 3 proyectos.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: miembro4.id, mensaje: '📋 Se te asigno "E2E con Detox" en App Movil Fintech.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(1) },
      { usuarioId: miembro4.id, mensaje: '📋 Nueva tarea: "Generacion de certificados PDF" en E-Learning.', tipo: 'TAREA_ASIGNADA', leida: false, createdAt: hace(2) },

      // Cliente y Viewer
      { usuarioId: cliente1.id, mensaje: '🎉 Bienvenido a SGPE, Ricardo! Puedes ver los proyectos compartidos contigo.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
      { usuarioId: cliente1.id, mensaje: '📊 Se compartio contigo el proyecto "App Movil Fintech" para seguimiento.', tipo: 'SISTEMA', leida: false, createdAt: hace(1) },
      { usuarioId: viewer1.id, mensaje: '🎉 Bienvenida a SGPE, Elena! Tu rol es de solo lectura.', tipo: 'SISTEMA', leida: false, createdAt: hace(0.1) },
    ],
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('   Usuarios de prueba (contraseña: Admin123*):');
  console.log('   admin@sgpe.com     → Administrador');
  console.log('   laura@sgpe.com     → Gerente');
  console.log('   carlos@sgpe.com    → Gerente');
  console.log('   ana@sgpe.com       → Miembro');
  console.log('   diego@sgpe.com     → Miembro');
  console.log('   sofia@sgpe.com     → Miembro');
  console.log('   jorge@sgpe.com     → Miembro');
  console.log('   ricardo@sgpe.com   → Cliente');
  console.log('   elena@sgpe.com     → Visitante');
  console.log('');
  console.log('   5 proyectos | 35+ tareas en todos los estados');
  console.log('   Hitos próximos | Comentarios | Historial | Chat');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
