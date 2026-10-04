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
      </div>
    </main>
  );
}
