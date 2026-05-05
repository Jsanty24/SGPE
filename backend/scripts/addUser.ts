import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('12345678', 10);
  
  const existente = await prisma.usuario.findUnique({
    where: { correo: 'juansantiagoblanco@outlook.com' }
  });
  
  if (existente) {
    console.log('El usuario ya existe, actualizando rol...');
    await prisma.usuario.update({
      where: { correo: 'juansantiagoblanco@outlook.com' },
      data: { rol: 'ADMIN', contrasena: hash }
    });
  } else {
    console.log('Creando usuario...');
    await prisma.usuario.create({
      data: {
        nombre: 'Juan Santiago Blanco',
        correo: 'juansantiagoblanco@outlook.com',
        contrasena: hash,
        rol: 'ADMIN'
      }
    });
  }
  
  console.log('Usuario creado/actualizado exitosamente!');
  console.log('Email: juansantiagoblanco@outlook.com');
  console.log('Contraseña: 12345678');
  console.log('Rol: ADMIN');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());