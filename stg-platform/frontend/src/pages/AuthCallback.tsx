import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { setAuthToken } from "../services/api";
import { useAuth } from "../context/AuthContext";

const TOKEN_KEY = "stg_token";

export function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const errorParam = params.get("error") || params.get("error_description");

      if (errorParam) {
        const msg = decodeURIComponent(errorParam).replace(/_/g, " ");

        if (mounted) {
          setError(msg);
          setTimeout(() => navigate("/login", { replace: true }), 3500);
        }

        return;
      }

      if (!token) {
        if (mounted) {
          setError("Token de autenticação não encontrado. Tente fazer login novamente.");
          setTimeout(() => navigate("/login", { replace: true }), 3500);
        }

        return;
      }

      // Salva o token de forma persistente
      localStorage.setItem(TOKEN_KEY, token);

      // Mantém compatibilidade caso algum arquivo antigo procure outra chave
      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token);

      // Configura o token no client da API
      setAuthToken(token);

      try {
        await refreshUser();
      } catch (err) {
        console.error("Erro ao carregar usuário após login:", err);
      }

      if (mounted) {
        navigate("/", { replace: true });
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, refreshUser]);

  return (
    <div className="stg-auth-screen tactical-shell flex min-h-screen flex-col items-center justify-center px-4">
      <div className="scanline-overlay" />

      <div className="stg-auth-panel tactical-panel tactical-edge relative max-w-md p-8 text-center">
        <h1 className="mb-4 text-3xl font-black uppercase tracking-[0.08em] text-[#f1f0e7]">
          Autenticando
        </h1>

        {!error && (
          <>
            <div className="mx-auto size-12 animate-spin rounded-full border-4 border-[#a855f7] border-t-[#b7ff4a]" />
            <p className="mt-4 text-sm text-[#9ca58d]">
              Verificando sessão com Discord...
            </p>
          </>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 border border-[#f05b24]/35 bg-[#f05b24]/10 p-4 text-left">
            <AlertCircle className="mt-0.5 flex-shrink-0 text-[#f05b24]" size={20} />
            <p className="text-sm text-[#f05b24]">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
