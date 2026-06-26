const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filas = await prisma.$queryRaw`SELECT * FROM tasks;`;
  console.log('Contenido actual de la tabla tasks:');
  console.log(filas);
  console.log(`\nTotal de filas: ${filas.length}`);
}

main()
  .catch((e) => console.error('Error consultando tasks:', e))
  .finally(async () => await prisma.$disconnect());