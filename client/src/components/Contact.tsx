import { motion } from "framer-motion";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, ClipboardCopy, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAppointmentSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const appointmentFormSchema = insertAppointmentSchema.extend({
  clientName: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres.",
  }),
  clientPhone: z.string().max(11, {
    message: "Por favor, insira um número de telefone válido.",
  }),
  date: z.string().min(1, {
    message: "Por favor, selecione uma data.",
  }),
  time: z.string().min(1, {
    message: "Por favor, selecione um horário.",
  }),
  service: z.string().min(1, {
    message: "Por favor, selecione um serviço.",
  }),
  notes: z.string().optional(),
  referredBy: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const appointmentForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      service: "",
      date: "",
      time: "",
      duration: 60,
      notes: "",
      status: "agendado",
      referredBy: "",
    },
  });

  async function onAppointmentSubmit(data: AppointmentFormValues) {
    try {
      const responseData = await apiRequest("POST", "/api/appointments", data);
      const appointmentData = responseData?.appointment;

      // Mensagem de sucesso simples
      toast({
        title: "Agendamento realizado com sucesso!",
        description: "Aguarde nossa confirmação por WhatsApp.",
      });

      // Se o cliente recebeu um código de referência, mostramos no modal
      if (appointmentData && appointmentData.referralCode) {
        setReferralCode(appointmentData.referralCode);
        setIsReferralModalOpen(true);
      }

      // Resetar o formulário para valores padrão
      appointmentForm.reset({
        clientName: "",
        clientPhone: "",
        service: "",
        date: "",
        time: "",
        duration: 60,
        notes: "",
        status: "agendado",
        referredBy: "",
      });
      
      // Desmarcar os validadores de erro
      appointmentForm.clearErrors();
    } catch (error) {
      console.error("Erro ao agendar:", error);

      let errorMessage =
        "Ocorreu um erro ao realizar o agendamento. Tente novamente.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: errorMessage,
      });
    }
  }

  // Função para copiar o código para a área de transferência
  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard
        .writeText(referralCode)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Erro ao copiar código:", err);
          toast({
            variant: "destructive",
            title: "Erro ao copiar",
            description: "Não foi possível copiar o código. Tente novamente.",
          });
        });
    }
  };
  
  // Função para redirecionar para o WhatsApp da clínica
  const redirectToWhatsAppPayment = () => {
    // Formatar a mensagem para o WhatsApp
    const message = `Olá! Gostaria de realizar o pagamento do meu agendamento na Clínica Executivas.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5583981101444?text=${encodedMessage}`;
    
    // Abrir o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="contato" className="py-20 bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            Agendamento
          </h2>
          <p className="max-w-xl mx-auto text-gray-300">
            Faça seu agendamento online de forma rápida e fácil.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="bg-[#252525] p-8 rounded-lg shadow-md">
            <Form {...appointmentForm}>
              <form
                onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)}
                className="space-y-6"
              >
                {/* Layout em seções organizadas */}
                <div className="space-y-6">
                  {/* Seção de Informações Pessoais */}
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-white">
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={appointmentForm.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Seu nome completo"
                                className="text-gray-600 placeholder:text-gray-600"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={appointmentForm.control}
                        name="clientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone/WhatsApp</FormLabel>
                            <FormControl>
                              <Input placeholder="(83) 99999-9999"
                                className="text-gray-600 placeholder:text-gray-600"
                                {...field}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção de Detalhes do Serviço */}
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-white">
                      Detalhes do Serviço
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={appointmentForm.control}
                        name="service"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serviço Desejado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    "w-full",
                                    field.value
                                      ? "text-gray-600"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  <SelectValue placeholder="Selecione um serviço" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="suite-padrao">
                                  Suíte Padrão (Massagem com finalização sexual
                                  R$ 250,00)
                                </SelectItem>
                                <SelectItem value="suite-master">
                                  Suíte Master (Massagem com finalização sexual
                                  e Hidromassagem R$ 395,00)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção de Data e Hora */}
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-white">
                      Data e Hora
                    </h3>
                    <div className="flex flex-col space-y-4">
                      {/* Data do agendamento */}
                      <FormField
                        control={appointmentForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      field.value
                                        ? "text-gray-500"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {field.value ? (
                                      (() => {
                                        try {
                                          // Criar uma data local para evitar problemas com fuso horário
                                          const dateParts =
                                            field.value.split("-");
                                          if (dateParts.length !== 3) {
                                            return <span>Data inválida</span>;
                                          }

                                          // Extrair ano, mês e dia da string formatada
                                          const year = parseInt(
                                            dateParts[0],
                                            10,
                                          );
                                          const month =
                                            parseInt(dateParts[1], 10) - 1; // Os meses em JS começam em 0
                                          const day = parseInt(
                                            dateParts[2],
                                            10,
                                          );

                                          // Criar uma nova data com estes valores
                                          const date = new Date(
                                            year,
                                            month,
                                            day,
                                            12,
                                            0,
                                            0,
                                          );

                                          // Verificar se a data é válida
                                          if (isNaN(date.getTime())) {
                                            console.error(
                                              "Data inválida criada:",
                                              date,
                                            );
                                            return <span>Data inválida</span>;
                                          }

                                          console.log(
                                            "Data exibida no botão:",
                                            date,
                                          );

                                          // Usar formato longo em português
                                          return format(
                                            date,
                                            "EEEE, dd 'de' MMMM 'de' yyyy",
                                            { locale: ptBR },
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Erro ao formatar data:",
                                            error,
                                          );
                                          return <span>Erro na data</span>;
                                        }
                                      })()
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="center"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value + "T12:00:00")
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      // Evita problemas de fuso horário ao adicionar um horário neutro
                                      const formattedDate = format(
                                        date,
                                        "yyyy-MM-dd",
                                      );

                                      console.log("Data clicada:", date);
                                      console.log(
                                        "Data formatada final:",
                                        formattedDate,
                                      );

                                      field.onChange(formattedDate);
                                      appointmentForm.setValue("time", "");
                                    } else {
                                      field.onChange("");
                                    }
                                  }}
                                  fromDate={new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Horário alinhado logo abaixo da data */}
                      <FormField
                        control={appointmentForm.control}
                        name="time"
                        render={({ field }) => {
                          // Determinar se é fim de semana com base na data selecionada
                          const isWeekend = (() => {
                            if (!appointmentForm.getValues("date"))
                              return false;
                            const date = new Date(
                              appointmentForm.getValues("date"),
                            );
                            const day = date.getDay();
                            return day === 0 || day === 6; // 0 = domingo, 6 = sábado
                          })();

                          const selectedDate =
                            appointmentForm.getValues("date");
                          const dateText = selectedDate
                            ? (() => {
                                try {
                                  const dateParts = selectedDate.split("-");
                                  const year = parseInt(dateParts[0], 10);
                                  const month = parseInt(dateParts[1], 10) - 1;
                                  const day = parseInt(dateParts[2], 10);
                                  const date = new Date(year, month, day);
                                  return format(date, "dd/MM/yyyy");
                                } catch {
                                  return "";
                                }
                              })()
                            : "";

                          return (
                            <FormItem>
                              <FormLabel>
                                Horário{" "}
                                {dateText && (
                                  <span className="text-sm font-normal text-gray-400 ml-2">
                                    para {dateText}
                                  </span>
                                )}
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={cn(
                                      "w-full",
                                      field.value
                                        ? "text-gray-600"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    <SelectValue placeholder="Selecione um horário" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isWeekend ? (
                                    // Horários para fim de semana (9:00 - 20:00)
                                    <>
                                      <SelectItem value="09:00">
                                        09:00
                                      </SelectItem>
                                      <SelectItem value="10:00">
                                        10:00
                                      </SelectItem>
                                      <SelectItem value="11:00">
                                        11:00
                                      </SelectItem>
                                      <SelectItem value="12:00">
                                        12:00
                                      </SelectItem>
                                      <SelectItem value="13:00">
                                        13:00
                                      </SelectItem>
                                      <SelectItem value="14:00">
                                        14:00
                                      </SelectItem>
                                      <SelectItem value="15:00">
                                        15:00
                                      </SelectItem>
                                      <SelectItem value="16:00">
                                        16:00
                                      </SelectItem>
                                      <SelectItem value="17:00">
                                        17:00
                                      </SelectItem>
                                      <SelectItem value="18:00">
                                        18:00
                                      </SelectItem>
                                      <SelectItem value="19:00">
                                        19:00
                                      </SelectItem>
                                      <SelectItem value="20:00">
                                        20:00
                                      </SelectItem>
                                    </>
                                  ) : (
                                    // Horários para dias úteis (8:30 - 21:00)
                                    <>
                                      <SelectItem value="08:30">
                                        08:30
                                      </SelectItem>
                                      <SelectItem value="09:00">
                                        09:00
                                      </SelectItem>
                                      <SelectItem value="10:00">
                                        10:00
                                      </SelectItem>
                                      <SelectItem value="11:00">
                                        11:00
                                      </SelectItem>
                                      <SelectItem value="12:00">
                                        12:00
                                      </SelectItem>
                                      <SelectItem value="13:00">
                                        13:00
                                      </SelectItem>
                                      <SelectItem value="14:00">
                                        14:00
                                      </SelectItem>
                                      <SelectItem value="15:00">
                                        15:00
                                      </SelectItem>
                                      <SelectItem value="16:00">
                                        16:00
                                      </SelectItem>
                                      <SelectItem value="17:00">
                                        17:00
                                      </SelectItem>
                                      <SelectItem value="18:00">
                                        18:00
                                      </SelectItem>
                                      <SelectItem value="19:00">
                                        19:00
                                      </SelectItem>
                                      <SelectItem value="20:00">
                                        20:00
                                      </SelectItem>
                                      <SelectItem value="21:00">
                                        21:00
                                      </SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              <p className="text-xs text-gray-400 mt-1">
                                {isWeekend
                                  ? "Sábados e domingos: 9:00 - 20:00"
                                  : "Segunda a sexta: 8:30 - 21:00"}
                              </p>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Seção de Referência e Observações */}
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-white">
                      Referência e Observações
                    </h3>

                    {/* Campo de código de referência */}
                    <FormField
                      control={appointmentForm.control}
                      name="referredBy"
                      render={({ field }) => (
                        <FormItem className="mb-4 text-gray-600">
                          <FormLabel>Código de Indicação (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Se você foi indicado por alguém, digite o código aqui"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <p className="text-xs text-white mt-1">
                            Se alguém te indicou, insira o código dela para que
                            ela ganhe um desconto.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campo de observações */}
                    <FormField
                      control={appointmentForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Preferência de bebida, fumante ou preferência com as profissionais..."
                              className="min-h-[80px] text-gray-600"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="text-red-400">*</span> Para realizar o pagamento, você será redirecionado para o WhatsApp da clínica.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Botões de confirmação e pagamento */}
                <div className="mt-8 space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-secondary hover:bg-secondary/90 text-black font-medium py-6 text-lg"
                    disabled={appointmentForm.formState.isSubmitting}
                  >
                    {appointmentForm.formState.isSubmitting
                      ? "Agendando..."
                      : "Confirmar Agendamento"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-red-600 text-red-500 hover:bg-red-600/10 font-medium py-6 text-lg flex items-center justify-center"
                    onClick={redirectToWhatsAppPayment}
                  >
                    <svg 
                      className="w-5 h-5 mr-2" 
                      fill="currentColor" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 448 512"
                    >
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    Realizar Pagamento
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-[#252525] p-6 rounded-lg">
            <h3 className="text-xl font-display mb-2">Endereço</h3>
            <p className="text-gray-300">
              R. Papa João XXIII, 608 - Liberdade
              <br />
              Campina Grande - PB, 58414-300
            </p>
          </div>

          <div className="bg-[#252525] p-6 rounded-lg">
            <h3 className="text-xl font-display mb-2">
              Horário de Funcionamento
            </h3>
            <p className="text-gray-300">
              Segunda a Sexta:
              <br />
              8:30 - 21:00
            </p>
            <p className="text-gray-300">
              Sabado e Domingo:
              <br />
              9:00 - 20:00
            </p>
          </div>

          <div className="bg-[#252525] p-6 rounded-lg">
            <h3 className="text-xl font-display mb-2">Contato</h3>
            <p className="text-gray-300">
              contato@clinicaexecutivas.com.br
              <br />
              +55 (83) 98110-1444
            </p>
          </div>
        </motion.div>
      </div>

      {/* Modal de código de indicação */}
      <Dialog 
        open={isReferralModalOpen} 
        onOpenChange={(open) => {
          setIsReferralModalOpen(open);
          // Se estiver fechando o modal, garantir que o formulário esteja totalmente resetado
          if (!open) {
            appointmentForm.reset({
              clientName: "",
              clientPhone: "",
              service: "",
              date: "",
              time: "",
              duration: 60,
              notes: "",
              status: "agendado",
              referredBy: "",
            });
            appointmentForm.clearErrors();
          }
        }}>
        <DialogContent className="sm:max-w-md bg-[#252525] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-display">
              Seu Código de Indicação
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              Compartilhe este código com amigos e ganhe descontos!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <div className="bg-gradient-to-r from-red-800 to-red-600 p-6 rounded-lg mb-4 w-full max-w-xs">
              <p className="text-center text-4xl font-bold tracking-wider">
                {referralCode}
              </p>
            </div>
            <p className="text-sm text-center mb-4 text-gray-300">
              A cada 3 indicações que usarem seu código, você ganha um desconto
              de R$50 em seu próximo atendimento.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="default"
              className="bg-red-700 hover:bg-red-800"
              onClick={copyReferralCode}
            >
              {isCopied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copiar Código
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
