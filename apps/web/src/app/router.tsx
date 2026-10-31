import { createBrowserRouter, Link } from "react-router";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { GuestLayout, ProtectedLayout } from "../features/auth/containers/RouteGuards";
import { NewPropertyPage } from "../features/properties/pages/NewPropertyPage";
import { PropertiesPage } from "../features/properties/pages/PropertiesPage";
import { PropertyPage } from "../features/properties/pages/PropertyPage";
import { ProfilePage } from "../features/profile/pages/ProfilePage";
import { StagingPage } from "../features/stagings/pages/StagingPage";
import { EmptyState } from "../shared/ui/EmptyState";
import { buttonClasses } from "../shared/ui/Button";

function NotFound() {
  return (
    <div className="mx-auto max-w-md p-6 pt-20">
      <EmptyState title="Página não encontrada" action={<Link to="/" className={buttonClasses({})}>Voltar ao início</Link>} />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <GuestLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/cadastro", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/", element: <PropertiesPage /> },
      { path: "/imoveis/novo", element: <NewPropertyPage /> },
      { path: "/imoveis/:id", element: <PropertyPage /> },
      { path: "/imoveis/:id/decoracoes/:stagingId", element: <StagingPage /> },
      { path: "/perfil", element: <ProfilePage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
