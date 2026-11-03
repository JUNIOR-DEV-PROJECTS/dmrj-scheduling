"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type Professional = { id: string; name: string; active: boolean };
type BusinessHour = { id: string; weekday: number; opens_at: string; closes_at: string; active: boolean };
type ProfessionalHour = { id: string; professional_id: string; weekday: number; starts_at: string; ends_at: string; active: boolean };
type ScheduleBlock = { id: string; professional_id: string | null; starts_at: string; ends_at: string; reason: string | null };
type ScheduleHoliday = { id: string; professional_id: string | null; holiday_date: string; name: string };
type Tab = "empresa" | "profissionais" | "bloqueios" | "feriados";
const week = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function timeOnly(value: string) { return value.slice(0, 5); }
function dateTimeLabel(value: string) { return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }

export default function HorariosPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [professionalHours, setProfessionalHours] = useState<ProfessionalHour[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [holidays, setHolidays] = useState<ScheduleHoliday[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("empresa");
  const [holidayProfessional, setHolidayProfessional] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [businessDay, setBusinessDay] = useState("1");
  const [businessOpen, setBusinessOpen] = useState("08:00");
  const [businessClose, setBusinessClose] = useState("12:00");
  const [professionalId, setProfessionalId] = useState("");
  const [professionalDay, setProfessionalDay] = useState("1");
  const [professionalStart, setProfessionalStart] = useState("08:00");
  const [professionalEnd, setProfessionalEnd] = useState("12:00");
  const [blockProfessional, setBlockProfessional] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadAll() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Sua sessão não foi encontrada. Entre novamente.");
      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members").select("organization_id")
        .eq("user_id", userData.user.id).eq("status", "active").limit(1);
      if (membershipError) throw membershipError;
      const orgId = memberships?.[0]?.organization_id;
      if (!orgId) throw new Error("Não encontramos uma empresa ativa vinculada a esta conta.");
      setOrganizationId(orgId);
      const [p, b, ph, sb, sh] = await Promise.all([
        supabase.from("professionals").select("id, name, active").eq("organization_id", orgId).order("name"),
        supabase.from("business_hours").select("id, weekday, opens_at, closes_at, active").eq("organization_id", orgId).order("weekday").order("opens_at"),
        supabase.from("professional_hours").select("id, professional_id, weekday, starts_at, ends_at, active").eq("organization_id", orgId).order("weekday").order("starts_at"),
        supabase.from("schedule_blocks").select("id, professional_id, starts_at, ends_at, reason").eq("organization_id", orgId).order("starts_at", { ascending: true }),
        supabase.from("schedule_holidays").select("id, professional_id, holiday_date, name").eq("organization_id", orgId).order("holiday_date", { ascending: true }),
      ]);
      if (p.error) throw p.error;
      if (b.error) throw b.error;
      if (ph.error) throw ph.error;
      if (sb.error) throw sb.error;
      if (sh.error) throw sh.error;
      setProfessionals(p.data ?? []);
      setBusinessHours(b.data ?? []);
      setProfessionalHours(ph.data ?? []);
      setBlocks(sb.data ?? []);
      setHolidays(sh.data ?? []);
      if (!professionalId && p.data?.length) setProfessionalId(p.data[0].id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar os horários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  async function addBusinessHour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || businessClose <= businessOpen) { setNotice("O horário de encerramento precisa ser depois da abertura."); return; }
    setSaving(true); setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("business_hours").insert({
        organization_id: organizationId, weekday: Number(businessDay),
        opens_at: businessOpen, closes_at: businessClose, active: true,
      });
      if (error) throw error;
      setNotice("Intervalo da empresa salvo.");
      await loadAll();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar o expediente."); }
    finally { setSaving(false); }
  }

  async function addProfessionalHour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || !professionalId) { setNotice("Cadastre ou selecione um profissional primeiro."); return; }
    if (professionalEnd <= professionalStart) { setNotice("O fim da jornada precisa ser depois do início."); return; }
    setSaving(true); setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("professional_hours").insert({
        organization_id: organizationId, professional_id: professionalId,
        weekday: Number(professionalDay), starts_at: professionalStart, ends_at: professionalEnd, active: true,
      });
      if (error) throw error;
      setNotice("Jornada do profissional salva.");
      await loadAll();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar a jornada."); }
    finally { setSaving(false); }
  }

  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || !blockStart || !blockEnd || new Date(blockEnd) <= new Date(blockStart)) {
      setNotice("Informe um período válido para o bloqueio."); return;
    }
    setSaving(true); setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("schedule_blocks").insert({
        organization_id: organizationId,
        professional_id: blockProfessional || null,
        starts_at: new Date(blockStart).toISOString(),
        ends_at: new Date(blockEnd).toISOString(),
        reason: blockReason.trim() || null,
      });
      if (error) throw error;
      setBlockStart(""); setBlockEnd(""); setBlockReason("");
      setNotice("Bloqueio salvo com sucesso.");
      await loadAll();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar o bloqueio."); }
    finally { setSaving(false); }
  }

  async function addHoliday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || !holidayDate || !holidayName.trim()) {
      setNotice("Informe a data e o nome do feriado ou fechamento."); return;
    }
    setSaving(true); setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("schedule_holidays").insert({
        organization_id: organizationId,
        professional_id: holidayProfessional || null,
        holiday_date: holidayDate,
        name: holidayName.trim(),
      });
      if (error) throw error;
      setHolidayDate(""); setHolidayName("");
      setNotice("Data especial cadastrada com sucesso.");
      await loadAll();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar a data especial."); }
    finally { setSaving(false); }
  }

  async function removeRecord(table: "business_hours" | "professional_hours" | "schedule_blocks" | "schedule_holidays", id: string) {
    if (!organizationId) return;
    setNotice("");
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id).eq("organization_id", organizationId);
    if (error) { setNotice(error.message); return; }
    setNotice("Registro removido.");
    await loadAll();
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, padding: 20, marginBottom: 18 };
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d0d5dd", borderRadius: 8, padding: "11px 12px", fontSize: 14, color: "#182230", background: "#fff" };
  const primary: React.CSSProperties = { border: 0, borderRadius: 9, padding: "11px 16px", background: "#243b70", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" };
  const secondary: React.CSSProperties = { border: "1px solid #d0d5dd", borderRadius: 8, padding: "7px 10px", background: "#fff", color: "#344054", cursor: "pointer" };
  const labelStyle: React.CSSProperties = { display: "grid", gap: 6, fontSize: 13, color: "#344054" };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#182230", fontFamily: "Arial, sans-serif", padding: "28px clamp(16px, 4vw, 40px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/painel" style={{ color: "#3159a5", textDecoration: "none", fontSize: 14 }}>← Voltar ao painel</Link>
        <header style={{ margin: "22px 0 24px" }}>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 6px" }}>DMRJ SCHEDULING</p>
          <h1 style={{ margin: 0, fontSize: 28 }}>Horários e disponibilidade</h1>
          <p style={{ color: "#667085", marginTop: 8 }}>Configure o expediente da empresa, a jornada de cada profissional e os períodos indisponíveis.</p>
        </header>
        <div role="tablist" aria-label="Configurações de horários" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 18 }}>
          {([
            ["empresa", "Empresa"],
            ["profissionais", "Profissionais"],
            ["bloqueios", "Bloqueios"],
            ["feriados", "Feriados"],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
              style={{ border: activeTab === tab ? "1px solid #243b70" : "1px solid #d0d5dd", borderRadius: 10, padding: "12px 8px", background: activeTab === tab ? "#243b70" : "#fff", color: activeTab === tab ? "#fff" : "#344054", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
        {notice && <p role="status" style={{ background: "#eef4ff", color: "#244a86", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}
        {activeTab === "empresa" && <section style={card}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Expediente da empresa</h2>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 16px" }}>Configure qualquer dia de domingo a sábado. Adicione mais de um intervalo no mesmo dia, por exemplo manhã e tarde. Não cadastre um dia fechado.</p>
          <form onSubmit={addBusinessHour} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12, alignItems: "end" }}>
            <label style={labelStyle}>Dia da semana<select value={businessDay} onChange={e => setBusinessDay(e.target.value)} style={field}>{week.map((day, i) => <option key={i} value={i}>{day}</option>)}</select></label>
            <label style={labelStyle}>Abre às<input type="time" value={businessOpen} onChange={e => setBusinessOpen(e.target.value)} required style={field} /></label>
            <label style={labelStyle}>Fecha às<input type="time" value={businessClose} onChange={e => setBusinessClose(e.target.value)} required style={field} /></label>
            <button type="submit" disabled={saving || loading || !organizationId} style={primary}>{saving ? "Salvando..." : "Adicionar intervalo"}</button>
          </form>
          <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
            {businessHours.length === 0 ? <p style={{ color: "#667085", fontSize: 13 }}>Nenhum expediente cadastrado ainda.</p> : businessHours.map(item => <article key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 10, padding: 11 }}><span style={{ fontSize: 14 }}><strong>{week[item.weekday]}</strong> · {timeOnly(item.opens_at)} às {timeOnly(item.closes_at)}</span><button type="button" onClick={() => void removeRecord("business_hours", item.id)} style={secondary}>Remover</button></article>)}
          </div>
        </section>}

        {activeTab === "profissionais" && <section style={card}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Jornada dos profissionais</h2>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 16px" }}>Cada profissional pode ter horários diferentes e mais de um intervalo por dia.</p>
          {professionals.length === 0 ? <p style={{ color: "#9a5b00", fontSize: 14 }}>Cadastre primeiro um profissional na página Profissionais.</p> : <>
            <form onSubmit={addProfessionalHour} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12, alignItems: "end" }}>
              <label style={labelStyle}>Profissional<select value={professionalId} onChange={e => setProfessionalId(e.target.value)} style={field}>{professionals.map(p => <option key={p.id} value={p.id}>{p.name}{p.active ? "" : " (inativo)"}</option>)}</select></label>
              <label style={labelStyle}>Dia da semana<select value={professionalDay} onChange={e => setProfessionalDay(e.target.value)} style={field}>{week.map((day, i) => <option key={i} value={i}>{day}</option>)}</select></label>
              <label style={labelStyle}>Início<input type="time" value={professionalStart} onChange={e => setProfessionalStart(e.target.value)} required style={field} /></label>
              <label style={labelStyle}>Fim<input type="time" value={professionalEnd} onChange={e => setProfessionalEnd(e.target.value)} required style={field} /></label>
              <button type="submit" disabled={saving || loading} style={primary}>{saving ? "Salvando..." : "Adicionar jornada"}</button>
            </form>
            <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
              {professionalHours.length === 0 ? <p style={{ color: "#667085", fontSize: 13 }}>Nenhuma jornada individual cadastrada.</p> : professionalHours.map(item => <article key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 10, padding: 11 }}><span style={{ fontSize: 14 }}><strong>{professionals.find(p => p.id === item.professional_id)?.name ?? "Profissional"}</strong> · {week[item.weekday]} · {timeOnly(item.starts_at)} às {timeOnly(item.ends_at)}</span><button type="button" onClick={() => void removeRecord("professional_hours", item.id)} style={secondary}>Remover</button></article>)}
            </div>
          </>}
        </section>}

        {activeTab === "bloqueios" && <section style={card}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Bloqueios, folgas e indisponibilidades</h2>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 16px" }}>Bloqueie um período para toda a empresa ou somente para um profissional.</p>
          <form onSubmit={addBlock} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
            <label style={labelStyle}>Aplicar a<select value={blockProfessional} onChange={e => setBlockProfessional(e.target.value)} style={field}><option value="">Toda a empresa</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label style={labelStyle}>Começa<input type="datetime-local" value={blockStart} onChange={e => setBlockStart(e.target.value)} required style={field} /></label>
            <label style={labelStyle}>Termina<input type="datetime-local" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} required style={field} /></label>
            <label style={labelStyle}>Motivo (opcional)<input value={blockReason} onChange={e => setBlockReason(e.target.value)} maxLength={200} placeholder="Ex.: folga, almoço, compromisso" style={field} /></label>
            <button type="submit" disabled={saving || loading || !organizationId} style={primary}>{saving ? "Salvando..." : "Salvar bloqueio"}</button>
          </form>
          <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
            {blocks.length === 0 ? <p style={{ color: "#667085", fontSize: 13 }}>Nenhum bloqueio cadastrado.</p> : blocks.map(item => <article key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 10, padding: 11 }}><span style={{ fontSize: 13 }}><strong>{item.professional_id ? professionals.find(p => p.id === item.professional_id)?.name ?? "Profissional" : "Toda a empresa"}</strong> · {dateTimeLabel(item.starts_at)} até {dateTimeLabel(item.ends_at)}{item.reason ? " · " + item.reason : ""}</span><button type="button" onClick={() => void removeRecord("schedule_blocks", item.id)} style={secondary}>Remover</button></article>)}
          </div>
        </section>}

        {activeTab === "feriados" && <section style={card}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Feriados e datas especiais</h2>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 16px" }}>Marque um feriado ou uma data em que não haverá atendimento. Escolha toda a empresa ou somente um profissional. A data ficará registrada como indisponível para a agenda.</p>
          <form onSubmit={addHoliday} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, alignItems: "end" }}>
            <label style={labelStyle}>Aplicar a<select value={holidayProfessional} onChange={e => setHolidayProfessional(e.target.value)} style={field}><option value="">Toda a empresa</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label style={labelStyle}>Data<input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} required style={field} /></label>
            <label style={labelStyle}>Nome do feriado ou motivo<input value={holidayName} onChange={e => setHolidayName(e.target.value)} maxLength={120} required placeholder="Ex.: Natal, feriado municipal" style={field} /></label>
            <button type="submit" disabled={saving || loading || !organizationId} style={primary}>{saving ? "Salvando..." : "Adicionar data"}</button>
          </form>
          <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
            {holidays.length === 0 ? <p style={{ color: "#667085", fontSize: 13 }}>Nenhuma data especial cadastrada.</p> : holidays.map(item => <article key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 10, padding: 11 }}><span style={{ fontSize: 14 }}><strong>{new Date(item.holiday_date + "T12:00:00").toLocaleDateString("pt-BR")}</strong> · {item.name} · {item.professional_id ? professionals.find(p => p.id === item.professional_id)?.name ?? "Profissional" : "Toda a empresa"}</span><button type="button" onClick={() => void removeRecord("schedule_holidays", item.id)} style={secondary}>Remover</button></article>)}
          </div>
        </section>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#98a2b3", fontSize: 12 }}>Dados salvos no Supabase e isolados por empresa com RLS.</span>
          <button type="button" onClick={() => void loadAll()} disabled={loading} style={secondary}>Atualizar horários</button>
        </div>
      </div>
    </main>
  );
}
