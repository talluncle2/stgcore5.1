import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, User, Mail, Lock, AlertCircle, Crosshair } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";

export function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const { signUp, signInWithDiscord } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password || !username || !confirmPassword) {
      setError("Todos os campos são obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (username.length < 3) {
      setError("O nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Nome de usuário pode conter apenas letras, números e _");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email, password, username);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  const handleDiscordSignup = async () => {
    setDiscordLoading(true);
    setError(null);

    const { error: discordError } = await signInWithDiscord();

    if (discordError) {
      setError(discordError.message);
      setDiscordLoading(false);
    }
    // Se sucesso, o Supabase vai redirecionar automaticamente
  };

  return (
    <div className="stg-auth-screen min-h-screen cod-military-bg flex flex-col items-center justify-center px-4 relative overflow-hidden py-10">
      {/* Tactical Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {/* Background pattern would be here */}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo */}
        <Link to="/" className="mb-12 flex items-center justify-center">
          <BrandLogo imageClassName="h-16 w-20" />
          <div className="hidden">
            ⚔️
          </div>
          <div className="hidden">
            <div className="cod-text-military text-[#a855f7]">STG</div>
            <div className="text-xs text-[#64748b]">Recrutamento Tático</div>
          </div>
        </Link>

        {/* Main Panel */}
        <div className="stg-auth-panel cod-mission-panel active p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Crosshair className="text-[#a855f7]" size={20} />
            <h1 className="cod-header-highlight">ALISTAMENTO</h1>
          </div>
          <p className="text-[#94a3b8] text-sm mb-6">Candidate-se à operação e entre para o exército STG</p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[#ef4444]/10 border-2 border-[#ef4444]/30 flex items-start gap-3">
              <AlertCircle className="text-[#ef4444] flex-shrink-0 mt-0.5" size={18} />
              <p className="text-[#ef4444] text-xs font-black uppercase">{error}</p>
            </div>
          )}

          {/* Discord Option - Primary */}
          <button
            onClick={handleDiscordSignup}
            disabled={discordLoading}
            className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-black uppercase hover:shadow-lg hover:shadow-[#5865F2]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 mb-4 text-xs tracking-wider"
          >
            {discordLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                CONECTANDO...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.492c-1.53-.742-3.155-1.288-4.848-1.59-.93.127-1.81.404-2.594.889-1.256-.294-2.466-.294-3.722 0-.783-.485-1.664-.762-2.594-.889-1.693.302-3.318.848-4.848 1.59-.257.435-.421.953-.421 1.494v14.382c0 1.892 1.648 3.414 3.75 3.414 1.032-.678 2.118-1.28 3.262-1.79.544-.34 1.11-.636 1.692-.886.582.25 1.148.546 1.692.886 1.144.51 2.23 1.112 3.262 1.79 2.102 0 3.75-1.522 3.75-3.414V5.986c0-.54-.164-1.059-.421-1.494z" />
                </svg>
                RECRUTAR COM DISCORD
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#2d3748]/50"></div>
            <span className="text-[#64748b] text-xs font-black uppercase">OU EMAIL</span>
            <div className="flex-1 h-px bg-[#2d3748]/50"></div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username */}
            <div>
              <label className="block text-[#94a3b8] text-xs font-black uppercase mb-2">Callsign (Nome Operador)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-[#a855f7]" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_callsign"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f172a] border-2 border-[#2d3748] text-white placeholder-[#64748b] focus:outline-none focus:border-[#a855f7] transition-colors text-sm font-mono uppercase"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#94a3b8] text-xs font-black uppercase mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-[#a855f7]" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f172a] border-2 border-[#2d3748] text-white placeholder-[#64748b] focus:outline-none focus:border-[#a855f7] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#94a3b8] text-xs font-black uppercase mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-[#a855f7]" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f172a] border-2 border-[#2d3748] text-white placeholder-[#64748b] focus:outline-none focus:border-[#a855f7] transition-colors text-sm font-mono"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[#94a3b8] text-xs font-black uppercase mb-2">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-[#a855f7]" size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f172a] border-2 border-[#2d3748] text-white placeholder-[#64748b] focus:outline-none focus:border-[#a855f7] transition-colors text-sm font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4 uppercase text-sm tracking-wider hover:shadow-lg hover:shadow-[#a855f7]/50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  PROCESSANDO...
                </>
              ) : (
                <>
                  INICIAR RECRUTAMENTO <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="space-y-3 text-center text-sm">
          <p className="text-[#94a3b8]">
            Já recrutado?{" "}
            <Link to="/login" className="text-[#a855f7] hover:text-[#7c3aed] font-black transition-colors">
              FAZER LOGIN
            </Link>
          </p>
          <Link
            to="/"
            className="block text-[#94a3b8] hover:text-[#a855f7] transition-colors font-black"
          >
            ← VOLTAR À BASE
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-center text-[#64748b] text-xs font-mono">
        <p>STG © 2026 - SUPREMO TRIBUNAL GAMER</p>
        <p className="text-[#2d3748]">MISSÃO RECRUTAMENTO TÁTICO</p>
      </footer>
    </div>
  );
}
