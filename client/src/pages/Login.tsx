import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/lib/catalog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowUpRight,
  Flower2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
export default function Login() {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false),
    [show, setShow] = useState(false);
  const { login } = useAuth();
  const { settings } = useSiteSettings();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand">
          <Flower2 size={28} />
          {settings.brandName}
        </div>
        <img src="/wellness.svg" alt="Ilustração de um ambiente de bem-estar" />
        <div className="login-quote">
          <span className="eyebrow">Cuidado em cada detalhe</span>
          <h2>
            Por trás de uma boa experiência,
            <br />
            <em>existe uma boa gestão.</em>
          </h2>
        </div>
      </section>
      <section className="login-form-panel">
        <Link href="/" className="text-button">
          <ArrowLeft size={15} />
          Voltar ao site
        </Link>
        <div className="login-form-content">
          <span className="eyebrow">Área administrativa</span>
          <h1>
            Bom ter você
            <br />
            por aqui.
          </h1>
          <p>Acesse para cuidar do catálogo, da equipe e dos agendamentos.</p>
          <form
            className="editor-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (loading) return;
              setLoading(true);
              try {
                await login(username.trim(), password);
                navigate("/admin");
              } catch (error) {
                toast({
                  title: "Não foi possível entrar",
                  description:
                    error instanceof Error ? error.message : "Tente novamente.",
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            <fieldset disabled={loading} className="space-y-5">
              <div className="form-field">
                <label htmlFor="username">Usuário</label>
                <input
                  id="username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de usuário"
                />
              </div>
              <div className="form-field">
                <label htmlFor="password">Senha</label>
                <div className="password-field">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="pill-button booking-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar <ArrowUpRight size={18} />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          <p className="login-help">
            Acesso exclusivo para administradores da clínica.
          </p>
        </div>
        <span className="login-copyright">
          © {new Date().getFullYear()} {settings.brandName}
        </span>
      </section>
    </main>
  );
}
