import { z } from "zod";
import { defaultSiteSettings, type SiteSettings } from "./catalog";

export function parseCalendarDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

export function calendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function bookingTimes(
  value: string,
  settings: SiteSettings = defaultSiteSettings,
  duration = 60,
): string[] {
  const date = parseCalendarDate(value);
  if (!date) return [];
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  if (weekend && !settings.weekendsOpen) return [];
  const minutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const start = minutes(
    weekend ? settings.weekendStart : settings.weekdayStart,
  );
  const end = minutes(weekend ? settings.weekendEnd : settings.weekdayEnd);
  const times: string[] = [];
  for (let t = start; t + duration <= end; t += 30)
    times.push(
      `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
    );
  return times;
}

// All appointments belong to the clinic's timezone, regardless of the visitor's location.
export function clinicNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export const bookingFields = z.object({
  clientName: z
    .string()
    .trim()
    .min(3, "Informe seu nome com pelo menos 3 caracteres.")
    .max(150),
  clientPhone: z
    .string()
    .transform((value) => value.replace(/[\s()+.-]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^\d{10,11}$/,
          "Informe um telefone com DDD e 10 ou 11 dígitos.",
        ),
    ),
  clientEmail: z
    .union([
      z.string().trim().email("Informe um e-mail válido."),
      z.literal(""),
    ])
    .nullish(),
  service: z.string().regex(/^[1-9]\d*$/, "Selecione um serviço."),
  date: z
    .string()
    .refine(
      (value) => !!parseCalendarDate(value),
      "Selecione uma data válida.",
    ),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário."),
  duration: z.number().int().min(15).max(480).default(60),
  notes: z.string().trim().max(2000).optional(),
  referredBy: z.string().trim().max(50).optional(),
});

export const makeBookingSchema = (
  settings: SiteSettings = defaultSiteSettings,
) =>
  bookingFields.superRefine((value, ctx) => {
    const now = clinicNow();
    if (
      value.date < now.date ||
      (value.date === now.date && value.time <= now.time)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Escolha uma data e um horário futuros.",
      });
    }
    if (
      !bookingTimes(value.date, settings, value.duration).includes(value.time)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["time"],
        message: "Escolha um horário dentro do funcionamento da clínica.",
      });
    }
  });

export const bookingSchema = makeBookingSchema();
