import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Lock, Mail, Crosshair } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const { signIn, loginWithDiscord } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate("/");
  };

  const handleDiscordLogin = () => {
    setDiscordLoading(true);
    setError(null);
    loginWithDiscord();
  };

  return (
    <div className="stg-auth-screen tactical-shell relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="scanline-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(168,85,247,0.2),transparent_28rem),radial-gradient(circle_at_20%_80%,rgba(132,204,22,0.1),transparent_24rem)]" />

      <div className="relative z-10 w-full max-w-md slide-up">
        <Link to="/" className="mb-10 flex items-center justify-center gap-3">
          <div className="tactical-edge flex size-12 items-center justify-center border border-[#a855f7]/50 bg-gradient-to-br from-[#a855f7] to-[#84cc16] font-black text-white glow-purple">
            STG
          </div>
          <div>
            <p className="text-xl font-black uppercase tracking-[0.16em] text-[#f8fafc]">STG</p>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#94a3b8]">
              Supremo Tribunal Gamer
            </p>
          </div>
        </Link>

        <div className="stg-auth-panel stg-hud-panel-glow mb-8 border-[#a855f7]/30 p-8">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#84cc16]">
            🔐 Acesso Tático
          </p>
          <h1 className="mb-2 text-3xl font-black uppercase tracking-[0.06em] text-[#f8fafc]">
            Bem-vindo, Operador
          </h1>
          <p className="mb-8 text-[#94a3b8]">
            Acesse sua identidade operacional STG. Cargos administrativos acessam painel especial.
          </p>

          {error && (
            <div className="mb-6 flex items-start gap-3 border border-[#f97316]/35 bg-[#f97316]/10 p-4 rounded-lg">
              <AlertCircle className="mt-0.5 flex-shrink-0 text-[#f97316]" size={20} />
              <p className="text-sm text-[#f97316]">{error}</p>
            </div>
          )}

          <button
            onClick={handleDiscordLogin}
            disabled={discordLoading}
            className="stg-button-primary w-full mb-6 flex items-center justify-center gap-2 glow-purple"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#5865f2] font-black text-xs">⊘</span>
            </div>
            {discordLoading ? "Conectando..." : "Conectar com Discord"}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#7c3aed]/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#111827] text-[#94a3b8]">OU</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="tactical-label block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#7c3aed]" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="tactical-edge w-full border border-[#7c3aed]/30 bg-[#111827] py-2.5 pl-10 pr-4 text-[#f8fafc] placeholder-[#475569] focus:border-[#a855f7] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="tactical-label block mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[#7c3aed]" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="tactical-edge w-full border border-[#7c3aed]/30 bg-[#111827] py-2.5 pl-10 pr-4 text-[#f8fafc] placeholder-[#475569] focus:border-[#a855f7] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="stg-button-secondary w-full flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin">
                    <Crosshair size={18} />
                  </div>
                  Verificando...
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  Acessar Centro de Comando
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#7c3aed]/20 text-center text-sm text-[#94a3b8]">
            <p>
              Não tem conta?{" "}
              <Link to="/signup" className="text-[#a855f7] hover:text-[#c084fc] font-bold">
                Criar operador
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-[#7c3aed] space-y-1">
          <p>🛡️ Dados protegidos com criptografia militar</p>
          <p>OPERAÇÃO STG | Acesso Seguro</p>
        </div>
      </div>
    </div>
  );
}
