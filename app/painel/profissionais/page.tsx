"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type Professional = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
};

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadProfessionals() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setNotice("Sua sessão não foi encontrada. Entre novamente.");
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userData.user.id)
        .eq("status", "active")
        .limit(1);

      if (membershipError) throw membershipError;
      const currentOrganizationId = memberships?.[0]?.organization_id;
      if (!currentOrganizationId) {
        setNotice("Não encontramos uma empresa ativa vinculada a esta conta.");
        return;
      }
      setOrganizationId(currentOrganizationId);

      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, email, phone, active")
        .eq("organization_id", currentOrganizationId)
        .order("name", { ascending: true });

      if (error) throw error;
      setProfessionals(data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar os profissionais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfessionals();
  }, []);

  async function addProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || !name.trim()) return;

    setSaving(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("professionals")
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
        })
        .select("id, name, email, phone, active")
        .single();

      if (error) throw error;
      setProfessionals((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setName("");
      setPhone("");
      setEmail("");
      setNotice("Profissional salvo com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o profissional.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProfessional(professional: Professional) {
    const supabase = createClient();
    setNotice("");
    const { data, error } = await supabase
      .from("professionals")
      .update({ active: !professional.active })
      .eq("id", professional.id)
      .eq("organization_id", organizationId)
      .select("id, name, email, phone, active")
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }
    setProfessionals((current) => current.map((item) => item.id === data.id ? data : item));
    setNotice(data.active ? "Profissional ativado." : "Profissional desativado.");
  }

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    padding: 20,
  };
  const field: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 14,
    color: "#182230",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#182230", fontFamily: "Arial, sans-serif", padding: "28px clamp(16px, 4vw, 40px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/painel" style={{ color: "#3159a5", textDecoration: "none", fontSize: 14 }}>← Voltar ao painel</Link>
        <header style={{ margin: "22px 0 24px" }}>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 6px" }}>DMRJ SCHEDULING</p>
          <h1 style={{ margin: 0, fontSize: 28 }}>Profissionais</h1>
          <p style={{ color: "#667085", marginTop: 8 }}>Cadastre e gerencie os profissionais da sua empresa.</p>
        </header>

        {notice && <p role="status" style={{ background: "#eef4ff", color: "#244a86", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}

        <form onSubmit={addProfessional} style={{ ...card, display: "grid", gap: 14, marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Adicionar profissional</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Nome completo
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={160} placeholder="Nome do profissional" style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Telefone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} placeholder="(00) 00000-0000" style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>E-mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} placeholder="profissional@email.com" style={field} />
            </label>
          </div>
          <div>
            <button type="submit" disabled={saving || loading || !organizationId} style={{ border: 0, borderRadius: 9, padding: "11px 16px", background: saving ? "#8798bb" : "#243b70", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Salvando..." : "Salvar profissional"}
            </button>
          </div>
        </form>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Profissionais cadastrados</h2>
            <button type="button" onClick={() => void loadProfessionals()} disabled={loading} style={{ border: "1px solid #d0d5dd", borderRadius: 8, background: "#ffffff", padding: "8px 12px", color: "#344054", cursor: "pointer" }}>Atualizar</button>
          </div>
          {loading ? <p style={{ color: "#667085" }}>Carregando profissionais...</p> : professionals.length === 0 ? (
            <p style={{ color: "#667085", textAlign: "center", padding: 24 }}>Ainda não há profissionais cadastrados. Use o formulário acima para adicionar o primeiro.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {professionals.map((professional) => (
                <article key={professional.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 10, padding: 13 }}>
                  <div>
                    <strong style={{ display: "block", fontSize: 14 }}>{professional.name}</strong>
                    <span style={{ color: "#667085", fontSize: 13 }}>{[professional.phone, professional.email].filter(Boolean).join(" · ") || "Sem telefone ou e-mail informado"}</span>
                    <span style={{ display: "block", color: professional.active ? "#187245" : "#9a5b00", fontSize: 12, marginTop: 4 }}>{professional.active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <button type="button" onClick={() => void toggleProfessional(professional)} style={{ border: "1px solid #d0d5dd", borderRadius: 8, background: "#ffffff", padding: "8px 12px", color: "#344054", cursor: "pointer" }}>{professional.active ? "Desativar" : "Ativar"}</button>
                </article>
              ))}
            </div>
          )}
        </section>
        <p style={{ color: "#98a2b3", fontSize: 12, textAlign: "center", marginTop: 18 }}>Os dados são salvos no Supabase e protegidos pelo acesso da organização.</p>
      </div>
    </main>
  );
}
