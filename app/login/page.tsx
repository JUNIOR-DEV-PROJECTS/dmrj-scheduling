"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import PasswordInput from "../../components/password-input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("A tela está pronta, mas o acesso ainda não foi conectado a um sistema de autenticação. Nenhum dado foi enviado ou salvo.");
    setPassword("");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">D</span>
          <span>DMRJ <strong>Scheduling</strong></span>
        </Link>
        <span className="eyebrow">BEM-VINDO DE VOLTA</span>
        <h1 id="login-title">Entrar na sua conta</h1>
        <p className="auth-intro">Acesse o espaço da sua empresa para organizar os agendamentos.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">E-mail</label>
            <input id="login-email" name="email" type="email" autoComplete="username" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <PasswordInput id="login-password" label="Senha" value={password} onChange={setPassword} autoComplete="current-password" />
          <button className="auth-submit" type="submit">Entrar</button>
        </form>

        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <p className="auth-switch">Ainda não tem uma conta? <Link href="/cadastro/empresa">Cadastre sua empresa</Link></p>
        <p className="auth-footnote">O acesso de administrador da plataforma também será controlado pelo sistema de permissões, sem opção de escolher ou alterar o próprio nível de acesso nesta tela.</p>
        <Link className="auth-back" href="/">Voltar ao início</Link>
      </section>
    </main>
  );
}
