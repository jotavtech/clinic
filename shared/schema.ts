import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const contactForms = pgTable("contact_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  service: text("service").notNull(),
  message: text("message"),
  createdAt: text("created_at").notNull(),
});

export const insertContactFormSchema = createInsertSchema(contactForms).omit({
  id: true,
  createdAt: true,
});

export type InsertContactForm = z.infer<typeof insertContactFormSchema>;
export type ContactForm = typeof contactForms.$inferSelect;

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone").notNull(),
  service: text("service").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  time: text("time").notNull(), // Format: HH:MM
  duration: integer("duration").notNull(), // Duration in minutes
  notes: text("notes"),
  status: text("status").notNull().default("agendado"), // agendado, concluído, cancelado
  createdAt: text("created_at").notNull(),
  referralCode: text("referral_code"), // Código de indicação do cliente atual
  referredBy: text("referred_by"), // Código de quem indicou este cliente
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Tabela de massagistas
export const massagistas = pgTable("massagistas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull(),
  fotoUrl: text("foto_url").notNull(),
  videoUrl: text("video_url"),
  suiteMaster: boolean("suite_master").default(false),
  ativa: boolean("ativa").default(true),
  createdAt: text("created_at").notNull(),
});

export const insertMassagistaSchema = createInsertSchema(massagistas).omit({
  id: true,
  createdAt: true,
});

export type InsertMassagista = z.infer<typeof insertMassagistaSchema>;
export type Massagista = typeof massagistas.$inferSelect;

// Tabela para estatísticas de referência
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referralCode: text("referral_code").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  totalReferred: integer("total_referred").notNull().default(0),
  discountsEarned: integer("discounts_earned").notNull().default(0),
  discountsUsed: integer("discounts_used").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  totalReferred: true,
  discountsEarned: true,
  discountsUsed: true,
  createdAt: true,
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
