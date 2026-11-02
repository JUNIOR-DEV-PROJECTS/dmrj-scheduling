"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import PasswordInput from "../../../components/password-input";

export default function BusinessSignupPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setNotice("As senhas não coincidem. Confira os dois campos.");
      return;
    }
    if (!accepted) {
      setNotice("É necessário aceitar os termos e a política de privacidade para continuar.");
      return;
    }
    setNotice("A tela de cadastro está pronta, mas o cadastro real ainda não foi conectado ao sistema. Nenhum dado foi enviado ou salvo.");
    setPassword("");
    setConfirmation("");
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
        <p className="auth-intro">Crie o acesso inicial da sua empresa. Você poderá configurar serviços, profissionais e horários depois.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="business-name">Nome da empresa</label>
            <input id="business-name" name="businessName" autoComplete="organization" placeholder="Nome do seu negócio" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">E-mail de acesso</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <PasswordInput id="signup-password" label="Criar senha" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Crie uma senha" />
          <PasswordInput id="signup-confirmation" label="Confirmar senha" name="passwordConfirmation" value={confirmation} onChange={setConfirmation} autoComplete="new-password" placeholder="Digite a senha novamente" />
          <label className="auth-consent">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>Li e aceito os termos de uso e a política de privacidade.</span>
          </label>
          <button className="auth-submit" type="submit">Continuar cadastro</button>
        </form>

        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <p className="auth-switch">Já tem uma conta? <Link href="/login">Entrar</Link></p>
        <p className="auth-footnote">Esta é uma demonstração visual. O formulário ainda não cria contas, não inicia período de teste e não transmite informações.</p>
        <Link className="auth-back" href="/">Voltar ao início</Link>
      </section>
    </main>
  );
}
