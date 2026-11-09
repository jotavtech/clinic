import 'dotenv/config';
import { storage } from '../server/storage';
import { db } from '../server/db';

try {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error("Configure ADMIN_USERNAME e ADMIN_PASSWORD (12 caracteres ou mais, até 72 bytes).");
  }
  if (await storage.getUserByUsername(username)) throw new Error("Este usuário já existe.");
  await storage.createUser({ username, password });
  console.log("Administrador criado com sucesso.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Não foi possível criar o administrador.");
  process.exitCode = 1;
} finally { await db.$disconnect(); }
