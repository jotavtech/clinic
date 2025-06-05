import { storage } from './storage';
import { app } from './app';
import { registerRoutes } from './routes';

async function startServer() {
    // Registrar as rotas
    await registerRoutes(app);
    
    // Inicialize o admin usando a mesma instância do storage
    try {
        const adminExists = await storage.getUserByUsername("admin");
        if (!adminExists) {
            await storage.createUser({
                username: "admin",
                password: "admin123"
            });
            console.log("Usuário admin criado com sucesso - Username: admin, Password: admin123");
        } else {
            console.log("Usuário admin já existe");
        }
    } catch (error) {
        console.error("Erro ao inicializar usuário admin:", error);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();