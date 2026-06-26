const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Contraseña temporal para TODO el equipo de IT.
// Cada persona debe cambiarla la primera vez que entre al sistema.
const PASSWORD_TEMPORAL = 'Baprosa2026!';

async function main() {
  console.log('========================================');
  console.log('Iniciando seed del sistema Help Desk Baprosa');
  console.log('========================================\n');

  // ── 1. ÁREAS DE IT ──────────────────────────────────────────
  console.log('Creando áreas de IT...');

  const areaDesarrollo = await prisma.area.upsert({
    where: { nombre: 'Desarrollo Web' },
    update: {},
    create: { nombre: 'Desarrollo Web' },
  });

  const areaSoporte = await prisma.area.upsert({
    where: { nombre: 'Soporte Técnico' },
    update: {},
    create: { nombre: 'Soporte Técnico' },
  });

  const areaRutas = await prisma.area.upsert({
    where: { nombre: 'Analista de Rutas' },
    update: {},
    create: { nombre: 'Analista de Rutas' },
  });

  console.log('  Áreas creadas: Desarrollo Web, Soporte Técnico, Analista de Rutas\n');

  // ── 2. EQUIPO DE IT (superadmin + admins) ──────────────────
  console.log('Creando equipo de IT...');
  const passwordHash = await bcrypt.hash(PASSWORD_TEMPORAL, 10);

  async function crearMiembroIT({ username, name, email, role, areaId }) {
    return prisma.user.upsert({
      where: { username },
      update: {},
      create: { username, password: passwordHash, name, email, role, areaId },
    });
  }

  // Fredy: SUPERADMIN, pero también pertenece a Desarrollo Web para poder
  // aparecer en la lista de asesores y resolver tickets directamente.
  const fredy = await crearMiembroIT({
    username: 'f.fajardo',
    name: 'Fredy Fajardo',
    email: 'f.fajardo@baprosa.com',
    role: 'SUPERADMIN',
    areaId: areaDesarrollo.id,
  });

  const luis = await crearMiembroIT({
    username: 'l.salgado',
    name: 'Luis Salgado',
    email: 'l.salgado@baprosa.com',
    role: 'ADMIN',
    areaId: areaDesarrollo.id,
  });

  const arnold = await crearMiembroIT({
    username: 'a.sanchez',
    name: 'Arnold Sánchez',
    email: 'a.sanchez@baprosa.com',
    role: 'ADMIN',
    areaId: areaDesarrollo.id,
  });

  const manuel = await crearMiembroIT({
    username: 'm.flores',
    name: 'Manuel Flores',
    email: 'm.flores@baprosa.com',
    role: 'ADMIN',
    areaId: areaSoporte.id,
  });

  const erick = await crearMiembroIT({
    username: 'e.rapalo',
    name: 'Erick Rapalo',
    email: 'e.rapalo@baprosa.com',
    role: 'ADMIN',
    areaId: areaRutas.id,
  });

 const practicaitAdmin = await crearMiembroIT({
    username: 'practicait.admin',
    name: 'PracticaIT (Asesor de Prueba)',
    email: 'practicait@baprosa.com',
    role: 'ADMIN',
    areaId: areaSoporte.id,
  });

  console.table([
    { nombre: fredy.name, usuario: fredy.username, rol: fredy.role, area: 'Desarrollo Web' },
    { nombre: luis.name, usuario: luis.username, rol: luis.role, area: 'Desarrollo Web' },
    { nombre: arnold.name, usuario: arnold.username, rol: arnold.role, area: 'Desarrollo Web' },
    { nombre: manuel.name, usuario: manuel.username, rol: manuel.role, area: 'Soporte Técnico' },
    { nombre: erick.name, usuario: erick.username, rol: erick.role, area: 'Analista de Rutas' },
     { nombre: practicaitAdmin.name, usuario: practicaitAdmin.username, rol: practicaitAdmin.role, area: 'Soporte Técnico (PRUEBA)' },
  ]);
  console.log(`Contraseña temporal para todos: ${PASSWORD_TEMPORAL}\n`);

  // ── 3. USUARIO DE PRUEBA (empleado normal, para seguir probando) ──
  const empleadoPrueba = await crearMiembroIT({
    username: 'empleado.prueba',
    name: 'Empleado de Prueba',
    email: 'empleado.prueba@baprosa.com',
    role: 'USER',
    areaId: null,
  });
  // Los USER usan areaEmpresa (texto libre), no areaId
  await prisma.user.update({
    where: { id: empleadoPrueba.id },
    data: { areaEmpresa: 'Ventas' },
  });
  console.log('Usuario de prueba (empleado): empleado.prueba / ' + PASSWORD_TEMPORAL + '\n');

  // ── 4. CATEGORÍAS Y SUBCATEGORÍAS DE INCIDENTES ────────────
  console.log('Creando categorías de incidentes...');

  const categorias = [
    {
      nombre: 'Hardware',
      subcategorias: ['Computadora/Laptop', 'Impresora', 'Periféricos (mouse/teclado)', 'Otro equipo'],
    },
    {
      nombre: 'Software',
      subcategorias: ['Instalación de programa', 'Error de aplicación', 'Licencias'],
    },
    {
      nombre: 'Red',
      subcategorias: ['WiFi', 'Internet lento/caído', 'VPN'],
    },
    {
      nombre: 'Cuentas y Accesos',
      subcategorias: ['Contraseña olvidada', 'Acceso a sistema/carpeta', 'Cuenta nueva'],
    },
    {
      nombre: 'Correo',
      subcategorias: ['Outlook no sincroniza', 'Buzón lleno', 'Configuración de correo'],
    },
    {
      nombre: 'Otro',
      subcategorias: ['General'],
    },
  ];

  for (const cat of categorias) {
    const categoriaCreada = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: { nombre: cat.nombre },
    });

    for (const sub of cat.subcategorias) {
      await prisma.subcategoria.upsert({
        where: { categoriaId_nombre: { categoriaId: categoriaCreada.id, nombre: sub } },
        update: {},
        create: { nombre: sub, categoriaId: categoriaCreada.id },
      });
    }
  }
  console.log('  6 categorías creadas con sus subcategorías\n');

  // ── 5. CONFIGURACIÓN INICIAL DE SLA (editable después desde el panel) ──
  console.log('Configurando SLA inicial...');

  const slaConfig = [
    { prioridad: 'Crítico', horasRespuesta: 1 },
    { prioridad: 'Alto', horasRespuesta: 4 },
    { prioridad: 'Medio', horasRespuesta: 24 },
    { prioridad: 'Bajo', horasRespuesta: 72 },
  ];

  for (const s of slaConfig) {
    await prisma.sLA.upsert({
      where: { prioridad: s.prioridad },
      update: {},
      create: s,
    });
  }
  console.log('  SLA configurado: Crítico=1h, Alto=4h, Medio=24h, Bajo=72h');
  console.log('  (Puedes cambiar estos valores después desde el panel de Configuración)\n');

  console.log('========================================');
  console.log('Seed completado con éxito.');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });