"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

type AppointmentRow = {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
};

type CalendarAppointment = AppointmentRow & {
  clientName: string;
  professionalName: string;
  serviceName: string;
};

type Person = { id: string; name: string };

const statusLabels: Record<AppointmentRow["status"], string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function shiftDate(value: string, amount: number) {
  const date = new Date(value + "T12:00:00");
  date.setDate(date.getDate() + amount);
  return localDateValue(date);
}

function statusStyle(status: AppointmentRow["status"]): React.CSSProperties {
  if (status === "confirmed" || status === "completed") {
    return { background: "#e8f6ee", color: "#187245" };
  }
  if (status === "cancelled" || status === "no_show") {
    return { background: "#fff0ef", color: "#b42318" };
  }
  return { background: "#fff4df", color: "#9a5b00" };
}

export default function PainelPage() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [professionals, setProfessionals] = useState<Person[]>([]);
  const [view, setView] = useState<"Dia" | "Semana" | "Mês">("Semana");
  const [professionalId, setProfessionalId] = useState("all");
  const [selectedDate, setSelectedDate] = useState(localDateValue());
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Sua sessão não foi encontrada. Entre novamente.");

      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userData.user.id)
        .eq("status", "active")
        .limit(1);
      if (membershipError) throw membershipError;

      const organizationId = memberships?.[0]?.organization_id;
      if (!organizationId) throw new Error("Não encontramos uma empresa ativa vinculada a esta conta.");

      const [appointmentsResult, clientsResult, professionalsResult, servicesResult] = await Promise.all([
        supabase.from("appointments")
          .select("id, client_id, professional_id, service_id, starts_at, ends_at, status, notes")
          .eq("organization_id", organizationId)
          .order("starts_at", { ascending: true })
          .limit(500),
        supabase.from("clients").select("id, name").eq("organization_id", organizationId),
        supabase.from("professionals").select("id, name").eq("organization_id", organizationId),
        supabase.from("services").select("id, name").eq("organization_id", organizationId),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (clientsResult.error) throw clientsResult.error;
      if (professionalsResult.error) throw professionalsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      const clients = new Map((clientsResult.data ?? []).map((item) => [item.id, item.name]));
      const professionalsMap = new Map((professionalsResult.data ?? []).map((item) => [item.id, item.name]));
      const services = new Map((servicesResult.data ?? []).map((item) => [item.id, item.name]));

      setProfessionals((professionalsResult.data ?? []).map((item) => ({ id: item.id, name: item.name })));
      setAppointments(((appointmentsResult.data ?? []) as AppointmentRow[]).map((item) => ({
        ...item,
        clientName: clients.get(item.client_id) ?? "Cliente",
        professionalName: professionalsMap.get(item.professional_id) ?? "Profissional",
        serviceName: services.get(item.service_id) ?? "Serviço",
      })));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDashboard(); }, []);

  function changeDate(amount: number) {
    setSelectedDate((current) => shiftDate(current, amount));
  }

  const filteredAppointments = useMemo(() => appointments.filter((item) =>
    professionalId === "all" || item.professional_id === professionalId
  ), [appointments, professionalId]);

  const todayAppointments = filteredAppointments.filter((item) => localDateValue(new Date(item.starts_at)) === localDateValue());
  const pendingCount = filteredAppointments.filter((item) => item.status === "pending").length;
  const confirmedCount = filteredAppointments.filter((item) => item.status === "confirmed").length;

  const weekDates = useMemo(() => {
    const date = new Date(selectedDate + "T12:00:00");
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + index);
      return localDateValue(day);
    });
  }, [selectedDate]);

  const monthDates = useMemo(() => {
    const first = new Date(selectedDate + "T12:00:00");
    first.setDate(1);
    first.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(first);
      day.setDate(first.getDate() + index);
      return localDateValue(day);
    });
  }, [selectedDate]);

  const visibleAppointments = filteredAppointments.filter((item) => {
    const date = localDateValue(new Date(item.starts_at));
    if (view === "Dia") return date === selectedDate;
    if (view === "Semana") return weekDates.includes(date);
    return date.startsWith(selectedDate.slice(0, 7));
  });

  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, padding: 18,
  };
  const button = (active = false): React.CSSProperties => ({
    border: active ? "1px solid #243b70" : "1px solid #e1e5ed",
    background: active ? "#243b70" : "#fff",
    color: active ? "#fff" : "#344054",
    borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
  });

  function appointmentCard(item: CalendarAppointment) {
    return (
      <article key={item.id} style={{ border: "1px solid #edf0f5", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <strong style={{ color: "#3159a5", minWidth: 48 }}>{new Date(item.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
          <div>
            <strong style={{ display: "block", fontSize: 14 }}>{item.clientName}</strong>
            <span style={{ color: "#667085", fontSize: 12 }}>{item.serviceName} · {item.professionalName}</span>
          </div>
        </div>
        <span style={{ ...statusStyle(item.status), borderRadius: 20, padding: "5px 9px", fontSize: 11, fontWeight: 600 }}>{statusLabels[item.status]}</span>
      </article>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#182230", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", minHeight: "100vh", flexWrap: "wrap" }}>
        <aside style={{ width: 220, background: "#172746", color: "#fff", padding: 22, boxSizing: "border-box" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 19, fontWeight: 700 }}>DMRJ <span style={{ color: "#a9c4ff" }}>Scheduling</span></Link>
          <p style={{ color: "#b8c4d8", fontSize: 12, marginTop: 8 }}>PAINEL DA EMPRESA</p>
          <nav style={{ display: "grid", gap: 7, marginTop: 34 }}>
            {[
              ["Agenda", "/painel"],
              ["Agendamentos", "/painel/agendamentos"],
              ["Clientes", "/painel/clientes"],
              ["Profissionais", "/painel/profissionais"],
              ["Serviços", "/painel/servicos"],
              ["Horários", "/painel/horarios"],
            ].map(([label, href], index) => (
              <Link key={href} href={href} style={{ color: index === 0 ? "#172746" : "#dce5f5", background: index === 0 ? "#fff" : "transparent", borderRadius: 9, padding: "11px 12px", textDecoration: "none", fontSize: 14 }}>{label}</Link>
            ))}
          </nav>
          <div style={{ marginTop: 42, borderTop: "1px solid #344563", paddingTop: 16, color: "#b8c4d8", fontSize: 12 }}>Dados reais da sua empresa</div>
        </aside>

        <section style={{ flex: 1, minWidth: 280, padding: "28px clamp(16px, 3vw, 36px)", boxSizing: "border-box" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
            <div>
              <p style={{ color: "#667085", fontSize: 13, margin: "0 0 6px" }}>VISÃO GERAL</p>
              <h1 style={{ margin: 0, fontSize: 27 }}>Agenda</h1>
              <p style={{ color: "#667085", margin: "7px 0 0", fontSize: 14 }}>Acompanhe os horários cadastrados pela sua empresa.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={button()} onClick={() => void loadDashboard()} disabled={loading}>Atualizar</button>
              <Link href="/painel/agendamentos" style={{ ...button(true), textDecoration: "none", background: "#3159a5" }}>+ Novo agendamento</Link>
            </div>
          </header>

          {notice && <p role="alert" style={{ background: "#fff0ef", color: "#b42318", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
            {[
              ["Total de agendamentos", String(appointments.length)],
              ["Confirmados", String(confirmedCount)],
              ["Aguardando", String(pendingCount)],
              ["Hoje", String(todayAppointments.length)],
            ].map(([label, value]) => (
              <div key={label} style={card}>
                <p style={{ margin: 0, color: "#667085", fontSize: 13 }}>{label}</p>
                <strong style={{ display: "block", fontSize: 27, marginTop: 8 }}>{loading ? "…" : value}</strong>
              </div>
            ))}
          </div>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>Seus horários</h2>
                <p style={{ color: "#667085", fontSize: 13, margin: "5px 0 0" }}>{dateLabel(selectedDate)}</p>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {(["Dia", "Semana", "Mês"] as const).map((item) => <button key={item} type="button" style={button(view === item)} onClick={() => setView(item)}>{item}</button>)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" style={button()} onClick={() => changeDate(view === "Mês" ? -30 : view === "Semana" ? -7 : -1)}>←</button>
                <button type="button" style={button()} onClick={() => setSelectedDate(localDateValue())}>Hoje</button>
                <button type="button" style={button()} onClick={() => changeDate(view === "Mês" ? 30 : view === "Semana" ? 7 : 1)}>→</button>
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#475467" }}>
                Profissional
                <select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)} style={{ border: "1px solid #d0d5dd", borderRadius: 8, padding: "9px 10px", background: "#fff", color: "#182230" }}>
                  <option value="all">Todos</option>
                  {professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            </div>

            {view === "Semana" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5, marginBottom: 18 }}>
                {weekDates.map((date, index) => {
                  const count = filteredAppointments.filter((item) => localDateValue(new Date(item.starts_at)) === date).length;
                  return <button key={date} type="button" onClick={() => { setSelectedDate(date); setView("Dia"); }} style={{ ...button(date === selectedDate), padding: "9px 3px", minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 11 }}>{days[index]}</span>
                    <strong style={{ display: "block", marginTop: 5 }}>{new Date(date + "T12:00:00").getDate()}</strong>
                    <span style={{ display: "block", fontSize: 10, marginTop: 4 }}>{count} reserva(s)</span>
                  </button>;
                })}
              </div>
            )}

            {view === "Mês" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5, marginBottom: 18 }}>
                {days.map((day) => <strong key={day} style={{ textAlign: "center", fontSize: 11, color: "#667085", padding: 5 }}>{day}</strong>)}
                {monthDates.map((date) => {
                  const count = filteredAppointments.filter((item) => localDateValue(new Date(item.starts_at)) === date).length;
                  const sameMonth = date.slice(0, 7) === selectedDate.slice(0, 7);
                  return <button key={date} type="button" onClick={() => { setSelectedDate(date); setView("Dia"); }} style={{ ...button(date === selectedDate), minHeight: 52, padding: 4, opacity: sameMonth ? 1 : 0.4 }}>
                    <strong>{new Date(date + "T12:00:00").getDate()}</strong>
                    <span style={{ display: "block", fontSize: 10, marginTop: 3 }}>{count ? count + " reserva(s)" : " "}</span>
                  </button>;
                })}
              </div>
            )}

            {loading ? <p style={{ color: "#667085", textAlign: "center", padding: 22 }}>Carregando dados reais...</p> : visibleAppointments.length === 0 ? (
              <p style={{ color: "#667085", textAlign: "center", padding: 24 }}>Nenhum agendamento nesta seleção.</p>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {visibleAppointments.map(appointmentCard)}
              </div>
            )}
          </section>
          <p style={{ color: "#98a2b3", fontSize: 12, textAlign: "center", marginTop: 18 }}>DMRJ Scheduling · Agenda conectada ao Supabase</p>
        </section>
      </div>
    </main>
  );
}
