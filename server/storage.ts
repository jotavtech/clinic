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
  getMonthlyStats(): Promise<{ month: string; count: number; clients: string[] }[]>;
  generateReferralCode(): Promise<string>;
}

export class PrismaStorage implements IStorage {
  async createAppointment(appointmentData: SharedInsertAppointment): Promise<SharedAppointment> {
    const newAppointmentPrisma = await db.appointment.create({
      data: appointmentData as any, // Cast para 'any' se SharedInsertAppointment não for compatível com Prisma.AppointmentCreateInput
                                  // Idealmente, alinhe os tipos ou use um mapeador.
    });
    return newAppointmentPrisma as unknown as SharedAppointment; // Requer alinhamento de tipo
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

  async createMassagista(massagistaData: SharedInsertMassagista): Promise<SharedMassagista> {
    const newMassagistaPrisma = await db.massagista.create({ data: massagistaData as any });
    return newMassagistaPrisma as unknown as SharedMassagista;
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
        const newReferralPrisma = await db.referral.create({ data: referralData as any });
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
    console.warn("getClientHistory not fully implemented for PrismaStorage");
    const appointmentsPrisma = await db.appointment.findMany({ orderBy: { createdAt: 'desc' } });
    return appointmentsPrisma as unknown as SharedAppointment[];
  }

  async getMonthlyStats(): Promise<{ month: string; count: number; clients: string[] }[]> {
    console.warn("getMonthlyStats not fully implemented for PrismaStorage. Needs raw query or complex aggregation.");
    return [];
  }

  async generateReferralCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existing = await this.getReferralByCode(result);
    if (existing) {
        return this.generateReferralCode();
    }
    return result;
  }
}

export const storage = new PrismaStorage();
