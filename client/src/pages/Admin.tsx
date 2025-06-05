import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ImageUpload } from "@/components/ImageUpload";
import { Loader2, Plus, Edit, Trash2, LogOut, Calendar as CalendarIcon, Clock, User, Phone, MapPin } from "lucide-react";

// Função auxiliar para fazer requisições
async function apiRequest(method: string, url: string, data?: any) {
  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Erro na requisição" }));
    throw new Error(errorData.message || `HTTP Error: ${response.status}`);
  }

  return response.json();
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

interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  service: string;
  massagistaId: number | null;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyStats {
  month: string;
  count: number;
  appointments: Appointment[];
}

interface ClientStats {
  clientName: string;
  clientPhone: string;
  count: number;
  appointments: Appointment[];
}

export default function Admin() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("massagistas");
  const [massagistaModalOpen, setMassagistaModalOpen] = useState(false);
  const [isEditingMassagista, setIsEditingMassagista] = useState(false);
  const [currentMassagista, setCurrentMassagista] = useState<Massagista | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [massagistaFormData, setMassagistaFormData] = useState<MassagistaFormData>({
    nome: "",
    descricao: "",
    fotoUrl: "",
    videoUrl: "",
    suiteMaster: false,
    ativa: true,
  });

  // Buscar todas as massagistas
  const { data: massagistas = [], isLoading: isLoadingMassagistas, refetch: refetchMassagistas } = useQuery({
    queryKey: ["/api/massagistas"],
    queryFn: () => apiRequest("GET", "/api/massagistas"),
    enabled: isAuthenticated,
    select: (data: any) => data.massagistas as Massagista[],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // Buscar todos os agendamentos
  const { data: appointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: () => apiRequest("GET", "/api/appointments"),
    enabled: isAuthenticated,
    select: (data: any) => data.appointments as Appointment[],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // Calcular estatísticas mensais
  const monthlyStats: MonthlyStats[] = React.useMemo(() => {
    const grouped = appointments.reduce((acc: Record<string, Appointment[]>, appointment) => {
      const date = new Date(appointment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      
      if (!acc[monthName]) {
        acc[monthName] = [];
      }
      acc[monthName].push(appointment);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([month, appointments]) => ({
        month,
        count: appointments.length,
        appointments
      }))
      .sort((a, b) => b.count - a.count);
  }, [appointments]);

  // Calcular estatísticas de clientes
  const clientStats: ClientStats[] = React.useMemo(() => {
    const grouped = appointments.reduce((acc: Record<string, Appointment[]>, appointment) => {
      const key = `${appointment.clientName}-${appointment.clientPhone}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(appointment);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([key, appointments]) => ({
        clientName: appointments[0].clientName,
        clientPhone: appointments[0].clientPhone,
        count: appointments.length,
        appointments
      }))
      .sort((a, b) => b.count - a.count);
  }, [appointments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCalendarDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isSameDate = (date1: string, date2: Date) => {
    const d1 = new Date(date1).toISOString().split('T')[0];
    const d2 = date2.toISOString().split('T')[0];
    return d1 === d2;
  };

  // Filtrar agendamentos pela data selecionada
  const appointmentsForSelectedDate = React.useMemo(() => {
    return appointments.filter(appointment => 
      isSameDate(appointment.date, selectedDate)
    );
  }, [appointments, selectedDate]);

  // Obter datas que têm agendamentos para destacar no calendário
  const datesWithAppointments = React.useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(appointment => {
      dates.add(new Date(appointment.date).toISOString().split('T')[0]);
    });
    return Array.from(dates).map(dateStr => new Date(dateStr));
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      'agendado': { variant: 'default', label: 'Agendado' },
      'confirmado': { variant: 'default', label: 'Confirmado' },
      'realizado': { variant: 'default', label: 'Realizado' },
      'cancelado': { variant: 'destructive', label: 'Cancelado' },
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getServiceLabel = (service: string) => {
    const serviceMap: Record<string, string> = {
      'suite-padrao': 'Suíte Padrão',
      'suite-master': 'Suíte Master',
      'massagem-relaxante': 'Massagem Relaxante',
      'massagem-tantrica': 'Massagem Tântrica',
    };
    return serviceMap[service] || service;
  };

  // Redirecionar para login se não estiver autenticado
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const handleMassagistaFormChange = (field: keyof MassagistaFormData, value: string | boolean) => {
    setMassagistaFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  // Criar massagista
  const createMassagistaMutation = useMutation({
    mutationFn: (data: MassagistaFormData) => {
      return apiRequest("POST", "/api/massagistas", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/massagistas"] });
      await refetchMassagistas();
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
    mutationFn: (data: { id: number; massagista: Partial<MassagistaFormData> }) => {
      return apiRequest("PUT", `/api/massagistas/${data.id}`, data.massagista);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/massagistas"] });
      await refetchMassagistas();
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/massagistas"] });
      await refetchMassagistas();
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

  // Excluir agendamento
  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      await refetchAppointments();
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

  const handleDeleteAppointment = (appointment: Appointment) => {
    if (window.confirm(
      `Tem certeza que deseja excluir o agendamento de ${appointment.clientName} para ${formatDate(appointment.date)} às ${appointment.time}?`
    )) {
      deleteAppointmentMutation.mutate(appointment.id);
    }
  };

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-600">Gerencie massagistas, agendamentos e muito mais</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="massagistas">Massagistas</TabsTrigger>
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="massagistas" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Massagistas</CardTitle>
                  <CardDescription>Gerencie as massagistas da clínica</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => refetchMassagistas()} variant="outline" size="sm">
                    🔄 Atualizar
                  </Button>
                  <Button onClick={handleOpenCreateMassagistaModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Massagista
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMassagistas ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Carregando massagistas...</span>
                  </div>
                ) : massagistas.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    Nenhuma massagista cadastrada.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {massagistas.map((massagista) => (
                      <Card key={massagista.id} className="overflow-hidden">
                        <div className="aspect-square relative">
                          {massagista.fotoUrl ? (
                            <img
                              src={massagista.fotoUrl}
                              alt={massagista.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">Sem foto</span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{massagista.nome}</h3>
                            <div className="flex gap-1">
                              {massagista.suiteMaster && (
                                <Badge variant="secondary">Master</Badge>
                              )}
                              <Badge variant={massagista.ativa ? "default" : "secondary"}>
                                {massagista.ativa ? "Ativa" : "Inativa"}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{massagista.descricao}</p>
                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditMassagistaModal(massagista)}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMassagistaMutation.mutate(massagista.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agendamentos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendário */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Calendário
                  </CardTitle>
                  <CardDescription>
                    Selecione uma data para ver os agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      hasAppointments: datesWithAppointments,
                    }}
                    modifiersStyles={{
                      hasAppointments: {
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'white',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-primary rounded"></div>
                      <span>Dias com agendamentos</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Total de agendamentos: {appointments.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de agendamentos da data selecionada */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      Agendamentos para {selectedDate.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                    <CardDescription>
                      {appointmentsForSelectedDate.length} agendamento{appointmentsForSelectedDate.length !== 1 ? 's' : ''} encontrado{appointmentsForSelectedDate.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setSelectedDate(new Date())} 
                      variant="outline" 
                      size="sm"
                    >
                      Hoje
                    </Button>
                    <Button onClick={() => refetchAppointments()} variant="outline" size="sm">
                      🔄 Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Carregando agendamentos...</span>
                    </div>
                  ) : appointmentsForSelectedDate.length === 0 ? (
                    <div className="text-center text-gray-500 p-8">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Nenhum agendamento</h3>
                      <p className="text-sm">
                        Não há agendamentos para esta data.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointmentsForSelectedDate
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment) => (
                        <Card key={appointment.id} className="p-4 border-l-4 border-l-primary">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-semibold text-lg">{appointment.clientName}</span>
                                {getStatusBadge(appointment.status)}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.clientPhone}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">{appointment.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {getServiceLabel(appointment.service)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Duração: {appointment.duration} min
                                </div>
                              </div>
                              {appointment.notes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <strong>Observações:</strong> {appointment.notes}
                                </div>
                              )}
                              {appointment.referralCode && (
                                <div className="flex items-center gap-1 text-sm text-blue-600">
                                  <span>🎟️ Código de indicação: <strong>{appointment.referralCode}</strong></span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 ml-4">
                              <div>ID: #{appointment.id}</div>
                              <div>Criado: {formatDateTime(appointment.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAppointment(appointment)}
                              disabled={deleteAppointmentMutation.isPending}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              {deleteAppointmentMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resumo de todos os agendamentos */}
            <Card>
              <CardHeader>
                <CardTitle>Todos os Agendamentos</CardTitle>
                <CardDescription>Visão geral de todos os agendamentos da clínica</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    Nenhum agendamento encontrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map((appointment) => (
                      <div key={appointment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{appointment.clientName}</span>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>{formatDate(appointment.date)} às {appointment.time}</span>
                              <span>{getServiceLabel(appointment.service)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(appointment.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDate(new Date(appointment.date))}
                            className="text-xs"
                          >
                            Ver dia
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAppointment(appointment)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            {deleteAppointmentMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 10 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        Mostrando 10 de {appointments.length} agendamentos
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico por Mês</CardTitle>
                <CardDescription>Agendamentos organizados por mês</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyStats.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    Nenhum histórico disponível.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {monthlyStats.map((stat) => (
                      <Card key={stat.month} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold capitalize">{stat.month}</h3>
                          <Badge variant="outline">{stat.count} agendamentos</Badge>
                        </div>
                        <div className="space-y-2">
                          {stat.appointments.map((appointment) => (
                            <div key={appointment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{appointment.clientName}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                  {formatDate(appointment.date)} às {appointment.time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(appointment.status)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAppointment(appointment)}
                                  disabled={deleteAppointmentMutation.isPending}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  {deleteAppointmentMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mês com mais agendamentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Mês com Mais Agendamentos</CardTitle>
                  <CardDescription>Período de maior movimento</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyStats.length > 0 ? (
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-primary capitalize">
                        {monthlyStats[0].month}
                      </h3>
                      <p className="text-xl text-gray-600">
                        {monthlyStats[0].count} agendamentos
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>

              {/* Cliente que mais agendou */}
              <Card>
                <CardHeader>
                  <CardTitle>Cliente Mais Frequente</CardTitle>
                  <CardDescription>Quem mais utiliza nossos serviços</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientStats.length > 0 ? (
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-primary">
                        {clientStats[0].clientName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {clientStats[0].clientPhone}
                      </p>
                      <p className="text-lg text-gray-600">
                        {clientStats[0].count} agendamentos
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ranking de clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Clientes</CardTitle>
                <CardDescription>Clientes ordenados por frequência</CardDescription>
              </CardHeader>
              <CardContent>
                {clientStats.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    Nenhuma estatística disponível.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientStats.slice(0, 10).map((client, index) => (
                      <div key={`${client.clientName}-${client.clientPhone}`} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{client.clientName}</p>
                            <p className="text-xs text-gray-600">{client.clientPhone}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {client.count} agendamento{client.count > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{appointments.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clientes Únicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{clientStats.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meses Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{monthlyStats.length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
                    onChange={(e) => handleMassagistaFormChange("nome", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={massagistaFormData.descricao}
                    onChange={(e) => handleMassagistaFormChange("descricao", e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto da Massagista</Label>
                  <ImageUpload
                    onImageUploaded={(imageUrl) =>
                      handleMassagistaFormChange("fotoUrl", imageUrl)
                    }
                    currentImageUrl={massagistaFormData.fotoUrl}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL do Vídeo (opcional)</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://exemplo.com/video.mp4"
                    value={massagistaFormData.videoUrl}
                    onChange={(e) => handleMassagistaFormChange("videoUrl", e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="suiteMaster" className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="suiteMaster"
                      checked={massagistaFormData.suiteMaster}
                      onChange={(e) =>
                        handleMassagistaFormChange("suiteMaster", e.target.checked)
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
                      onChange={(e) => handleMassagistaFormChange("ativa", e.target.checked)}
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
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
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
      </div>
    </div>
  );
} 