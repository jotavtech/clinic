// Script para inserir massagistas no banco de dados
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';

async function main() {
  // Configurar conexão com o banco de dados
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });
  
  const timestamp = new Date().toISOString();

  // Dados das massagistas baseados no componente Gallery.tsx
  const massagistaData = [
    {
      nome: "Rubi",
      descricao: "Especialista em massagem relaxante",
      fotoUrl: "https://i.imgur.com/VpNhBGF.jpg",
      videoUrl: null,
      suiteMaster: true,
      ativa: true,
      createdAt: timestamp
    },
    {
      nome: "Sofia",
      descricao: "Especialista em massagem tântrica",
      fotoUrl: "https://i.imgur.com/4fzC2PD.jpg",
      videoUrl: null,
      suiteMaster: false,
      ativa: true,
      createdAt: timestamp
    },
    {
      nome: "Maya",
      descricao: "Especialista em pedras quentes",
      fotoUrl: "https://i.imgur.com/nThBRc6.jpg",
      videoUrl: null,
      suiteMaster: true,
      ativa: true,
      createdAt: timestamp
    },
    {
      nome: "Melina",
      descricao: "Especialista em massagem drenante",
      fotoUrl: "https://i.imgur.com/yS3W0TX.jpg",
      videoUrl: null,
      suiteMaster: false,
      ativa: true,
      createdAt: timestamp
    }
  ];

  // Inserir massagistas no banco de dados
  for (const massagista of massagistaData) {
    try {
      await db.insert(schema.massagistas).values(massagista);
      console.log(`Massagista "${massagista.nome}" inserida com sucesso!`);
    } catch (error) {
      console.error(`Erro ao inserir massagista "${massagista.nome}":`, error);
    }
  }

  console.log('Processo de inserção concluído!');
  process.exit(0);
}

main().catch(error => {
  console.error('Erro inesperado:', error);
  process.exit(1);
});