"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
      });
      if (error) {
        setNotice("Não foi possível enviar a solicitação. Confira o e-mail e tente novamente.");
        return;
      }
      setNotice("Se houver uma conta cadastrada com esse e-mail, você receberá as instruções para redefinir a senha.");
    } catch {
      setNotice("O serviço de autenticação ainda não está configurado neste ambiente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="recover-title">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">D</span>
          <span>DMRJ <strong>Scheduling</strong></span>
        </Link>
        <span className="eyebrow">RECUPERAÇÃO DE ACESSO</span>
        <h1 id="recover-title">Esqueceu sua senha?</h1>
        <p className="auth-intro">Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="recover-email">E-mail da conta</label>
            <input id="recover-email" type="email" autoComplete="email" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar link de recuperação"}</button>
        </form>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <p className="auth-switch"><Link href="/login">Voltar para entrar</Link></p>
      </section>
    </main>
  );
}
