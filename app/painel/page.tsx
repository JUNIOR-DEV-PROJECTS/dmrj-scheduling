"use client";

import { FormEvent, useMemo, useState } from "react";

type Appointment = {
  id: number;
  client: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  status: "Confirmado" | "Aguardando";
};

const initialAppointments: Appointment[] = [
  { id: 1, client: "Mariana Costa", service: "Atendimento inicial", professional: "Ana", date: "2026-11-02", time: "09:00", status: "Confirmado" },
  { id: 2, client: "Rafael Lima", service: "Sessão de serviço", professional: "Bruno", date: "2026-11-02", time: "10:30", status: "Aguardando" },
  { id: 3, client: "Camila Souza", service: "Atendimento", professional: "Ana", date: "2026-11-03", time: "14:00", status: "Confirmado" },
  { id: 4, client: "Pedro Alves", service: "Consulta", professional: "Carla", date: "2026-11-04", time: "11:00", status: "Confirmado" },
];

const professionals = ["Todos", "Ana", "Bruno", "Carla"];
const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PainelPage() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [view, setView] = useState<"Dia" | "Semana" | "Mês">("Semana");
  const [mode, setMode] = useState<"Simples" | "Avançado">("Simples");
  const [professional, setProfessional] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("2026-11-02");
  const [showForm, setShowForm] = useState(false);
  const [client, setClient] = useState("");
  const [service, setService] = useState("");
  const [newProfessional, setNewProfessional] = useState("Ana");
  const [time, setTime] = useState("15:00");
  const [notice, setNotice] = useState("");

  const visibleAppointments = useMemo(() => {
    return appointments
      .filter((item) => professional === "Todos" || item.professional === professional)
      .filter((item) => view !== "Dia" || item.date === selectedDate)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [appointments, professional, selectedDate, view]);

  const changeDate = (amount: number) => {
    const next = new Date(selectedDate + "T12:00:00");
    next.setDate(next.getDate() + amount);
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  function addAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client.trim() || !service.trim()) return;
    setAppointments((current) => [
      ...current,
      {
        id: Date.now(),
        client: client.trim(),
        service: service.trim(),
        professional: newProfessional,
        date: selectedDate,
        time,
        status: "Aguardando",
      },
    ]);
    setClient("");
    setService("");
    setShowForm(false);
    setNotice("Agendamento demonstrativo adicionado à agenda.");
  }

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    padding: 20,
  };
  const button = (active = false): React.CSSProperties => ({
    border: active ? "1px solid #243b70" : "1px solid #e1e5ed",
    background: active ? "#243b70" : "#ffffff",
    color: active ? "#ffffff" : "#344054",
    borderRadius: 9,
    padding: "9px 13px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#182230", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", minHeight: "100vh", flexWrap: "wrap" }}>
        <aside style={{ width: 220, background: "#172746", color: "#ffffff", padding: 22, boxSizing: "border-box" }}>
          <a href="/" style={{ color: "#ffffff", textDecoration: "none", fontSize: 19, fontWeight: 700 }}>
            DMRJ <span style={{ color: "#a9c4ff" }}>Scheduling</span>
          </a>
          <p style={{ color: "#b8c4d8", fontSize: 12, marginTop: 8 }}>PAINEL DA EMPRESA</p>
          <nav style={{ display: "grid", gap: 7, marginTop: 34 }}>
            {["Agenda", "Agendamentos", "Clientes", "Profissionais", "Serviços", "Configurações"].map((item, index) => (
              <a key={item} href={index === 0 ? "#agenda" : "#em-breve"} onClick={index === 0 ? undefined : (event) => { event.preventDefault(); setNotice(item + ": esta área será construída nas próximas etapas."); }} style={{ color: index === 0 ? "#172746" : "#dce5f5", background: index === 0 ? "#ffffff" : "transparent", borderRadius: 9, padding: "11px 12px", textDecoration: "none", fontSize: 14 }}>
                {item}
              </a>
            ))}
          </nav>
          <div style={{ marginTop: 42, borderTop: "1px solid #344563", paddingTop: 16, color: "#b8c4d8", fontSize: 12, lineHeight: 1.6 }}>
            Prévia de desenvolvimento<br />Dados de exemplo
          </div>
        </aside>

        <section style={{ flex: 1, minWidth: 280, padding: "28px clamp(16px, 3vw, 36px)", boxSizing: "border-box" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 26 }}>
            <div>
              <p style={{ color: "#667085", fontSize: 13, margin: "0 0 6px" }}>VISÃO GERAL</p>
              <h1 style={{ margin: 0, fontSize: 27 }}>Agenda</h1>
              <p style={{ color: "#667085", margin: "7px 0 0", fontSize: 14 }}>Organize os horários e acompanhe os atendimentos.</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#667085", fontSize: 13 }}>Modo</span>
              <button style={button(mode === "Simples")} onClick={() => setMode("Simples")}>Simples</button>
              <button style={button(mode === "Avançado")} onClick={() => setMode("Avançado")}>Avançado</button>
              <button style={{ ...button(true), background: "#3159a5" }} onClick={() => { setShowForm(true); setNotice(""); }}>+ Novo agendamento</button>
            </div>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
            {[
              ["Agendamentos", String(appointments.length)],
              ["Confirmados", String(appointments.filter((item) => item.status === "Confirmado").length)],
              ["Aguardando", String(appointments.filter((item) => item.status === "Aguardando").length)],
            ].map(([label, value]) => (
              <div key={label} style={card}>
                <p style={{ margin: 0, color: "#667085", fontSize: 13 }}>{label}</p>
                <strong style={{ display: "block", fontSize: 27, marginTop: 8 }}>{value}</strong>
              </div>
            ))}
          </div>

          {notice && <p role="status" style={{ background: "#eef4ff", color: "#244a86", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}

          {showForm && (
            <form onSubmit={addAppointment} style={{ ...card, marginBottom: 18, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>Novo agendamento de exemplo</h2>
                <button type="button" style={button()} onClick={() => setShowForm(false)}>Fechar</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Nome do cliente<input required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome completo" style={inputStyle} /></label>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Serviço<input required value={service} onChange={(e) => setService(e.target.value)} placeholder="Ex.: Consulta" style={inputStyle} /></label>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Profissional<select value={newProfessional} onChange={(e) => setNewProfessional(e.target.value)} style={inputStyle}>{professionals.slice(1).map((name) => <option key={name}>{name}</option>)}</select></label>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Data<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required style={inputStyle} /></label>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Horário<input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle} /></label>
              </div>
              <p style={{ color: "#8a4b10", fontSize: 12, margin: 0 }}>Demonstração: ainda não verifica conflitos nem salva no banco de dados.</p>
              <div><button type="submit" style={button(true)}>Adicionar à demonstração</button></div>
            </form>
          )}

          <section id="agenda" style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>Seus horários</h2>
                <p style={{ color: "#667085", fontSize: 13, margin: "5px 0 0" }}>{dateLabel(selectedDate)}</p>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {(["Dia", "Semana", "Mês"] as const).map((item) => <button key={item} style={button(view === item)} onClick={() => setView(item)}>{item}</button>)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={button()} onClick={() => changeDate(view === "Mês" ? -30 : view === "Semana" ? -7 : -1)}>←</button>
                <button style={button()} onClick={() => setSelectedDate("2026-11-02")}>Data de referência</button>
                <button style={button()} onClick={() => changeDate(view === "Mês" ? 30 : view === "Semana" ? 7 : 1)}>→</button>
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#475467" }}>
                Profissional
                <select value={professional} onChange={(e) => setProfessional(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  {professionals.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
            </div>

            {view === "Semana" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5, marginBottom: 18 }}>
                {days.map((day, index) => {
                  const d = new Date(selectedDate + "T12:00:00");
                  d.setDate(d.getDate() - d.getDay() + index);
                  const key = d.toISOString().slice(0, 10);
                  const count = appointments.filter((a) => a.date === key && (professional === "Todos" || a.professional === professional)).length;
                  return <button key={day} onClick={() => { setSelectedDate(key); setView("Dia"); }} style={{ ...button(key === selectedDate), padding: "10px 3px", minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 11 }}>{day}</span>
                    <strong style={{ display: "block", marginTop: 5 }}>{d.getDate()}</strong>
                    <span style={{ display: "block", fontSize: 10, marginTop: 4 }}>{count} reserva(s)</span>
                  </button>;
                })}
              </div>
            )}

            {view === "Mês" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5, marginBottom: 18 }}>
                {Array.from({ length: 35 }, (_, index) => {
                  const d = new Date(selectedDate + "T12:00:00");
                  d.setDate(1);
                  d.setDate(d.getDate() - d.getDay() + index);
                  const key = d.toISOString().slice(0, 10);
                  const count = appointments.filter((a) => a.date === key && (professional === "Todos" || a.professional === professional)).length;
                  return <button key={key} onClick={() => { setSelectedDate(key); setView("Dia"); }} style={{ ...button(key === selectedDate), minHeight: 54, padding: 5, opacity: d.getMonth() === new Date(selectedDate + "T12:00:00").getMonth() ? 1 : 0.45 }}>
                    <strong>{d.getDate()}</strong><span style={{ display: "block", fontSize: 10 }}>{count ? count + " reserva(s)" : " "}</span>
                  </button>;
                })}
              </div>
            )}

            <div style={{ display: "grid", gap: 9 }}>
              {visibleAppointments.length === 0 ? (
                <p style={{ color: "#667085", textAlign: "center", padding: 24 }}>Nenhum agendamento nesta seleção.</p>
              ) : visibleAppointments.map((item) => (
                <article key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", border: "1px solid #edf0f5", borderRadius: 11, padding: 13 }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                    <strong style={{ color: "#3159a5", minWidth: 48 }}>{item.time}</strong>
                    <div><strong style={{ display: "block", fontSize: 14 }}>{item.client}</strong><span style={{ color: "#667085", fontSize: 12 }}>{item.service} · {item.professional} · {item.date.split("-").reverse().join("/")}</span></div>
                  </div>
                  <span style={{ borderRadius: 20, padding: "5px 10px", background: item.status === "Confirmado" ? "#e8f6ee" : "#fff4df", color: item.status === "Confirmado" ? "#187245" : "#9a5b00", fontSize: 12, fontWeight: 600 }}>{item.status}</span>
                </article>
              ))}
            </div>
            {mode === "Avançado" && <p style={{ margin: "16px 0 0", color: "#667085", fontSize: 12 }}>Modo Avançado: filtros e relatórios detalhados serão acrescentados em etapas futuras. As funções essenciais permanecem disponíveis no Modo Simples.</p>}
          </section>
          <p style={{ color: "#98a2b3", fontSize: 12, textAlign: "center", marginTop: 18 }}>DMRJ Scheduling · Painel em desenvolvimento · Informações demonstrativas</p>
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: 8,
  padding: "10px 11px",
  background: "#ffffff",
  color: "#182230",
  fontSize: 14,
};
