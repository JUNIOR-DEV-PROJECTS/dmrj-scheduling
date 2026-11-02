"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "../../components/password-input";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("erro");
    if (error === "confirmacao") setNotice("Não foi possível confirmar seu e-mail. Tente entrar novamente ou solicite um novo link.");
    if (error === "permissao") setNotice("Esta conta não possui acesso ativo a uma empresa.");
    if (error === "config") setNotice("O Supabase ainda não foi configurado para este ambiente.");
  }, []);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setNotice("Não foi possível entrar. Confira seu e-mail e senha e tente novamente.");
        return;
      }

      setPassword("");
      router.replace("/painel");
      router.refresh();
    } catch {
      setNotice("O sistema de acesso ainda não está configurado. As credenciais não foram armazenadas.");
    } finally {
      setLoading(false);
    }
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
            <input id="login-email" name="email" type="email" autoComplete="username" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} />
          </div>
          <PasswordInput id="login-password" label="Senha" value={password} onChange={setPassword} autoComplete="current-password" disabled={loading} />
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <p className="auth-switch"><Link href="/recuperar-senha">Esqueci minha senha</Link></p>
        <p className="auth-switch">Ainda não tem uma conta? <Link href="/cadastro/empresa">Cadastre sua empresa</Link></p>
        <p className="auth-footnote">O nível de acesso é verificado pelo servidor e pelo banco de dados. Não é possível escolher ou alterar o próprio papel nesta tela.</p>
        <Link className="auth-back" href="/">Voltar ao início</Link>
      </section>
    </main>
  );
}
