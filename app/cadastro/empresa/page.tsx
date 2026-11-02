"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "../../../components/password-input";
import { createClient } from "../../../lib/supabase/client";

export default function BusinessSignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (password.length < 12) {
      setNotice("Crie uma senha com pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setNotice("As senhas não coincidem. Confira os dois campos.");
      return;
    }
    if (!accepted) {
      setNotice("É necessário aceitar os termos e a política de privacidade para continuar.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/painel`,
          data: {
            signup_kind: "business",
            business_name: businessName.trim(),
          },
        },
      });

      if (error) {
        setNotice("Não foi possível concluir o cadastro. Confira os dados e tente novamente.");
        return;
      }

      setPassword("");
      setConfirmation("");
      if (data.session) {
        router.replace("/painel");
        router.refresh();
      } else {
        setNotice("Cadastro iniciado! Confira sua caixa de entrada e confirme o e-mail para ativar o acesso.");
      }
    } catch {
      setNotice("O sistema de cadastro ainda não está configurado. Nenhuma informação foi armazenada pela aplicação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide" aria-labelledby="signup-title">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">D</span>
          <span>DMRJ <strong>Scheduling</strong></span>
        </Link>
        <span className="eyebrow">COMECE POR AQUI</span>
        <h1 id="signup-title">Cadastre sua empresa</h1>
        <p className="auth-intro">Crie o acesso inicial da sua empresa. Depois da confirmação do e-mail, você poderá configurar serviços, profissionais e horários.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="business-name">Nome da empresa</label>
            <input id="business-name" name="businessName" autoComplete="organization" placeholder="Nome do seu negócio" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required disabled={loading} maxLength={120} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">E-mail de acesso</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} />
          </div>
          <PasswordInput id="signup-password" label="Criar senha" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Mínimo de 12 caracteres" disabled={loading} />
          <PasswordInput id="signup-confirmation" label="Confirmar senha" name="passwordConfirmation" value={confirmation} onChange={setConfirmation} autoComplete="new-password" placeholder="Digite a senha novamente" disabled={loading} />
          <label className="auth-consent">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} disabled={loading} />
            <span>Li e aceito os termos de uso e a política de privacidade.</span>
          </label>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Criar conta da empresa"}
          </button>
        </form>

        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <p className="auth-switch">Já tem uma conta? <Link href="/login">Entrar</Link></p>
        <p className="auth-footnote">A autenticação usa o Supabase. A senha é processada pelo provedor de autenticação e não é copiada para as tabelas do DMRJ Scheduling.</p>
        <Link className="auth-back" href="/">Voltar ao início</Link>
      </section>
    </main>
  );
}
