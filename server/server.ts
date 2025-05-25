import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { DatabaseStorage } from './DatabaseStorage';
import { db } from './db';
import { app } from './app';

async function startServer() {
    // ... outras configurações

    // Execute migrations on startup
    await migrate(db, { migrationsFolder: './drizzle/migrations' });

    // Inicialize o admin
    const storage = new DatabaseStorage();
    await storage.initializeAdminUser();

    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
}

startServer();