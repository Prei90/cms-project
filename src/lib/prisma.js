const { PrismaClient } = require("@prisma/client");

// Eén gedeelde Prisma-instantie voor de hele app (voorkomt te veel db-connecties)
const prisma = new PrismaClient();

module.exports = prisma;
