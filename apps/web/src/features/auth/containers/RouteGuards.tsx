import { Navigate, Outlet, useLocation } from "react-router";
import { Alert } from "../../../shared/ui/Alert";
import { AppShell } from "../../../shared/ui/AppShell";
import { Button } from "../../../shared/ui/Button";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { errorText } from "../../../shared/api/http";
import { useServerInfo } from "../../../shared/api/useServerInfo";
import { useLogout, useSession } from "../hooks/useSession";

export function ProtectedLayout() {
  const session = useSession();
  const logout = useLogout();
  const serverInfo = useServerInfo();
  const location = useLocation();

  if (session.isPending) return <FullPageSpinner />;
  if (session.isError) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Alert
          tone="danger"
          title="Não foi possível carregar sua sessão"
          action={<Button size="sm" variant="secondary" onClick={() => session.refetch()} loading={session.isFetching}>Tentar de novo</Button>}
        >
          {errorText(session.error)}
        </Alert>
      </div>
    );
  }
  if (!session.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <AppShell userName={session.data.name} onLogout={() => logout.mutate()} loggingOut={logout.isPending} mockAi={serverInfo.data?.aiMock}>
      <Outlet />
    </AppShell>
  );
}

export function GuestLayout() {
  const session = useSession();
  if (session.isPending) return <FullPageSpinner />;
  if (session.data) return <Navigate to="/" replace />;
  return <Outlet />;
}
