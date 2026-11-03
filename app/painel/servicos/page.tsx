"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("0,00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadServices() {
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
        .from("services")
        .select("id, name, description, duration_minutes, price, active")
        .eq("organization_id", currentOrganizationId)
        .order("name", { ascending: true });

      if (error) throw error;
      setServices((data ?? []) as Service[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = Number(price.trim().replace(/\./g, "").replace(",", "."));
    const parsedDuration = Number(duration);
    if (!organizationId || !name.trim()) return;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setNotice("Informe um preço válido. Exemplo: 50,00.");
      return;
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration < 5 || parsedDuration > 1440) {
      setNotice("A duração deve ser de 5 a 1440 minutos.");
      return;
    }

    setSaving(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          description: description.trim() || null,
          duration_minutes: parsedDuration,
          price: parsedPrice,
        })
        .select("id, name, description, duration_minutes, price, active")
        .single();

      if (error) throw error;
      setServices((current) => [...current, data as Service].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setName("");
      setDescription("");
      setDuration("30");
      setPrice("0,00");
      setNotice("Serviço salvo com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleService(service: Service) {
    const supabase = createClient();
    setNotice("");
    const { data, error } = await supabase
      .from("services")
      .update({ active: !service.active })
      .eq("id", service.id)
      .eq("organization_id", organizationId)
      .select("id, name, description, duration_minutes, price, active")
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }
    setServices((current) => current.map((item) => item.id === data.id ? data as Service : item));
    setNotice(data.active ? "Serviço ativado." : "Serviço desativado.");
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
  const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#182230", fontFamily: "Arial, sans-serif", padding: "28px clamp(16px, 4vw, 40px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/painel" style={{ color: "#3159a5", textDecoration: "none", fontSize: 14 }}>← Voltar ao painel</Link>
        <header style={{ margin: "22px 0 24px" }}>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 6px" }}>DMRJ SCHEDULING</p>
          <h1 style={{ margin: 0, fontSize: 28 }}>Serviços</h1>
          <p style={{ color: "#667085", marginTop: 8 }}>Cadastre os serviços, valores e duração dos atendimentos.</p>
        </header>

        {notice && <p role="status" style={{ background: "#eef4ff", color: "#244a86", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}

        <form onSubmit={addService} style={{ ...card, display: "grid", gap: 14, marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Adicionar serviço</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Nome do serviço
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={160} placeholder="Ex.: Corte de cabelo" style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Duração em minutos
              <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} required min={5} max={1440} step={5} style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Preço em reais
              <input value={price} onChange={(event) => setPrice(event.target.value)} required maxLength={20} inputMode="decimal" placeholder="Ex.: 50,00" style={field} />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Descrição (opcional)
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={3} placeholder="Detalhes sobre o serviço" style={{ ...field, resize: "vertical" }} />
          </label>
          <div>
            <button type="submit" disabled={saving || loading || !organizationId} style={{ border: 0, borderRadius: 9, padding: "11px 16px", background: saving ? "#8798bb" : "#243b70", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Salvando..." : "Salvar serviço"}
            </button>
          </div>
        </form>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Serviços cadastrados</h2>
            <button type="button" onClick={() => void loadServices()} disabled={loading} style={{ border: "1px solid #d0d5dd", borderRadius: 8, background: "#ffffff", padding: "8px 12px", color: "#344054", cursor: "pointer" }}>Atualizar</button>
          </div>
          {loading ? <p style={{ color: "#667085" }}>Carregando serviços...</p> : services.length === 0 ? (
            <p style={{ color: "#667085", textAlign: "center", padding: 24 }}>Ainda não há serviços cadastrados. Use o formulário acima para adicionar o primeiro.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {services.map((service) => (
                <article key={service.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 10, padding: 13 }}>
                  <div>
                    <strong style={{ display: "block", fontSize: 14 }}>{service.name}</strong>
                    {service.description && <span style={{ display: "block", color: "#667085", fontSize: 13, marginTop: 3 }}>{service.description}</span>}
                    <span style={{ display: "block", color: "#475467", fontSize: 13, marginTop: 5 }}>{service.duration_minutes} min · {money(service.price)}</span>
                    <span style={{ display: "block", color: service.active ? "#187245" : "#9a5b00", fontSize: 12, marginTop: 4 }}>{service.active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <button type="button" onClick={() => void toggleService(service)} style={{ border: "1px solid #d0d5dd", borderRadius: 8, background: "#ffffff", padding: "8px 12px", color: "#344054", cursor: "pointer" }}>{service.active ? "Desativar" : "Ativar"}</button>
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
