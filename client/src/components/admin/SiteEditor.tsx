import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, ArrowUpRight } from "lucide-react";
import { apiRequest } from "@/lib/api-request";
import { useSiteSettings } from "@/lib/catalog";
import {
  defaultSiteSettings,
  siteSettingsSchema,
  type SiteSettings,
} from "@shared/catalog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
export default function SiteEditor() {
  const query = useSiteSettings();
  const client = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteSettings>({ ...defaultSiteSettings });
  const [dirty, setDirty] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [aboutUploading, setAboutUploading] = useState(false);
  useEffect(() => {
    if (query.data && !dirty) setDraft(query.data);
  }, [query.data, dirty]);
  function change<K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) {
    setDirty(true);
    setDraft((prev) => ({ ...prev, [key]: value }));
  }
  const mutation = useMutation({
    mutationFn: async () => {
      const result = siteSettingsSchema.safeParse(draft);
      if (!result.success) throw new Error(result.error.issues[0]?.message);
      return apiRequest("PUT", "/api/site-settings", result.data);
    },
    onSuccess: (result) => {
      client.setQueryData(["/api/site-settings"], result);
      setDirty(false);
      toast({
        title: "Conteúdo atualizado",
        description: "As alterações já estão disponíveis no site.",
      });
    },
    onError: (error) =>
      toast({
        title: "Não foi possível salvar",
        description: error.message,
        variant: "destructive",
      }),
  });
  const field = (
    key: keyof SiteSettings,
    label: string,
    type = "text",
    long = false,
  ) => (
    <div className="form-field" key={key}>
      <label htmlFor={`site-${key}`}>{label}</label>
      {long ? (
        <textarea
          id={`site-${key}`}
          rows={4}
          value={String(draft[key])}
          onChange={(e) => change(key, e.target.value)}
        />
      ) : (
        <input
          id={`site-${key}`}
          type={type}
          value={String(draft[key])}
          onChange={(e) => change(key, e.target.value)}
        />
      )}
    </div>
  );
  if (query.isPending)
    return (
      <div className="empty-state">
        <Loader2 className="animate-spin" />
        Carregando conteúdo…
      </div>
    );
  if (query.isError)
    return (
      <div className="empty-state" role="alert">
        <p>
          Não foi possível carregar o conteúdo. Nenhuma alteração foi feita.
        </p>
        <Button onClick={() => query.refetch()}>Tentar novamente</Button>
      </div>
    );
  return (
    <form
      className="admin-content editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="admin-section-heading">
        <div>
          <span className="eyebrow">Do seu jeito</span>
          <h2>Conteúdo do site</h2>
          <p>
            Identidade, apresentação, imagens, contatos e horários em um só
            lugar.
          </p>
        </div>
        <a className="text-button" href="/" target="_blank" rel="noreferrer">
          Ver site <ArrowUpRight size={16} />
        </a>
      </div>
      <fieldset disabled={mutation.isPending} className="editor-sections">
        <section className="editor-section">
          <h3>01 / Identidade & apresentação</h3>
          <div className="form-row">
            {field("brandName", "Nome da clínica")}
            {field("tagline", "Frase de apresentação")}
          </div>
          {field("heroTitle", "Título principal")}
          {field("heroDescription", "Descrição principal", "text", true)}
          {field("heroImageUrl", "URL da imagem principal (opcional)", "url")}
          <div className="form-field">
            <label>
              Imagem principal <span>opcional</span>
            </label>
            <ImageUpload
              currentImageUrl={draft.heroImageUrl}
              onImageUploaded={(url) => change("heroImageUrl", url)}
              onUploadingChange={setHeroUploading}
            />
            <p className="field-hint">
              Sem imagem cadastrada, o site usa a ilustração de bem-estar.
            </p>
          </div>
        </section>
        <section className="editor-section">
          <h3>02 / Sobre a clínica</h3>
          {field("aboutTitle", "Título da seção sobre")}
          {field("aboutDescription", "Texto sobre a clínica", "text", true)}
          {field("aboutImageUrl", "URL da imagem sobre (opcional)", "url")}
          <div className="form-field">
            <label>
              Imagem da seção sobre <span>opcional</span>
            </label>
            <ImageUpload
              currentImageUrl={draft.aboutImageUrl}
              onImageUploaded={(url) => change("aboutImageUrl", url)}
              onUploadingChange={setAboutUploading}
            />
          </div>
        </section>
        <section className="editor-section">
          <h3>03 / Contato & funcionamento</h3>
          {field("address", "Endereço")}
          <div className="form-row">
            {field("phone", "WhatsApp (país + DDD + número)", "tel")}
            {field("email", "E-mail", "email")}
          </div>
          <p className="field-hint">
            Contatos em branco não aparecem no site. O WhatsApp aceita apenas
            dígitos, incluindo código do país.
          </p>
          <div className="form-row">
            {field("weekdayStart", "Abertura — segunda a sexta", "time")}
            {field("weekdayEnd", "Fechamento — segunda a sexta", "time")}
          </div>
          <label className="publish-toggle">
            <input
              type="checkbox"
              checked={draft.weekendsOpen}
              onChange={(e) => change("weekendsOpen", e.target.checked)}
            />
            <span>Atender aos sábados e domingos</span>
          </label>
          <div className="form-row">
            {field("weekendStart", "Abertura — fim de semana", "time")}
            {field("weekendEnd", "Fechamento — fim de semana", "time")}
          </div>
          <p className="field-hint">
            O agendamento respeita estes horários e a duração de cada serviço.
          </p>
        </section>
      </fieldset>
      <div className="editor-save-bar">
        <span>
          {dirty
            ? "Você tem alterações não salvas."
            : "Conteúdo sincronizado com o site."}
        </span>
        <Button
          type="submit"
          disabled={
            !dirty || mutation.isPending || heroUploading || aboutUploading
          }
        >
          <Save size={16} className="mr-2" />
          {mutation.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
