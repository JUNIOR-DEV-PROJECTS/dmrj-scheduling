"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type ClientRecord = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadClients() {
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
        .from("clients")
        .select("id, name, phone, email, created_at")
        .eq("organization_id", currentOrganizationId)
        .order("name", { ascending: true });

      if (error) throw error;
      setClients(data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || !name.trim()) return;

    setSaving(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
        })
        .select("id, name, phone, email, created_at")
        .single();

      if (error) throw error;
      setClients((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setName("");
      setPhone("");
      setEmail("");
      setNotice("Cliente salvo com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
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
          <h1 style={{ margin: 0, fontSize: 28 }}>Clientes</h1>
          <p style={{ color: "#667085", marginTop: 8 }}>Cadastre e consulte os clientes reais da sua empresa.</p>
        </header>

        {notice && <p role="status" style={{ background: "#eef4ff", color: "#244a86", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}

        <form onSubmit={addClient} style={{ ...card, display: "grid", gap: 14, marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Adicionar cliente</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Nome completo
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={160} placeholder="Nome do cliente" style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Telefone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} placeholder="(00) 00000-0000" style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>E-mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} placeholder="cliente@email.com" style={field} />
            </label>
          </div>
          <div>
            <button type="submit" disabled={saving || loading || !organizationId} style={{ border: 0, borderRadius: 9, padding: "11px 16px", background: saving ? "#8798bb" : "#243b70", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </form>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Clientes cadastrados</h2>
            <button type="button" onClick={() => void loadClients()} disabled={loading} style={{ border: "1px solid #d0d5dd", borderRadius: 8, background: "#ffffff", padding: "8px 12px", color: "#344054", cursor: "pointer" }}>Atualizar</button>
          </div>
          {loading ? <p style={{ color: "#667085" }}>Carregando clientes...</p> : clients.length === 0 ? (
            <p style={{ color: "#667085", textAlign: "center", padding: 24 }}>Ainda não há clientes cadastrados. Use o formulário acima para adicionar o primeiro.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {clients.map((client) => (
                <article key={client.id} style={{ border: "1px solid #edf0f5", borderRadius: 10, padding: 13 }}>
                  <strong style={{ display: "block", fontSize: 14 }}>{client.name}</strong>
                  <span style={{ color: "#667085", fontSize: 13 }}>{[client.phone, client.email].filter(Boolean).join(" · ") || "Sem telefone ou e-mail informado"}</span>
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
