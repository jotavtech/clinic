import { db } from './db'; // Importa a instância do Prisma Client
import type { 
    User as SharedUser, InsertUser as SharedInsertUser, 
    ContactForm as SharedContactForm, InsertContactForm as SharedInsertContactForm,
    Appointment as SharedAppointment, InsertAppointment as SharedInsertAppointment,
    Massagista as SharedMassagista, InsertMassagista as SharedInsertMassagista,
    Referral as SharedReferral, InsertReferral as SharedInsertReferral 
} from "@shared/schema";

// Importa tipos do Prisma - o Prisma Client já foi gerado
import type { User, Appointment, ContactForm, Massagista, Referral } from '@prisma/client';
import { ReferralCodeGenerator } from './utils/referralCodeGenerator';

// Interface for storage operations - os tipos de retorno devem corresponder ao @shared/schema
export interface IStorage {
  getUser(id: number): Promise<SharedUser | undefined>;
  getUserByUsername(username: string): Promise<SharedUser | undefined>;
  createUser(user: SharedInsertUser): Promise<SharedUser>;
  
  createContactForm(form: SharedInsertContactForm & { createdAt: string }): Promise<SharedContactForm>;
  getContactForms(): Promise<SharedContactForm[]>;
  getContactForm(id: number): Promise<SharedContactForm | undefined>;
  
  createAppointment(appointment: SharedInsertAppointment & { createdAt?: string }): Promise<SharedAppointment>;
  getAppointments(): Promise<SharedAppointment[]>;
  getAppointment(id: number): Promise<SharedAppointment | undefined>;
  getAppointmentsByDate(date: string): Promise<SharedAppointment[]>;
  updateAppointment(id: number, data: Partial<SharedInsertAppointment>): Promise<SharedAppointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  getMassagistas(): Promise<SharedMassagista[]>;
  getMassagista(id: number): Promise<SharedMassagista | undefined>;
  createMassagista(massagista: SharedInsertMassagista & { createdAt?: string }): Promise<SharedMassagista>;
  updateMassagista(id: number, data: Partial<SharedInsertMassagista>): Promise<SharedMassagista | undefined>;
  deleteMassagista(id: number): Promise<boolean>;
  
  createReferral(referral: SharedInsertReferral & { createdAt?: string }): Promise<SharedReferral>;
  getReferrals(): Promise<SharedReferral[]>;
  getReferralByCode(code: string): Promise<SharedReferral | undefined>;
  getReferralByPhone(phone: string): Promise<SharedReferral | undefined>;
  updateReferralStats(id: number, data: { 
    totalReferred?: number; 
    discountsEarned?: number; 
    discountsUsed?: number; 
  }): Promise<SharedReferral | undefined>;
  
  getClientHistory(): Promise<SharedAppointment[]>;
  getMonthlyStats(): Promise<{ month: string; count: number; clients: string[]; clientVisits: { name: string; count: number }[] }[]>;
  generateReferralCode(clientName?: string): Promise<string>;
}

export class PrismaStorage implements IStorage {
  async createAppointment(appointmentData: SharedInsertAppointment): Promise<SharedAppointment> {
    try {
      // Create the appointment
      const newAppointmentPrisma = await db.appointment.create({
        data: {
          ...appointmentData,
          clientEmail: appointmentData.clientEmail || null,
          notes: appointmentData.notes || null,
          status: appointmentData.status || "agendado",
          referralCode: appointmentData.referralCode || null,
          referredBy: appointmentData.referredBy || null,
          createdAt: new Date().toISOString()
        }
      });

      // If the client was referred by someone, update their referral stats
      if (newAppointmentPrisma.referredBy) {
        const referral = await this.getReferralByCode(newAppointmentPrisma.referredBy);
        if (referral) {
          await this.updateReferralStats(referral.id, {
            totalReferred: referral.totalReferred + 1,
            discountsEarned: referral.discountsEarned + 1
          });
        }
      }

      // If the client doesn't have a referral code yet, generate one
      if (!newAppointmentPrisma.referralCode) {
        const existingReferral = await this.getReferralByPhone(newAppointmentPrisma.clientPhone);

        if (!existingReferral) {
          // Generate a new referral code
          const referralCode = await this.generateReferralCode(newAppointmentPrisma.clientName);

          // Create a new referral record
          await this.createReferral({
            referralCode,
            clientName: newAppointmentPrisma.clientName,
            clientPhone: newAppointmentPrisma.clientPhone
          });

          // Update the appointment with the generated referral code
          const updatedAppointment = await db.appointment.update({
            where: { id: newAppointmentPrisma.id },
            data: { referralCode }
          });

          return updatedAppointment as unknown as SharedAppointment;
        } else {
          // Use the existing referral code
          const updatedAppointment = await db.appointment.update({
            where: { id: newAppointmentPrisma.id },
            data: { referralCode: existingReferral.referralCode }
          });

          return updatedAppointment as unknown as SharedAppointment;
        }
      }

      return newAppointmentPrisma as unknown as SharedAppointment;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  async getAppointments(): Promise<SharedAppointment[]> {
    const appointmentsPrisma = await db.appointment.findMany();
    return appointmentsPrisma as unknown as SharedAppointment[];
  }

  async getAppointment(id: number): Promise<SharedAppointment | undefined> {
    const appointmentPrisma = await db.appointment.findUnique({ where: { id } });
    if (!appointmentPrisma) return undefined;
    return appointmentPrisma as unknown as SharedAppointment;
  }

  async getAppointmentsByDate(date: string): Promise<SharedAppointment[]> {
    const appointmentsPrisma = await db.appointment.findMany({ where: { date: date } });
    return appointmentsPrisma as unknown as SharedAppointment[];
  }

  async updateAppointment(id: number, data: Partial<SharedInsertAppointment>): Promise<SharedAppointment | undefined> {
    try {
      const updatedAppointmentPrisma = await db.appointment.update({
        where: { id },
        data: data as any, // Cast para 'any' para compatibilidade inicial
      });
      return updatedAppointmentPrisma as unknown as SharedAppointment;
    } catch (error) {
      return undefined;
    }
  }

  async deleteAppointment(id: number): Promise<boolean> {
    try {
      await db.appointment.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async createUser(userData: SharedInsertUser): Promise<SharedUser> {
    const newUserPrisma = await db.user.create({ data: userData as any });
    return newUserPrisma as unknown as SharedUser;
  }

  async getUser(id: number): Promise<SharedUser | undefined> {
    const userPrisma = await db.user.findUnique({ where: { id } });
    if (!userPrisma) return undefined;
    return userPrisma as unknown as SharedUser;
  }

  async getUserByUsername(username: string): Promise<SharedUser | undefined> {
    const userPrisma = await db.user.findUnique({ where: { username } });
    if (!userPrisma) return undefined;
    return userPrisma as unknown as SharedUser;
  }

  async createContactForm(form: SharedInsertContactForm & { createdAt?: string }): Promise<SharedContactForm> {
    const newFormPrisma = await db.contactForm.create({ data: form as any });
    return newFormPrisma as unknown as SharedContactForm;
  }
  
  async getContactForms(): Promise<SharedContactForm[]> {
      const formsPrisma = await db.contactForm.findMany();
      return formsPrisma as unknown as SharedContactForm[];
  }
  
  async getContactForm(id: number): Promise<SharedContactForm | undefined> {
      const formPrisma = await db.contactForm.findUnique({ where: { id } });
      if (!formPrisma) return undefined;
      return formPrisma as unknown as SharedContactForm;
  }

  async createMassagista(massagistaData: SharedInsertMassagista & { createdAt?: string }): Promise<SharedMassagista> {
    try {
      const newMassagistaPrisma = await db.massagista.create({
        data: {
          nome: massagistaData.nome,
          descricao: massagistaData.descricao,
          fotoUrl: massagistaData.fotoUrl,
          videoUrl: massagistaData.videoUrl || null,
          suiteMaster: massagistaData.suiteMaster || false,
          ativa: massagistaData.ativa !== undefined ? massagistaData.ativa : true
        }
      });
      return newMassagistaPrisma as unknown as SharedMassagista;
    } catch (error) {
      console.error("Error creating massagista:", error);
      throw error;
    }
  }
  
  async getMassagistas(): Promise<SharedMassagista[]> {
      const massagistasPrisma = await db.massagista.findMany();
      return massagistasPrisma as unknown as SharedMassagista[];
  }
  
  async getMassagista(id: number): Promise<SharedMassagista | undefined> {
      const massagistaPrisma = await db.massagista.findUnique({ where: { id } });
      if (!massagistaPrisma) return undefined;
      return massagistaPrisma as unknown as SharedMassagista;
  }

  async updateMassagista(id: number, data: Partial<SharedInsertMassagista>): Promise<SharedMassagista | undefined> {
      try {
        const updatedMassagistaPrisma = await db.massagista.update({
          where: { id },
          data: data as any,
        });
        return updatedMassagistaPrisma as unknown as SharedMassagista;
      } catch (error) {
        return undefined;
      }
  }

  async deleteMassagista(id: number): Promise<boolean> {
      try {
        await db.massagista.delete({ where: { id } });
        return true;
      } catch (error) {
        return false;
      }
  }

  async createReferral(referralData: SharedInsertReferral): Promise<SharedReferral> {
    try {
        const newReferralPrisma = await db.referral.create({ 
          data: {
            ...referralData,
            createdAt: new Date().toISOString(),
            totalReferred: 0,
            discountsEarned: 0,
            discountsUsed: 0
          }
        });
        return newReferralPrisma as unknown as SharedReferral;
    } catch(error) {
        console.error("Error creating referral:", error);
        throw error;
    }
  }

  async getReferrals(): Promise<SharedReferral[]> {
      const referralsPrisma = await db.referral.findMany();
      return referralsPrisma as unknown as SharedReferral[];
  }

  async getReferralByCode(code: string): Promise<SharedReferral | undefined> {
      const referralPrisma = await db.referral.findUnique({ where: { referralCode: code } });
      if (!referralPrisma) return undefined;
      return referralPrisma as unknown as SharedReferral;
  }

  async getReferralByPhone(phone: string): Promise<SharedReferral | undefined> {
      const referralPrisma = await db.referral.findUnique({ where: { clientPhone: phone } });
      if (!referralPrisma) return undefined;
      return referralPrisma as unknown as SharedReferral;
  }

  async updateReferralStats(id: number, data: { 
    totalReferred?: number; 
    discountsEarned?: number; 
    discountsUsed?: number; 
  }): Promise<SharedReferral | undefined> {
    const updateData: any = {};
    if (data.totalReferred !== undefined) updateData.totalReferred = { increment: data.totalReferred };
    if (data.discountsEarned !== undefined) updateData.discountsEarned = { increment: data.discountsEarned };
    if (data.discountsUsed !== undefined) updateData.discountsUsed = { increment: data.discountsUsed };

    try {
        const updatedReferralPrisma = await db.referral.update({
            where: { id },
            data: updateData,
        });
        return updatedReferralPrisma as unknown as SharedReferral;
    } catch (error) {
        return undefined;
    }
  }

  async getClientHistory(): Promise<SharedAppointment[]> {
    try {
      // Get all appointments ordered by date and time
      const appointments = await db.appointment.findMany({
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ]
      });

      return appointments as unknown as SharedAppointment[];
    } catch (error) {
      console.error("Error getting client history:", error);
      return [];
    }
  }

  async getMonthlyStats(): Promise<{ month: string; count: number; clients: string[]; clientVisits: { name: string; count: number }[] }[]> {
    try {
      // Get all appointments ordered by date
      const appointments = await db.appointment.findMany({
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ]
      });

      // Group appointments by month
      const monthlyStats: Record<string, {
        count: number;
        clients: Set<string>;
        clientCounts: Record<string, number>;
      }> = {};

      // Process each appointment
      appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        const month = date.toISOString().substring(0, 7); // YYYY-MM format

        // Initialize month stats if not exists
        if (!monthlyStats[month]) {
          monthlyStats[month] = {
            count: 0,
            clients: new Set<string>(),
            clientCounts: {}
          };
        }

        // Update stats
        monthlyStats[month].count++;
        monthlyStats[month].clients.add(appointment.clientName);

        // Update client visit count
        if (!monthlyStats[month].clientCounts[appointment.clientName]) {
          monthlyStats[month].clientCounts[appointment.clientName] = 0;
        }
        monthlyStats[month].clientCounts[appointment.clientName]++;
      });

      // Get current month in YYYY-MM format
      const currentMonth = new Date().toISOString().substring(0, 7);

      // Convert to return format, ensuring current month is included
      const stats = Object.entries(monthlyStats).map(([month, stats]) => ({
        month,
        count: stats.count,
        clients: Array.from(stats.clients),
        clientVisits: Object.entries(stats.clientCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count) // Sort by visit count, most frequent first
      }));

      // Add current month if not present
      if (!stats.find(stat => stat.month === currentMonth)) {
        stats.unshift({
          month: currentMonth,
          count: 0,
          clients: [],
          clientVisits: []
        });
      }

      // Sort by month, most recent first
      return stats.sort((a, b) => b.month.localeCompare(a.month));
    } catch (error) {
      console.error("Error getting monthly stats:", error);
      return [];
    }
  }

  async generateReferralCode(clientName?: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const code = ReferralCodeGenerator.generate({
        clientName,
        usePrefix: true,
        length: 6
      });

      // Verifica se o código já existe
      const existing = await this.getReferralByCode(code);
      if (!existing) {
        return code;
      }

      attempts++;
    }

    // Se não conseguiu gerar um código único com prefixo, tenta sem prefixo
    const fallbackCode = ReferralCodeGenerator.generate({
      usePrefix: false,
      length: 8
    });

    return fallbackCode;
  }
}

export const storage = new PrismaStorage();
