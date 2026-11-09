import { z } from "zod";

export function parseCalendarDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date : undefined;
}

export function calendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function bookingTimes(value: string): string[] {
  const date = parseCalendarDate(value);
  if (!date) return [];
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return [...(weekend ? [] : ["08:30"]), ...Array.from({ length: weekend ? 12 : 13 }, (_, i) => `${String(i + 9).padStart(2, "0")}:00`)];
}

// All appointments belong to the clinic's timezone, regardless of the visitor's location.
export function clinicNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export const bookingFields = z.object({
  clientName: z.string().trim().min(3, "Informe seu nome com pelo menos 3 caracteres.").max(150),
  clientPhone: z.string().transform(value => value.replace(/[\s()+.-]/g, ""))
    .pipe(z.string().regex(/^\d{10,11}$/, "Informe um telefone com DDD e 10 ou 11 dígitos.")),
  clientEmail: z.union([z.string().trim().email("Informe um e-mail válido."), z.literal("")]).nullish(),
  service: z.string().refine(value => ["suite-padrao", "suite-master"].includes(value), "Selecione um serviço."),
  date: z.string().refine(value => !!parseCalendarDate(value), "Selecione uma data válida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário."),
  duration: z.literal(60).default(60),
  notes: z.string().trim().max(2000).optional(),
  referredBy: z.string().trim().max(50).optional(),
});

export const bookingSchema = bookingFields.superRefine((value, ctx) => {
  const now = clinicNow();
  if (value.date < now.date || (value.date === now.date && value.time <= now.time)) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "Escolha uma data e um horário futuros." });
  }
  if (!bookingTimes(value.date).includes(value.time)) {
    ctx.addIssue({ code: "custom", path: ["time"], message: "Escolha um horário dentro do funcionamento da clínica." });
  }
});
