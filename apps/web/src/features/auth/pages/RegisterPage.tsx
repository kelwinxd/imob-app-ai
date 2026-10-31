import { Link, useNavigate } from "react-router";
import { AuthCard } from "../components/AuthCard";
import { RegisterForm } from "../components/RegisterForm";
import { useRegisterForm } from "../hooks/useAuthForms";

export function RegisterPage() {
  const navigate = useNavigate();
  const form = useRegisterForm(() => navigate("/", { replace: true }));

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece a decorar seus anúncios em poucos minutos"
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm values={form.values} errors={form.errors} onChange={form.setField} onSubmit={form.submit} submitting={form.submitting} formError={form.formError} />
    </AuthCard>
  );
}
