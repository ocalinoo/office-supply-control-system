const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in database:');
    users.forEach(u => {
      console.log(`- ${u.username} (${u.name}) - Role: ${u.role}`);
    });
    
    if (users.length === 0) {
      console.log('No users found! Running seed...');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
