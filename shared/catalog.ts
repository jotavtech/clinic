import { z } from "zod";

const safeImage = z.union([
  z.literal(""),
  z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "Use uma imagem HTTPS."),
]);
export const serviceInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Informe um nome com pelo menos 3 caracteres.")
      .max(120),
    description: z
      .string()
      .trim()
      .min(10, "Descreva o serviço em pelo menos 10 caracteres.")
      .max(1000),
    priceCents: z.number().int().min(0).max(10000000),
    durationMinutes: z.number().int().min(15).max(480).multipleOf(15),
    imageUrl: safeImage.default(""),
    active: z.boolean().default(false),
  })
  .strict();
export type ServiceInput = z.infer<typeof serviceInputSchema>;
export type ClinicService = ServiceInput & { id: number };
const time = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");
export const siteSettingsFields = z.object({
  brandName: z.string().trim().min(2).max(70),
  tagline: z.string().trim().max(100),
  heroTitle: z.string().trim().min(5).max(150),
  heroDescription: z.string().trim().min(10).max(400),
  heroImageUrl: safeImage,
  aboutTitle: z.string().trim().min(3).max(120),
  aboutDescription: z.string().trim().min(10).max(2000),
  aboutImageUrl: safeImage,
  address: z.string().trim().max(300),
  phone: z
    .string()
    .regex(
      /^$|^\d{12,13}$/,
      "Use código do país, DDD e número, apenas dígitos.",
    ),
  email: z.union([z.literal(""), z.string().trim().email()]),
  weekdayStart: time,
  weekdayEnd: time,
  weekendStart: time,
  weekendEnd: time,
  weekendsOpen: z.boolean(),
});
export const siteSettingsSchema = siteSettingsFields
  .strict()
  .superRefine((data, ctx) => {
    for (const prefix of ["weekday", "weekend"] as const) {
      if (data[`${prefix}Start`] >= data[`${prefix}End`])
        ctx.addIssue({
          code: "custom",
          path: [`${prefix}End`],
          message: "O fechamento deve ser após a abertura.",
        });
    }
  });
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export const defaultSiteSettings: SiteSettings = {
  brandName: "Clínica Executivas",
  tagline: "Cuidado, presença e bem-estar",
  heroTitle: "Seu momento de pausa começa aqui.",
  heroDescription:
    "Desacelere. Encontre o equilíbrio em uma experiência de cuidado pensada para você.",
  heroImageUrl: "",
  aboutTitle: "Um espaço para se sentir bem.",
  aboutDescription:
    "Acreditamos que cuidar de si é uma escolha que transforma o dia. Um ambiente acolhedor, atenção aos detalhes e tempo para você se reconectar com o que importa.",
  aboutImageUrl: "",
  address: "",
  phone: "",
  email: "",
  weekdayStart: "08:30",
  weekdayEnd: "21:00",
  weekendStart: "09:00",
  weekendEnd: "20:00",
  weekendsOpen: true,
};
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const whatsappLink = (phone: string, message = "") =>
  phone
    ? `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    : "";
