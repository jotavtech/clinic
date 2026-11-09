import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Loader2,
  MapPin,
  MessageCircle,
} from "lucide-react";
import {
  bookingSchema,
  makeBookingSchema,
  bookingTimes,
  clinicNow,
} from "@shared/booking";
import { money, whatsappLink } from "@shared/catalog";
import { useServices, useSiteSettings } from "@/lib/catalog";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Booking = z.infer<typeof bookingSchema>;
const defaults: Booking = {
  clientName: "",
  clientPhone: "",
  service: "",
  date: "",
  time: "",
  duration: 60,
  notes: "",
  referredBy: "",
};
export default function Contact() {
  const {
    settings,
    isError: settingsError,
    isPending: settingsPending,
    refetch: refetchSettings,
  } = useSiteSettings();
  const { data: services = [], isPending, isError, refetch } = useServices();
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<{ code?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useForm<Booking>({
    resolver: zodResolver(makeBookingSchema(settings)),
    defaultValues: defaults,
  });
  const serviceId = form.watch("service");
  const date = form.watch("date");
  const service = services.find((item) => String(item.id) === serviceId);
  const duration = service?.durationMinutes || 60;
  const slots = bookingTimes(date, settings, duration).filter(
    (time) => date !== clinicNow().date || time > clinicNow().time,
  );
  const blocked =
    isPending ||
    isError ||
    settingsError ||
    settingsPending ||
    services.length === 0;
  useEffect(() => {
    const select = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (services.some((item) => String(item.id) === id)) {
        form.setValue("service", id, { shouldValidate: true });
        form.setValue("time", "");
      }
    };
    window.addEventListener("booking:service", select);
    return () => window.removeEventListener("booking:service", select);
  }, [services, form]);
  useEffect(() => {
    form.setValue("duration", duration);
  }, [duration, form]);
  useEffect(() => {
    form.setValue("time", "");
  }, [date, serviceId, form]);
  async function submit(data: Booking) {
    try {
      if (!service) throw new Error("Escolha um serviço disponível.");
      const result = await apiRequest("POST", "/api/appointments", {
        ...data,
        duration: service.durationMinutes,
      });
      if (!result.appointment?.id)
        throw new Error(
          "Não foi possível confirmar o envio. Fale com a clínica antes de tentar novamente.",
        );
      setReceipt({ code: result.appointment.referralCode });
      setCopied(false);
      form.reset(defaults);
      toast({
        title: "Solicitação enviada",
        description:
          "A clínica entrará em contato para confirmar seu agendamento.",
      });
    } catch (error) {
      toast({
        title: "Erro ao agendar",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  }
  const error = (key: keyof Booking) => form.formState.errors[key]?.message;
  const fieldError = (key: keyof Booking) =>
    error(key) ? (
      <p id={`${key}-error`} className="field-error" role="alert">
        {String(error(key))}
      </p>
    ) : null;
  const common = (key: keyof Booking) => ({
    "aria-invalid": !!error(key),
    "aria-describedby": error(key) ? `${key}-error` : undefined,
  });
  return (
    <section id="contato" className="booking-section section-pad">
      <div className="site-shell booking-grid">
        <div className="booking-copy">
          <div className="eyebrow">04 / Um convite para cuidar de si</div>
          <h2 className="section-title">
            Abra espaço
            <br />
            para <em>você.</em>
          </h2>
          <p className="section-copy">
            Escolha seu serviço e o melhor horário. Nós cuidamos dos próximos
            passos com você.
          </p>
          <div className="contact-details">
            <div>
              <Clock3 size={20} />
              <p>
                <strong>Nosso horário</strong>
                <span>
                  Segunda a sexta: {settings.weekdayStart} às{" "}
                  {settings.weekdayEnd}
                </span>
                <span>
                  {settings.weekendsOpen
                    ? `Sábado e domingo: ${settings.weekendStart} às ${settings.weekendEnd}`
                    : "Fechado aos sábados e domingos"}
                </span>
              </p>
            </div>
            {settings.address && (
              <div>
                <MapPin size={20} />
                <p>
                  <strong>Onde estamos</strong>
                  <span>{settings.address}</span>
                </p>
              </div>
            )}
            {settings.phone && (
              <a
                href={whatsappLink(settings.phone)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={20} />
                <p>
                  <strong>Prefere conversar?</strong>
                  <span>
                    Fale com a clínica pelo WhatsApp <ArrowUpRight size={14} />
                  </span>
                </p>
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="contact-email">
                {settings.email}
              </a>
            )}
          </div>
          <div className="booking-assurance">
            <span className="status-dot" /> Uma solicitação, sem pressa.
            <p>O horário será confirmado pela nossa equipe após o envio.</p>
          </div>
        </div>
        <div className="booking-card">
          <div className="booking-card-heading">
            <span className="eyebrow">Seu próximo momento</span>
            <span className="booking-step">Agendamento</span>
          </div>
          {(isError || settingsError) && (
            <div role="alert" className="inline-notice">
              Não foi possível carregar as opções de agendamento.{" "}
              <button
                type="button"
                onClick={() => {
                  void refetch();
                  void refetchSettings();
                }}
                className="underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!isPending && !isError && services.length === 0 && (
            <div role="status" className="inline-notice">
              A clínica ainda não publicou serviços para agendamento.
            </div>
          )}
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            <fieldset
              disabled={blocked || form.formState.isSubmitting}
              className="booking-fields"
            >
              <legend className="sr-only">Dados do agendamento</legend>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="clientName">Nome Completo</label>
                  <input
                    id="clientName"
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                    {...form.register("clientName")}
                    {...common("clientName")}
                  />
                  {fieldError("clientName")}
                </div>
                <div className="form-field">
                  <label htmlFor="clientPhone">Telefone/WhatsApp</label>
                  <input
                    id="clientPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    {...form.register("clientPhone")}
                    {...common("clientPhone")}
                  />
                  {fieldError("clientPhone")}
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="service">Serviço Desejado</label>
                <select
                  id="service"
                  {...form.register("service")}
                  {...common("service")}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.durationMinutes} min ·{" "}
                      {money(item.priceCents)}
                    </option>
                  ))}
                </select>
                {fieldError("service")}
              </div>
              {service && (
                <div className="booking-summary">
                  <span>
                    {service.name}
                    <small>{service.durationMinutes} minutos de cuidado</small>
                  </span>
                  <strong>{money(service.priceCents)}</strong>
                </div>
              )}
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="date">Data</label>
                  <input
                    id="date"
                    type="date"
                    min={clinicNow().date}
                    {...form.register("date")}
                    {...common("date")}
                  />
                  {fieldError("date")}
                </div>
                <div className="form-field">
                  <label htmlFor="time">Horário</label>
                  <select
                    id="time"
                    disabled={!date || !service}
                    {...form.register("time")}
                    {...common("time")}
                  >
                    <option value="">Selecione um horário</option>
                    {slots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {fieldError("time")}
                  {date && service && slots.length === 0 && (
                    <p className="field-hint">
                      Sem horários para esta data. Escolha outro dia.
                    </p>
                  )}
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="referredBy">
                  Código de indicação <span>opcional</span>
                </label>
                <input
                  id="referredBy"
                  placeholder="Você recebeu um código?"
                  {...form.register("referredBy")}
                  {...common("referredBy")}
                />
                {fieldError("referredBy")}
              </div>
              <div className="form-field">
                <label htmlFor="notes">
                  Observações <span>opcional</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Conte se há algo que gostaria que a equipe soubesse."
                  {...form.register("notes")}
                  {...common("notes")}
                />
                {fieldError("notes")}
              </div>
              <button
                className="pill-button booking-submit"
                type="submit"
                disabled={blocked || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    Confirmar Agendamento <ArrowUpRight size={18} />
                  </>
                )}
              </button>
            </fieldset>
            <p className="booking-footnote">
              Ao enviar, você autoriza a clínica a entrar em contato sobre esta
              solicitação.
            </p>
          </form>
        </div>
      </div>
      <Dialog
        open={!!receipt}
        onOpenChange={(open) => {
          if (!open) setReceipt(null);
        }}
      >
        <DialogContent className="receipt-dialog">
          <DialogHeader>
            <div className="receipt-icon">
              <Check />
            </div>
            <DialogTitle>Seu momento está mais perto.</DialogTitle>
            <DialogDescription>
              Recebemos sua solicitação. Nossa equipe entrará em contato para
              confirmar.
            </DialogDescription>
          </DialogHeader>
          {receipt?.code && (
            <div className="receipt-code">
              <p>Seu código de indicação</p>
              <strong>{receipt.code}</strong>
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(receipt.code!);
                    setCopied(true);
                  } catch {
                    toast({
                      title: "Não foi possível copiar",
                      description: "Selecione e copie o código manualmente.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                {copied ? "Copiado" : "Copiar código"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
