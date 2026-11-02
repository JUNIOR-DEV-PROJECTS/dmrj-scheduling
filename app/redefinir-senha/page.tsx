"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "../../components/password-input";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (password.length < 12) {
      setNotice("A nova senha precisa ter pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setNotice("As senhas não coincidem. Confira os dois campos.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { claims }, error: claimsError } = await supabase.auth.getClaims();
      if (claimsError || !claims?.sub) {
        setNotice("O link de recuperação expirou ou não é válido. Solicite um novo link.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setNotice("Não foi possível alterar a senha. Solicite um novo link e tente novamente.");
        return;
      }
      setPassword("");
      setConfirmation("");
      setSuccess(true);
      setNotice("Senha alterada com sucesso. Você já pode entrar com a nova senha.");
    } catch {
      setNotice("O serviço de autenticação ainda não está configurado neste ambiente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide" aria-labelledby="reset-title">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">D</span>
          <span>DMRJ <strong>Scheduling</strong></span>
        </Link>
        <span className="eyebrow">NOVA SENHA</span>
        <h1 id="reset-title">Crie uma nova senha</h1>
        <p className="auth-intro">Escolha uma senha com pelo menos 12 caracteres e confirme no segundo campo.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <PasswordInput id="new-password" label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Mínimo de 12 caracteres" disabled={loading || success} />
          <PasswordInput id="confirm-new-password" label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" placeholder="Digite novamente" disabled={loading || success} />
          <button className="auth-submit" type="submit" disabled={loading || success}>{loading ? "Salvando..." : "Salvar nova senha"}</button>
        </form>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {success && <button className="auth-submit auth-secondary-action" type="button" onClick={() => router.replace("/login")}>Ir para o login</button>}
      </section>
    </main>
  );
}
