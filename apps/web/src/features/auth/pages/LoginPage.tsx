import { Link, useLocation, useNavigate } from "react-router";
import { AuthCard } from "../components/AuthCard";
import { LoginForm } from "../components/LoginForm";
import { useLoginForm } from "../hooks/useAuthForms";

export function LoginPage() {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const form = useLoginForm(() => navigate(from, { replace: true }));

  return (
    <AuthCard
      title="Entrar"
      subtitle="Staging virtual com comprovação para o seu anúncio"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-medium text-brand-700 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm values={form.values} errors={form.errors} onChange={form.setField} onSubmit={form.submit} submitting={form.submitting} formError={form.formError} />
    </AuthCard>
  );
}
