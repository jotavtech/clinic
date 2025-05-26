import React from 'react';
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parse, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Loader2,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserIcon,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: number;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  notes: string | null;
  status: string;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: string;
}

interface Referral {
  id: number;
  clientName: string;
  clientPhone: string;
  referralCode: string;
  totalReferred: number;
  discountsEarned: number;
  discountsUsed: number;
  createdAt: string;
}

interface AppointmentFormData {
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: string;
}

interface Massagista {
  id: number;
  nome: string;
  descricao: string;
  fotoUrl: string;
  videoUrl: string | null;
  suiteMaster: boolean;
  ativa: boolean;
  createdAt: string;
}

interface MassagistaFormData {
  nome: string;
  descricao: string;
  fotoUrl: string;
  videoUrl: string;
  suiteMaster: boolean;
  ativa: boolean;
}

export default function Admin() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado para abas
  const [activeTab, setActiveTab] = useState<
    "agendamentos" | "massagistas" | "referrals" | "estatisticas"
  >("agendamentos");

  // Estados para agendamentos
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] =
    useState<Appointment | null>(null);

  // Estados para massagistas
  const [massagistaModalOpen, setMassagistaModalOpen] = useState(false);
  const [isEditingMassagista, setIsEditingMassagista] = useState(false);
  const [currentMassagista, setCurrentMassagista] = useState<Massagista | null>(
    null,
  );

  // Estado para expandir/recolher lista de clientes nas estatísticas
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const [formData, setFormData] = useState<AppointmentFormData>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    service: "",
    date: "",
    time: "",
    duration: 60,
    notes: "",
    status: "agendado",
  });

  const [massagistaFormData, setMassagistaFormData] =
    useState<MassagistaFormData>({
      nome: "",
      descricao: "",
      fotoUrl: "",
      videoUrl: "",
      suiteMaster: false,
      ativa: true,
    });

  // Estado para controlar o diálogo do código de indicação
  const [referralCodeDialog, setReferralCodeDialog] = useState<{
    isOpen: boolean;
    code: string | null;
    clientName: string | null;
  }>({
    isOpen: false,
    code: null,
    clientName: null
  });

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Buscar todos os agendamentos com atualização automática a cada 30 segundos
  const {
    data: appointments = [],
    isLoading: isLoadingAppointments,
    isError: isErrorAppointments,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated,
    select: (data: any) => data.appointments as Appointment[],
    refetchInterval: 30000, // Recarregar a cada 30 segundos
    refetchOnWindowFocus: true, // Recarregar quando a janela ganhar foco
    staleTime: 10000, // Considerar dados obsoletos após 10 segundos
  });

  // Buscar todas as massagistas
  const {
    data: massagistas = [],
    isLoading: isLoadingMassagistas,
    isError: isErrorMassagistas,
    refetch: refetchMassagistas,
  } = useQuery({
    queryKey: ["/api/massagistas"],
    enabled: isAuthenticated,
    select: (data: any) => data.massagistas as Massagista[],
  });

  // Buscar todas as referências
  const {
    data: referrals = [],
    isLoading: isLoadingReferrals,
    isError: isErrorReferrals,
    refetch: refetchReferrals,
  } = useQuery({
    queryKey: ["/api/referrals"],
    enabled: isAuthenticated,
    select: (data: any) => data.referrals as Referral[],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Buscar estatísticas mensais
  const {
    data: monthlyStats = [],
    isLoading: isLoadingMonthlyStats,
    isError: isErrorMonthlyStats,
  } = useQuery({
    queryKey: ["/api/stats/monthly"],
    enabled: isAuthenticated && activeTab === "estatisticas",
    select: (data: any) =>
      data.monthlyStats as {
        month: string;
        count: number;
        clients: string[];
        clientVisits: { name: string; count: number }[];
      }[],
    refetchInterval: 60000,
  });

  // Função para expandir/recolher a lista de clientes por mês
  const toggleMonthExpansion = (month: string) => {
    setExpandedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  // Agendamentos filtrados pela data selecionada
  const filteredAppointments = appointments.filter((appointment) =>
    isSameDay(parse(appointment.date, "yyyy-MM-dd", new Date()), selectedDate),
  );

  // Formatar data para exibição
  const formatDate = (dateStr: string): string => {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // Função para lidar com a criação/edição de agendamentos
  const handleFormChange = (
    field: keyof AppointmentFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Function to handle massagista form data changes
  const handleMassagistaFormChange = (
    field: keyof MassagistaFormData,
    value: string | boolean,
  ) => {
    setMassagistaFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Abrir modal para criação de massagista
  const handleOpenCreateMassagistaModal = () => {
    setIsEditingMassagista(false);
    setCurrentMassagista(null);
    setMassagistaFormData({
      nome: "",
      descricao: "",
      fotoUrl: "",
      videoUrl: "",
      suiteMaster: false,
      ativa: true,
    });
    setMassagistaModalOpen(true);
  };

  // Abrir modal para edição de massagista
  const handleOpenEditMassagistaModal = (massagista: Massagista) => {
    setIsEditingMassagista(true);
    setCurrentMassagista(massagista);
    setMassagistaFormData({
      nome: massagista.nome,
      descricao: massagista.descricao,
      fotoUrl: massagista.fotoUrl,
      videoUrl: massagista.videoUrl || "",
      suiteMaster: massagista.suiteMaster,
      ativa: massagista.ativa,
    });
    setMassagistaModalOpen(true);
  };

  // Abrir modal para criação
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentAppointment(null);
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      service: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      time: "09:00",
      duration: 60,
      notes: "",
      status: "agendado",
    });
    setAppointmentModalOpen(true);
  };

  // Abrir modal para edição
  const handleOpenEditModal = (appointment: Appointment) => {
    setIsEditing(true);
    setCurrentAppointment(appointment);
    setFormData({
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail,
      clientPhone: appointment.clientPhone,
      service: appointment.service,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      notes: appointment.notes || "",
      status: appointment.status,
    });
    setAppointmentModalOpen(true);
  };

  // Criar agendamento
  const createMutation = useMutation({
    mutationFn: (data: AppointmentFormData) => {
      return apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
      setAppointmentModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar agendamento",
        variant: "destructive",
      });
    },
  });

  // Atualizar agendamento
  const updateMutation = useMutation({
    mutationFn: (data: {
      id: number;
      appointment: Partial<AppointmentFormData>;
    }) => {
      return apiRequest(
        "PUT",
        `/api/appointments/${data.id}`,
        data.appointment,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso!",
      });
      setAppointmentModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar agendamento",
        variant: "destructive",
      });
    },
  });

  // Excluir agendamento
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir agendamento",
        variant: "destructive",
      });
    },
  });

  // Criar massagista
  const createMassagistaMutation = useMutation({
    mutationFn: (data: MassagistaFormData) => {
      return apiRequest("POST", "/api/massagistas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/massagistas"] });
      toast({
        title: "Sucesso",
        description: "Massagista adicionada com sucesso!",
      });
      setMassagistaModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar massagista",
        variant: "destructive",
      });
    },
  });

  // Atualizar massagista
  const updateMassagistaMutation = useMutation({
    mutationFn: (data: {
      id: number;
      massagista: Partial<MassagistaFormData>;
    }) => {
      return apiRequest("PUT", `/api/massagistas/${data.id}`, data.massagista);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/massagistas"] });
      toast({
        title: "Sucesso",
        description: "Massagista atualizada com sucesso!",
      });
      setMassagistaModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar massagista",
        variant: "destructive",
      });
    },
  });

  // Excluir massagista
  const deleteMassagistaMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/massagistas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/massagistas"] });
      toast({
        title: "Sucesso",
        description: "Massagista excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir massagista",
        variant: "destructive",
      });
    },
  });

  // Usar um desconto de referência
  const useDiscountMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("PUT", `/api/referrals/use-discount/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "Sucesso",
        description: "Desconto aplicado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aplicar desconto",
        variant: "destructive",
      });
    },
  });

  // Mutation para confirmar agendamento
  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/appointments/${id}/confirm`);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      // Abrimos o diálogo com o código
      setReferralCodeDialog({
        isOpen: true,
        code: data.referral.referralCode,
        clientName: data.appointment.clientName
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao confirmar o agendamento",
        variant: "destructive",
      });
    },
  });

  // Função para copiar o código para a área de transferência
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: "Código copiado!",
        description: "O código de indicação foi copiado para a área de transferência.",
      });
    });
  };

  // Submit do formulário de agendamento
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentAppointment) {
      updateMutation.mutate({
        id: currentAppointment.id,
        appointment: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Submit do formulário de massagista
  const handleMassagistaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingMassagista && currentMassagista) {
      updateMassagistaMutation.mutate({
        id: currentMassagista.id,
        massagista: massagistaFormData,
      });
    } else {
      createMassagistaMutation.mutate(massagistaFormData);
    }
  };

  // Função para lidar com o status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "agendado":
        return <Badge variant="outline">Agendado</Badge>;
      case "confirmado":
        return <Badge variant="secondary" className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "concluido":
        return <Badge variant="default">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Função para confirmar agendamento
  const handleConfirmAppointment = (id: number) => {
    confirmMutation.mutate(id);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Clínica Executivas - Painel Administrativo
          </h1>
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-primary shadow-md font-medium font-bold text-black"
            onClick={async () => {
              await logout();
              setLocation("/login");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6">
        {/* Abas para navegação */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4 flex-wrap">
            <button
              onClick={() => setActiveTab("agendamentos")}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "agendamentos"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Agendamentos
            </button>
            <button
              onClick={() => setActiveTab("massagistas")}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "massagistas"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Massagistas
            </button>
            <button
              onClick={() => setActiveTab("referrals")}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "referrals"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Indique e Ganhe
            </button>
            <button
              onClick={() => setActiveTab("estatisticas")}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "estatisticas"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Estatísticas
            </button>
          </div>
        </div>

        {/* Conteúdo da aba de Agendamentos */}
        {activeTab === "agendamentos" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Calendário */}
            <Card className="md:col-span-1 h-fit self-start">
              <CardHeader className="pb-1 pt-4">
                <CardTitle>Calendário</CardTitle>
                <CardDescription>
                  Selecione uma data para ver os agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-4">
                {/* Utilizamos um wrapper para garantir que o calendário fique centralizado */}
                <div className="w-full flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    fixedWeeks
                    captionLayout="dropdown-buttons"
                    fromYear={2025}
                    toYear={2030}
                    ISOWeek
                  />
                </div>
                <div className="mt-4 w-full">
                  <Button
                    onClick={handleOpenCreateModal}
                    className="w-full bg-secondary text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Agendamentos */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  Agendamentos -{" "}
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </CardTitle>
                <CardDescription>
                  {filteredAppointments.length === 0
                    ? "Não há agendamentos para esta data"
                    : `${filteredAppointments.length} agendamento(s) encontrado(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : isErrorAppointments ? (
                  <div className="text-center text-red-500 p-4">
                    Erro ao carregar agendamentos.{" "}
                    <Button
                      onClick={() => refetchAppointments()}
                      variant="link"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Não há agendamentos para a data selecionada.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Horário</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Código de Indicação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                {format(
                                  parse(
                                    appointment.date,
                                    "yyyy-MM-dd",
                                    new Date(),
                                  ),
                                  "dd/MM/yyyy",
                                )}
                              </TableCell>
                              <TableCell>{appointment.time}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {appointment.clientName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {appointment.clientPhone}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{appointment.service}</TableCell>
                              <TableCell>
                                {getStatusBadge(appointment.status)}
                              </TableCell>
                              <TableCell>
                                {appointment.referralCode ? (
                                  <Badge variant="secondary" className="font-mono">
                                    {appointment.referralCode}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {appointment.status === "agendado" && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleConfirmAppointment(appointment.id)}
                                      title="Confirmar Agendamento"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleOpenEditModal(appointment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Confirmar exclusão
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir este agendamento?
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            deleteMutation.mutate(appointment.id)
                                          }
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conteúdo da aba de Massagistas */}
        {activeTab === "massagistas" && (
          <div className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Massagistas</CardTitle>
                  <CardDescription>
                    Gerencie as massagistas da clínica
                  </CardDescription>
                </div>
                <Button
                  onClick={handleOpenCreateMassagistaModal}
                  className="bg-secondary text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Massagista
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMassagistas ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : isErrorMassagistas ? (
                  <div className="text-center text-red-500 p-4">
                    Erro ao carregar massagistas.{" "}
                    <Button onClick={() => refetchMassagistas()} variant="link">
                      Tentar novamente
                    </Button>
                  </div>
                ) : massagistas.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Não há massagistas cadastradas no sistema.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Foto</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Suíte</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {massagistas.map((massagista) => (
                          <TableRow key={massagista.id}>
                            <TableCell>
                              <div className="h-12 w-12 rounded-full overflow-hidden">
                                <img
                                  src={massagista.fotoUrl}
                                  alt={massagista.nome}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {massagista.nome}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {massagista.descricao}
                            </TableCell>
                            <TableCell>
                              {massagista.suiteMaster ? (
                                <Badge className="bg-secondary text-white">
                                  Suíte Master
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-500 text-white">
                                  Suíte Padrão
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {massagista.ativa ? (
                                <Badge className="bg-green-500">Ativa</Badge>
                              ) : (
                                <Badge className="bg-red-500">Inativa</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenEditMassagistaModal(massagista)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-500 border-red-200"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Excluir Massagista
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta
                                        massagista? Esta ação não pode ser
                                        desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deleteMassagistaMutation.mutate(
                                            massagista.id,
                                          )
                                        }
                                        className="bg-red-500 text-white hover:bg-red-600"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conteúdo da aba de Referências (Indique e Ganhe) */}
        {activeTab === "referrals" && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Sistema de Indicações</CardTitle>
                <CardDescription>
                  Gerenciamento do programa "Indique e Ganhe". Cada cliente que
                  indica recebe um desconto após a indicação ser confirmada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReferrals ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Carregando referências...</span>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma referência encontrada.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Indicações</TableHead>
                        <TableHead>Descontos</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium">
                            {referral.referralCode}
                          </TableCell>
                          <TableCell>{referral.clientName}</TableCell>
                          <TableCell>{referral.clientPhone}</TableCell>
                          <TableCell>{referral.totalReferred}</TableCell>
                          <TableCell>
                            {referral.discountsEarned >
                            referral.discountsUsed ? (
                              <Badge className="bg-green-500">
                                {referral.discountsEarned -
                                  referral.discountsUsed}{" "}
                                disponíveis
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-gray-500"
                              >
                                Nenhum desconto disponível
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                useDiscountMutation.mutate(referral.id)
                              }
                              disabled={
                                referral.discountsEarned <=
                                  referral.discountsUsed ||
                                useDiscountMutation.isPending
                              }
                              className={
                                referral.discountsEarned >
                                referral.discountsUsed
                                  ? "text-green-500 border-green-200 hover:bg-green-50"
                                  : ""
                              }
                            >
                              {useDiscountMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Usar Desconto
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conteúdo da aba de Estatísticas */}
        {activeTab === "estatisticas" && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Estatísticas Mensais</CardTitle>
                <CardDescription>
                  Visualização dos agendamentos por mês e histórico de clientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMonthlyStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Carregando estatísticas...</span>
                  </div>
                ) : isErrorMonthlyStats ? (
                  <div className="text-center text-red-500 p-4">
                    Erro ao carregar estatísticas.
                  </div>
                ) : monthlyStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma estatística disponível.</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Agendamentos por Mês
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Total de Agendamentos</TableHead>
                          <TableHead>Número de Clientes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyStats.map((stat) => (
                          <React.Fragment key={stat.month}>
                            <TableRow
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleMonthExpansion(stat.month)}
                            >
                              <TableCell className="font-medium">
                                {format(
                                  new Date(stat.month + "-01T00:00:00"),
                                  "MMMM 'de' yyyy",
                                  { locale: ptBR }
                                )}
                                {expandedMonths.includes(stat.month) ? (
                                  <ChevronDown className="ml-2 h-4 w-4 inline-block" />
                                ) : (
                                  <ChevronRight className="ml-2 h-4 w-4 inline-block" />
                                )}
                              </TableCell>
                              <TableCell>{stat.count}</TableCell>
                              <TableCell>{stat.clients.length}</TableCell>
                            </TableRow>

                            {/* Lista detalhada de clientes quando expandido */}
                            {expandedMonths.includes(stat.month) && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={3} className="p-4">
                                  <div className="text-sm font-medium mb-2">
                                    Lista de Clientes:
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {stat.clientVisits.map((clientVisit, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-200"
                                      >
                                        <div className="flex items-center">
                                          <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                          <span>{clientVisit.name}</span>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="ml-2 bg-red-50"
                                        >
                                          {clientVisit.count}{" "}
                                          {clientVisit.count === 1
                                            ? "visita"
                                            : "visitas"}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}


      {/* Modal de Criação/Edição de Agendamento */}
      <Dialog
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize os dados do agendamento conforme necessário."
                : "Preencha os dados para criar um novo agendamento."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    handleFormChange("clientName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-mail</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    handleFormChange("clientEmail", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    handleFormChange("clientPhone", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="service">Serviço</Label>
                <Select
                  value={formData.service}
                  onValueChange={(value) => handleFormChange("service", value)}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="massagem-relaxante">
                      Suíte Padrão
                    </SelectItem>
                    <SelectItem value="massagem-relaxante">
                      Suíte Luxo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleFormChange("time", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="30"
                  step="15"
                  value={formData.duration}
                  onChange={(e) =>
                    handleFormChange("duration", parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleFormChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="concluído">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAppointmentModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-white">
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : isEditing ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Atualizar
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação/Edição de Massagista */}
      <Dialog open={massagistaModalOpen} onOpenChange={setMassagistaModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingMassagista ? "Editar Massagista" : "Nova Massagista"}
            </DialogTitle>
            <DialogDescription>
              {isEditingMassagista
                ? "Atualize os dados da massagista conforme necessário."
                : "Preencha os dados para adicionar uma nova massagista."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMassagistaSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={massagistaFormData.nome}
                  onChange={(e) =>
                    handleMassagistaFormChange("nome", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={massagistaFormData.descricao}
                  onChange={(e) =>
                    handleMassagistaFormChange("descricao", e.target.value)
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fotoUrl">URL da Foto</Label>
                <Input
                  id="fotoUrl"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={massagistaFormData.fotoUrl}
                  onChange={(e) =>
                    handleMassagistaFormChange("fotoUrl", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">URL do Vídeo (opcional)</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://exemplo.com/video.mp4"
                  value={massagistaFormData.videoUrl}
                  onChange={(e) =>
                    handleMassagistaFormChange("videoUrl", e.target.value)
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="suiteMaster"
                  className="flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    id="suiteMaster"
                    checked={massagistaFormData.suiteMaster}
                    onChange={(e) =>
                      handleMassagistaFormChange(
                        "suiteMaster",
                        e.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Suíte Master
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="ativa" className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativa"
                    checked={massagistaFormData.ativa}
                    onChange={(e) =>
                      handleMassagistaFormChange("ativa", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Ativa
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMassagistaModalOpen(false)}
                className="mt-2 sm:mt-0"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white mt-2 sm:mt-0"
                disabled={
                  createMassagistaMutation.isPending ||
                  updateMassagistaMutation.isPending
                }
              >
                {(createMassagistaMutation.isPending ||
                  updateMassagistaMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditingMassagista ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog do Código de Indicação */}
      <Dialog 
        open={referralCodeDialog.isOpen} 
        onOpenChange={(open) => setReferralCodeDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-center text-primary">
              Agendamento Confirmado! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              <p className="mb-2">
                O agendamento de <span className="font-semibold">{referralCodeDialog.clientName}</span> foi confirmado com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Compartilhe o código abaixo para que o cliente possa indicar amigos e ganhar descontos.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="bg-primary/5 p-8 rounded-xl w-full text-center border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-3">Código de Indicação</p>
              <p className="text-4xl font-mono font-bold tracking-wider text-primary bg-white py-3 rounded-lg shadow-inner">
                {referralCodeDialog.code}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => referralCodeDialog.code && copyToClipboard(referralCodeDialog.code)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Código
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setReferralCodeDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Fechar
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              O cliente ganha um desconto a cada 3 indicações que realizarem agendamentos.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  </div>
);
}
