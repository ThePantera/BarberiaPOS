import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-2xl">
            💈
          </div>
          <h1 className="text-2xl font-bold">Grovee Admin</h1>
          <p className="text-sm text-stone-500">Ingresá para abrir la caja</p>
        </div>
        <LoginForm />
        {process.env.DEMO_MODE === "true" && !process.env.ADMIN_PASSWORD && (
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-center text-sm">
            Demo: la contraseña es <b>admin</b>. Los datos se reinician cada tanto.
          </p>
        )}
      </div>
    </main>
  );
}
