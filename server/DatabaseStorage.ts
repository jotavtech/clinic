import { db } from "./db";
import { users, type User, type InsertUser, 
        contactForms, type ContactForm, type InsertContactForm,
        appointments, type Appointment, type InsertAppointment,
        massagistas, type Massagista, type InsertMassagista,
        referrals, type Referral, type InsertReferral } from "@shared/schema";
import { IStorage } from "./storage";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log(`DatabaseStorage.getUserByUsername: Procurando usuário com username: ${username}`);
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      console.log('DatabaseStorage.getUserByUsername: Resultado da consulta:', result);
      const [user] = result;
      return user || undefined;
    } catch (error) {
      console.error('DatabaseStorage.getUserByUsername: Erro ao buscar usuário:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Contact form operations
  async createContactForm(form: InsertContactForm & { createdAt: string }): Promise<ContactForm> {
    const [contactForm] = await db
      .insert(contactForms)
      .values({
        ...form,
        message: form.message || null
      })
      .returning();
    console.log(`Contact form submitted: ${JSON.stringify(contactForm)}`);
    return contactForm;
  }
  
  async getContactForms(): Promise<ContactForm[]> {
    return await db.select().from(contactForms);
  }
  
  async getContactForm(id: number): Promise<ContactForm | undefined> {
    const [contactForm] = await db.select().from(contactForms).where(eq(contactForms.id, id));
    return contactForm || undefined;
  }
  
  // Appointment operations
  async createAppointment(appointment: InsertAppointment & { createdAt: string }): Promise<Appointment> {
    const appointmentData = {
      ...appointment,
      clientEmail: appointment.clientEmail || null,
      notes: appointment.notes || null,
      status: appointment.status || "agendado",
      referralCode: appointment.referralCode || null,
      referredBy: appointment.referredBy || null
    };
    
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointmentData)
      .returning();
    
    console.log(`Appointment created: ${JSON.stringify(newAppointment)}`);
    
    // Se o cliente foi indicado por alguém, atualizamos as estatísticas da referência
    if (newAppointment.referredBy) {
      const referral = await this.getReferralByCode(newAppointment.referredBy);
      if (referral) {
        // Incrementar contador de referidos
        await this.updateReferralStats(referral.id, {
          totalReferred: referral.totalReferred + 1,
          discountsEarned: referral.discountsEarned + 1
        });
      }
    }
    
    // Se o cliente ainda não tem código de indicação, geramos um para ele
    if (!newAppointment.referralCode) {
      const existingReferral = await this.getReferralByPhone(newAppointment.clientPhone);
      
      if (!existingReferral) {
        const referralCode = await this.generateReferralCode();
        
        // Criamos um novo registro na tabela de referências
        await this.createReferral({
          referralCode,
          clientName: newAppointment.clientName,
          clientPhone: newAppointment.clientPhone,
          createdAt: newAppointment.createdAt
        });
        
        // Atualizamos o agendamento com o código de referência gerado
        const [updatedAppointment] = await db
          .update(appointments)
          .set({ referralCode })
          .where(eq(appointments.id, newAppointment.id))
          .returning();
        
        if (updatedAppointment) {
          return updatedAppointment;
        }
      } else {
        // O cliente já possui um código, vamos usá-lo
        const [updatedAppointment] = await db
          .update(appointments)
          .set({ referralCode: existingReferral.referralCode })
          .where(eq(appointments.id, newAppointment.id))
          .returning();
        
        if (updatedAppointment) {
          return updatedAppointment;
        }
      }
    }
    
    return newAppointment;
  }
  
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }
  
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.date, date));
  }
  
  async updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(data)
      .where(eq(appointments.id, id))
      .returning();
    
    if (!updatedAppointment) return undefined;
    
    console.log(`Appointment updated: ${JSON.stringify(updatedAppointment)}`);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    const [deletedAppointment] = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    
    if (deletedAppointment) {
      console.log(`Appointment deleted: ${id}`);
      return true;
    }
    
    return false;
  }

  // Massagistas operations
  async getMassagistas(): Promise<Massagista[]> {
    return await db.select().from(massagistas);
  }
  
  async getMassagista(id: number): Promise<Massagista | undefined> {
    const [massagista] = await db.select().from(massagistas).where(eq(massagistas.id, id));
    return massagista || undefined;
  }
  
  async createMassagista(massagista: InsertMassagista & { createdAt: string }): Promise<Massagista> {
    const [newMassagista] = await db
      .insert(massagistas)
      .values({
        ...massagista,
        videoUrl: massagista.videoUrl || null,
        suiteMaster: massagista.suiteMaster || false,
        ativa: massagista.ativa !== undefined ? massagista.ativa : true
      })
      .returning();
    console.log(`Massagista created: ${JSON.stringify(newMassagista)}`);
    return newMassagista;
  }
  
  async updateMassagista(id: number, data: Partial<InsertMassagista>): Promise<Massagista | undefined> {
    const [updatedMassagista] = await db
      .update(massagistas)
      .set(data)
      .where(eq(massagistas.id, id))
      .returning();
    
    if (!updatedMassagista) return undefined;
    
    console.log(`Massagista updated: ${JSON.stringify(updatedMassagista)}`);
    return updatedMassagista;
  }
  
  async deleteMassagista(id: number): Promise<boolean> {
    const [deletedMassagista] = await db
      .delete(massagistas)
      .where(eq(massagistas.id, id))
      .returning();
    
    if (deletedMassagista) {
      console.log(`Massagista deleted: ${id}`);
      return true;
    }
    
    return false;
  }
  
  // Sistema de referências
  async createReferral(referral: InsertReferral & { createdAt: string }): Promise<Referral> {
    const [newReferral] = await db
      .insert(referrals)
      .values({
        ...referral,
        totalReferred: 0,
        discountsEarned: 0,
        discountsUsed: 0
      })
      .returning();
    
    console.log(`Referral created: ${JSON.stringify(newReferral)}`);
    return newReferral;
  }
  
  async getReferrals(): Promise<Referral[]> {
    return await db.select().from(referrals);
  }
  
  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code));
    
    return referral || undefined;
  }
  
  async getReferralByPhone(phone: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.clientPhone, phone));
    
    return referral || undefined;
  }
  
  async updateReferralStats(id: number, data: { 
    totalReferred?: number; 
    discountsEarned?: number; 
    discountsUsed?: number; 
  }): Promise<Referral | undefined> {
    const [updatedReferral] = await db
      .update(referrals)
      .set(data)
      .where(eq(referrals.id, id))
      .returning();
    
    if (!updatedReferral) return undefined;
    
    console.log(`Referral stats updated: ${JSON.stringify(updatedReferral)}`);
    return updatedReferral;
  }
  
  // Dados estatísticos
  async getClientHistory(): Promise<Appointment[]> {
    // Retorna todos os agendamentos organizados por data para formar o histórico
    return await db
      .select()
      .from(appointments)
      .orderBy(appointments.createdAt); // Ordenado do mais recente para o mais antigo
  }
  
  async getMonthlyStats(): Promise<{ 
    month: string; 
    count: number; 
    clients: string[]; 
    clientVisits: { name: string; count: number }[] 
  }[]> {
    const allAppointments = await db.select().from(appointments);
    const monthlyStats: Record<string, { 
      count: number; 
      clients: Set<string>;
      clientCounts: Record<string, number>;
    }> = {};

    // Agrupar por mês
    allAppointments.forEach(appointment => {
      const date = new Date(appointment.date);
      const month = date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = { 
          count: 0, 
          clients: new Set<string>(),
          clientCounts: {}
        };
      }
      
      monthlyStats[month].count++;
      monthlyStats[month].clients.add(appointment.clientName);
      
      // Incrementar contador de visitas para este cliente
      if (!monthlyStats[month].clientCounts[appointment.clientName]) {
        monthlyStats[month].clientCounts[appointment.clientName] = 0;
      }
      monthlyStats[month].clientCounts[appointment.clientName]++;
    });

    // Converter para o formato de retorno
    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      count: stats.count,
      clients: Array.from(stats.clients),
      clientVisits: Object.entries(stats.clientCounts).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count) // Ordenado do maior para o menor número de visitas
    })).sort((a, b) => a.month.localeCompare(b.month));
  }
  
  async generateReferralCode(): Promise<string> {
    // Gera um código alfanumérico de 6 caracteres para indicação
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Verifica se o código já existe e, se sim, gera outro
    const existingReferral = await this.getReferralByCode(code);
    if (existingReferral) {
      return this.generateReferralCode();
    }
    
    return code;
  }

  // Método para inicializar o usuário admin padrão
  async initializeAdminUser(): Promise<void> {
    try {
      console.log('Verificando se o usuário admin existe...');
      const adminExists = await this.getUserByUsername("admin");
      
      if (!adminExists) {
        console.log('Usuário admin não encontrado. Criando...');
        await this.createUser({
          username: "admin",
          password: "admin123" // Em produção, usar hash e senhas fortes
        });
        console.log("Usuário admin criado com sucesso - Username: admin, Password: admin123");
      } else {
        console.log("Usuário admin já existe");
      }
    } catch (error) {
      console.error("Erro ao inicializar usuário admin:", error);
    }
  }
}