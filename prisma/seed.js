const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando la carga de usuarios por área...');

 
  const adminIT = await prisma.usuario.upsert({
    where: { correo: 'tu_correo_microsoft@baprosa.com' }, 
    update: {},
    create: {
      nombre: 'Ana Zepeda',
      correo: 'tu_correo_microsoft@baprosa.com',
      rol: 'ADMIN',
      departamento: 'IT',
    },
  });

  const usuarioOps = await prisma.usuario.upsert({
    where: { correo: 'operaciones.prueba@baprosa.com' },
    update: {},
    create: {
      nombre: 'Carlos Mendoza',
      correo: 'operaciones.prueba@baprosa.com',
      rol: 'USER',
      departamento: 'Operaciones',
    },
  });
  
  const usuarioAdmin = await prisma.usuario.upsert({
    where: { correo: 'administracion.prueba@baprosa.com' },
    update: {},
    create: {
      nombre: 'Glenda López',
      correo: 'administracion.prueba@baprosa.com',
      rol: 'USER',
      departamento: 'Administración',
    },
  });

 
  const usuarioVentas = await prisma.usuario.upsert({
    where: { correo: 'ventas.prueba@baprosa.com' },
    update: {},
    create: {
      nombre: 'Marcos Ávila',
      correo: 'ventas.prueba@baprosa.com',
      rol: 'USER',
      departamento: 'Ventas',
    },
  });

  console.log('Usuarios creados con éxito por departamento:');
  console.log({ adminIT, usuarioOps, usuarioAdmin, usuarioVentas });
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });