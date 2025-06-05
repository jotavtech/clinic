import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactFormSchema, insertAppointmentSchema, insertMassagistaSchema, insertReferralSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import { upload, uploadToCloudinary } from "./services/uploadService";

// Estender a interface Session do express-session
declare module 'express-session' {
  interface Session {
    isAuthenticated?: boolean;
    userId?: number;
  }
}

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Não autorizado" });
  }
};

export async function registerRoutes(app: Express): Promise<void> {
  // Configurar sessões
  app.use(session({
    secret: 'clinica-executivas-secret',
    resave: true,
    saveUninitialized: true,
    cookie: { 
      secure: false, // Desabilitar secure para permitir cookies em HTTP
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: 'lax' // Ajuda com questões de CORS
    }
  }));

  // API routes
  const apiRouter = express.Router();
  
  // Rota de login
  apiRouter.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    console.log(`Tentativa de login: Username: ${username}, Password: ${password}`);
    
    try {
      const user = await storage.getUserByUsername(username);
      console.log('Usuário encontrado:', user);
      
      if (user && user.password === password) {
        // Simplificado para fins de demonstração - em produção use hash
        req.session.isAuthenticated = true;
        req.session.userId = user.id;
        console.log('Login realizado com sucesso. Session:', req.session);
        
        return res.status(200).json({
          success: true,
          message: "Login realizado com sucesso"
        });
      }
      
      console.log('Credenciais inválidas.');
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas"
      });
    } catch (error) {
      console.error("Erro ao processar login:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao processar login"
      });
    }
  });
  
  // Rota de logout
  apiRouter.post("/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(200).json({
        success: true,
        message: "Logout realizado com sucesso"
      });
    });
  });
  
  // Rota para verificar se está autenticado
  apiRouter.get("/check-auth", (req: Request, res: Response) => {
    if (req.session.isAuthenticated) {
      return res.status(200).json({ 
        success: true, 
        isAuthenticated: true 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      isAuthenticated: false,
      message: "Não autenticado" 
    });
  });

  // Rota para upload de imagem (somente usuários autenticados)
  apiRouter.post("/upload-image", isAuthenticated, upload.single('image'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Nenhuma imagem foi enviada"
        });
      }

      const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      
      return res.status(200).json({
        success: true,
        message: "Imagem enviada com sucesso",
        imageUrl
      });
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao fazer upload da imagem"
      });
    }
  });
  
  // Contact form submission endpoint
  apiRouter.post("/contact", async (req: Request, res: Response) => {
    try {
      const data = insertContactFormSchema.parse(req.body);
      
      const timestamp = new Date().toISOString();
      const contactForm = await storage.createContactForm({
        ...data,
        createdAt: timestamp
      });
      
      return res.status(201).json({ 
        success: true, 
        message: "Formulário de contato enviado com sucesso", 
        id: contactForm.id 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: "Erro de validação", 
          errors: validationError.message 
        });
      }
      
      console.error("Error processing contact form:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao processar o formulário de contato" 
      });
    }
  });

  // Rota de agendamento (público - permite que clientes façam agendamentos)
  apiRouter.post("/appointments", async (req: Request, res: Response) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      
      // Registramos quando o agendamento foi criado
      const timestamp = new Date().toISOString();
      
      // Adicionamos um valor padrão vazio para o email se não for fornecido
      const appointmentData = {
        ...data,
        clientEmail: data.clientEmail || "",
        createdAt: timestamp
      };
      
      // Log para depuração
      console.log("Criando agendamento:", appointmentData);
      
      const appointment = await storage.createAppointment(appointmentData);
      
      // Retorno com sucesso e os dados do agendamento criado
      return res.status(201).json({ 
        success: true, 
        message: "Agendamento criado com sucesso", 
        appointment 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Erro de validação:", validationError);
        return res.status(400).json({ 
          success: false, 
          message: "Erro de validação", 
          errors: validationError.message 
        });
      }
      
      console.error("Erro ao criar agendamento:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao criar agendamento" 
      });
    }
  });
  
  apiRouter.get("/appointments", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      
      let appointments;
      if (date && typeof date === 'string') {
        appointments = await storage.getAppointmentsByDate(date);
      } else {
        appointments = await storage.getAppointments();
      }
      
      return res.status(200).json({ 
        success: true, 
        appointments 
      });
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar agendamentos" 
      });
    }
  });
  
  apiRouter.get("/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        appointment 
      });
    } catch (error) {
      console.error("Erro ao buscar agendamento:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar agendamento" 
      });
    }
  });
  
  apiRouter.put("/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      // Validação parcial dos campos permitidos
      const data: Partial<typeof insertAppointmentSchema._type> = req.body;
      
      const updatedAppointment = await storage.updateAppointment(id, data);
      if (!updatedAppointment) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Agendamento atualizado com sucesso",
        appointment: updatedAppointment 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: "Erro de validação", 
          errors: validationError.message 
        });
      }
      
      console.error("Erro ao atualizar agendamento:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao atualizar agendamento" 
      });
    }
  });
  
  apiRouter.delete("/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Agendamento excluído com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao excluir agendamento" 
      });
    }
  });
  
  apiRouter.put("/appointments/:id/confirm", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }

      // Buscar o agendamento
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }

      // Gerar código de indicação personalizado com o nome do cliente
      const referralCode = await storage.generateReferralCode(appointment.clientName);

      // Criar registro de referral
      const referralData = {
        referralCode,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
      };

      const referral = await storage.createReferral(referralData);

      // Atualizar o agendamento com o código de referral
      const updatedAppointment = await storage.updateAppointment(id, {
        status: "confirmado",
        referralCode: referralCode
      });

      if (!updatedAppointment) {
        return res.status(500).json({
          success: false,
          message: "Erro ao atualizar agendamento"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Agendamento confirmado com sucesso",
        appointment: updatedAppointment,
        referral
      });
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao confirmar agendamento"
      });
    }
  });
  
  // Rotas de Massagistas
  
  // Obter todas as massagistas
  apiRouter.get("/massagistas", async (req: Request, res: Response) => {
    try {
      const massagistas = await storage.getMassagistas();
      return res.status(200).json({ 
        success: true, 
        massagistas 
      });
    } catch (error) {
      console.error("Erro ao buscar massagistas:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar massagistas" 
      });
    }
  });
  
  // Obter uma massagista específica
  apiRouter.get("/massagistas/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const massagista = await storage.getMassagista(id);
      if (!massagista) {
        return res.status(404).json({
          success: false,
          message: "Massagista não encontrada"
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        massagista
      });
    } catch (error) {
      console.error("Erro ao buscar massagista:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar massagista" 
      });
    }
  });
  
  // Criar massagista (somente usuários autenticados)
  apiRouter.post("/massagistas", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertMassagistaSchema.parse(req.body);
      
      const timestamp = new Date().toISOString();
      const massagista = await storage.createMassagista({
        ...data,
        createdAt: timestamp
      });
      
      return res.status(201).json({ 
        success: true, 
        message: "Massagista cadastrada com sucesso", 
        massagista 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: "Erro de validação", 
          errors: validationError.message 
        });
      }
      
      console.error("Erro ao cadastrar massagista:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao cadastrar massagista" 
      });
    }
  });
  
  // Atualizar massagista
  apiRouter.put("/massagistas/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      // Validação parcial dos campos permitidos
      const data: Partial<typeof insertMassagistaSchema._type> = req.body;
      
      const updatedMassagista = await storage.updateMassagista(id, data);
      if (!updatedMassagista) {
        return res.status(404).json({
          success: false,
          message: "Massagista não encontrada"
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Massagista atualizada com sucesso",
        massagista: updatedMassagista 
      });
    } catch (error) {
      console.error("Erro ao atualizar massagista:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao atualizar massagista" 
      });
    }
  });
  
  // Excluir massagista
  apiRouter.delete("/massagistas/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const success = await storage.deleteMassagista(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Massagista não encontrada"
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Massagista excluída com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir massagista:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao excluir massagista" 
      });
    }
  });
  
  // Rotas para o sistema de referências
  
  // Obter todas as referências
  apiRouter.get("/referrals", async (req: Request, res: Response) => {
    try {
      const referrals = await storage.getReferrals();
      
      return res.status(200).json({
        success: true,
        referrals
      });
    } catch (error) {
      console.error("Erro ao buscar referências:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar referências"
      });
    }
  });
  
  // Verificar código de referência
  apiRouter.get("/referrals/check/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const referral = await storage.getReferralByCode(code);
      
      if (referral) {
        return res.status(200).json({
          success: true,
          valid: true,
          referral: {
            name: referral.clientName,
            code: referral.referralCode
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          valid: false
        });
      }
    } catch (error) {
      console.error("Erro ao verificar código de referência:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar código de referência"
      });
    }
  });
  
  // Gerar código de referência para um cliente
  apiRouter.post("/referrals/generate", async (req: Request, res: Response) => {
    try {
      const { clientName, clientPhone } = req.body;
      
      if (!clientName || !clientPhone) {
        return res.status(400).json({
          success: false,
          message: "Nome e telefone são obrigatórios"
        });
      }
      
      // Verificar se o cliente já tem um código
      const existingReferral = await storage.getReferralByPhone(clientPhone);
      
      if (existingReferral) {
        return res.status(200).json({
          success: true,
          message: "Cliente já possui um código",
          referralCode: existingReferral.referralCode
        });
      }
      
      // Gerar novo código
      const referralCode = await storage.generateReferralCode();
      
      // Criar novo registro de referência
      const referral = await storage.createReferral({
        referralCode,
        clientName,
        clientPhone
      });
      
      return res.status(201).json({
        success: true,
        message: "Código de referência gerado com sucesso",
        referralCode: referral.referralCode
      });
    } catch (error) {
      console.error("Erro ao gerar código de referência:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar código de referência"
      });
    }
  });
  
  // Uso de desconto de referência
  apiRouter.put("/referrals/use-discount/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const referrals = await storage.getReferrals();
      const selectedReferral = referrals.find(r => r.id === id);
      
      if (!selectedReferral) {
        return res.status(404).json({
          success: false,
          message: "Referência não encontrada"
        });
      }
      
      if (selectedReferral.discountsEarned <= selectedReferral.discountsUsed) {
        return res.status(400).json({
          success: false,
          message: "Cliente não possui descontos disponíveis"
        });
      }
      
      // Incrementar contador de descontos usados
      const updatedReferral = await storage.updateReferralStats(id, {
        discountsUsed: selectedReferral.discountsUsed + 1
      });
      
      return res.status(200).json({
        success: true,
        message: "Desconto utilizado com sucesso",
        referral: updatedReferral
      });
    } catch (error) {
      console.error("Erro ao utilizar desconto:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao utilizar desconto"
      });
    }
  });
  
  // Estatísticas mensais
  apiRouter.get("/stats/monthly", async (req: Request, res: Response) => {
    try {
      const monthlyStats = await storage.getMonthlyStats();
      
      return res.status(200).json({
        success: true,
        monthlyStats
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas mensais:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar estatísticas mensais"
      });
    }
  });
  
  // Histórico de clientes
  apiRouter.get("/stats/client-history", async (req: Request, res: Response) => {
    try {
      const clientHistory = await storage.getClientHistory();
      
      return res.status(200).json({
        success: true,
        clientHistory
      });
    } catch (error) {
      console.error("Erro ao buscar histórico de clientes:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar histórico de clientes"
      });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);
  
  console.log("🚀 Rotas registradas com sucesso!");
}
