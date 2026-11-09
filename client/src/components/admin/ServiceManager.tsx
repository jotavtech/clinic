import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Leaf,
  ArrowUpRight,
  Loader2,
  Pencil,
  Archive,
  Clock3,
} from "lucide-react";
import { apiRequest, responseList } from "@/lib/api-request";
import {
  serviceInputSchema,
  money,
  type ClinicService,
  type ServiceInput,
} from "@shared/catalog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
const blank: ServiceInput = {
  name: "",
  description: "",
  priceCents: 0,
  durationMinutes: 60,
  imageUrl: "",
  active: false,
};
export default function ServiceManager() {
  const { toast } = useToast();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<ServiceInput>(blank);
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const query = useQuery({
    queryKey: ["/api/services/manage"],
    queryFn: () => apiRequest("GET", "/api/services/manage"),
    select: (data) => responseList<ClinicService>(data, "services"),
  });
  const changed = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["/api/services"] }),
      client.invalidateQueries({ queryKey: ["/api/services/manage"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: async () => {
      if (!price.trim()) throw new Error("Informe o valor do serviço.");
      const parsed = serviceInputSchema.safeParse({
        ...draft,
        priceCents: Math.round(Number(price) * 100),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      return apiRequest(
        editing ? "PUT" : "POST",
        editing ? `/api/services/${editing}` : "/api/services",
        parsed.data,
      );
    },
    onSuccess: async () => {
      setOpen(false);
      await changed();
      toast({
        title: "Serviço salvo",
        description: draft.active
          ? "O serviço está publicado no site."
          : "Rascunho salvo. Publique quando estiver pronto.",
      });
    },
    onError: (error) =>
      toast({
        title: "Não foi possível salvar",
        description: error.message,
        variant: "destructive",
      }),
  });
  const archive = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: changed,
    onError: (error) =>
      toast({
        title: "Erro ao arquivar",
        description: error.message,
        variant: "destructive",
      }),
  });
  function edit(service?: ClinicService) {
    setEditing(service?.id ?? null);
    setDraft(
      service
        ? {
            name: service.name,
            description: service.description,
            priceCents: service.priceCents,
            durationMinutes: service.durationMinutes,
            imageUrl: service.imageUrl,
            active: service.active,
          }
        : { ...blank },
    );
    setPrice(service ? String(service.priceCents / 100) : "");
    setOpen(true);
  }
  return (
    <div className="admin-content">
      <div className="admin-section-heading">
        <div>
          <span className="eyebrow">Seu catálogo</span>
          <h2>Serviços & experiências</h2>
          <p>
            Defina o que a clínica oferece. Só serviços publicados aparecem no
            site.
          </p>
        </div>
        <Button onClick={() => edit()}>
          <Plus size={16} className="mr-2" />
          Novo serviço
        </Button>
      </div>
      {query.isPending ? (
        <div className="empty-state">
          <Loader2 className="animate-spin" />
          Carregando serviços…
        </div>
      ) : query.isError ? (
        <div className="empty-state" role="alert">
          <p>Não foi possível carregar o catálogo.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !query.data.length ? (
        <div className="empty-state admin-empty">
          <Leaf size={36} />
          <h3>Seu catálogo começa aqui.</h3>
          <p>
            Cadastre o primeiro serviço, defina os detalhes e publique quando
            estiver pronto.
          </p>
          <Button onClick={() => edit()}>
            Cadastrar primeiro serviço{" "}
            <ArrowUpRight size={16} className="ml-2" />
          </Button>
        </div>
      ) : (
        <div className="admin-service-grid">
          {query.data.map((service) => (
            <article className="admin-service-card" key={service.id}>
              <div className="flex justify-between items-center">
                <span
                  className={`catalog-status ${service.active ? "published" : ""}`}
                >
                  {service.active ? "Publicado" : "Rascunho"}
                </span>
                <Leaf size={20} />
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span>
                  <Clock3 size={14} />
                  {service.durationMinutes} min
                </span>
                <strong>{money(service.priceCents)}</strong>
              </div>
              <div className="admin-card-actions">
                <Button variant="outline" onClick={() => edit(service)}>
                  <Pencil size={14} className="mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  disabled={archive.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        `Arquivar ${service.name}? Novos agendamentos serão bloqueados. O histórico será preservado.`,
                      )
                    )
                      archive.mutate(service.id);
                  }}
                >
                  <Archive size={14} className="mr-2" />
                  Arquivar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!save.isPending && !uploading) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>
            <DialogDescription>
              Cadastre um serviço de cuidado e bem-estar. Salve como rascunho ou
              publique no site.
            </DialogDescription>
          </DialogHeader>
          <form
            className="editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!uploading) save.mutate();
            }}
          >
            <fieldset disabled={save.isPending} className="space-y-4">
              <div className="form-field">
                <label htmlFor="service-name">Nome do serviço</label>
                <input
                  id="service-name"
                  required
                  minLength={3}
                  maxLength={120}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Nome do cuidado oferecido"
                />
              </div>
              <div className="form-field">
                <label htmlFor="service-description">Descrição</label>
                <textarea
                  id="service-description"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="service-price">Preço (R$)</label>
                  <input
                    id="service-price"
                    type="number"
                    required
                    min="0"
                    max="100000"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="service-duration">Duração (minutos)</label>
                  <input
                    id="service-duration"
                    type="number"
                    required
                    min={15}
                    max={480}
                    step={15}
                    value={draft.durationMinutes}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="service-image-url">
                  URL da imagem (opcional)
                </label>
                <input
                  id="service-image-url"
                  type="url"
                  placeholder="https://…"
                  value={draft.imageUrl}
                  onChange={(event) =>
                    setDraft({ ...draft, imageUrl: event.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>
                  Imagem <span>opcional</span>
                </label>
                <ImageUpload
                  currentImageUrl={draft.imageUrl}
                  onImageUploaded={(imageUrl) =>
                    setDraft((prev) => ({ ...prev, imageUrl }))
                  }
                  onUploadingChange={setUploading}
                />
              </div>
              <label className="publish-toggle">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.checked })
                  }
                />
                <span>
                  <strong>Publicar no site</strong>
                  <small>Disponível no catálogo e no agendamento online.</small>
                </span>
              </label>
              <div className="editor-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading || save.isPending}>
                  {save.isPending ? "Salvando…" : "Salvar serviço"}
                </Button>
              </div>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
