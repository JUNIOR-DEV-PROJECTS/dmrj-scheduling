"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type ClientRecord = { id: string; name: string };
type Professional = { id: string; name: string; active: boolean };
type Service = { id: string; name: string; duration_minutes: number; price: number; active: boolean };
type Appointment = {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
};

const statusLabels: Record<Appointment["status"], string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function localDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateTimeLabel(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientId, setClientId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(localDateValue);
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadData() {
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

      const currentOrganizationId = memberships?.[0]?.organization_id;
      if (!currentOrganizationId) throw new Error("Não encontramos uma empresa ativa vinculada a esta conta.");
      setOrganizationId(currentOrganizationId);

      const [clientsResult, professionalsResult, servicesResult, appointmentsResult] = await Promise.all([
        supabase.from("clients").select("id, name").eq("organization_id", currentOrganizationId).order("name"),
        supabase.from("professionals").select("id, name, active").eq("organization_id", currentOrganizationId).order("name"),
        supabase.from("services").select("id, name, duration_minutes, price, active").eq("organization_id", currentOrganizationId).order("name"),
        supabase.from("appointments").select("id, client_id, professional_id, service_id, starts_at, ends_at, status, notes").eq("organization_id", currentOrganizationId).order("starts_at", { ascending: false }).limit(100),
      ]);
      if (clientsResult.error) throw clientsResult.error;
      if (professionalsResult.error) throw professionalsResult.error;
      if (servicesResult.error) throw servicesResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;

      setClients(clientsResult.data ?? []);
      setProfessionals(professionalsResult.data ?? []);
      setServices(servicesResult.data ?? []);
      setAppointments((appointmentsResult.data ?? []) as Appointment[]);
      setClientId((current) => current || clientsResult.data?.[0]?.id || "");
      setProfessionalId((current) => current || professionalsResult.data?.find((item) => item.active)?.id || "");
      setServiceId((current) => current || servicesResult.data?.find((item) => item.active)?.id || "");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedService = services.find((item) => item.id === serviceId);
    if (!organizationId || !clientId || !professionalId || !selectedService) {
      setNotice("Cadastre pelo menos um cliente, um profissional ativo e um serviço ativo antes de agendar.");
      return;
    }

    const start = new Date(`${date}T${time}:00`);
    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      setNotice("Escolha uma data e um horário futuros.");
      return;
    }
    const end = new Date(start.getTime() + selectedService.duration_minutes * 60_000);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    setSaving(true);
    setNotice("");
    try {
      const supabase = createClient();
      const weekday = new Date(date + "T12:00:00").getDay();
      const startMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
      const endMinutes = startMinutes + selectedService.duration_minutes;
      const minutesOfTime = (value: string) => {
        const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
        return hours * 60 + minutes;
      };

      const [businessHoursResult, professionalHoursResult, holidayResult, blockResult] = await Promise.all([
        supabase.from("business_hours").select("opens_at, closes_at").eq("organization_id", organizationId).eq("weekday", weekday).eq("active", true),
        supabase.from("professional_hours").select("starts_at, ends_at").eq("organization_id", organizationId).eq("professional_id", professionalId).eq("weekday", weekday).eq("active", true),
        supabase.from("schedule_holidays").select("id, name").eq("organization_id", organizationId).eq("holiday_date", date).or("professional_id.is.null,professional_id.eq." + professionalId).limit(1),
        supabase.from("schedule_blocks").select("id, reason").eq("organization_id", organizationId).lt("starts_at", endIso).gt("ends_at", startIso).or("professional_id.is.null,professional_id.eq." + professionalId).limit(1),
      ]);

      if (businessHoursResult.error) throw businessHoursResult.error;
      if (professionalHoursResult.error) throw professionalHoursResult.error;
      if (holidayResult.error) throw holidayResult.error;
      if (blockResult.error) throw blockResult.error;

      const withinBusinessHours = (businessHoursResult.data ?? []).some((interval) => startMinutes >= minutesOfTime(interval.opens_at) && endMinutes <= minutesOfTime(interval.closes_at));
      if (!withinBusinessHours) {
        setNotice("Esse horário está fora do expediente da empresa ou o expediente desse dia ainda não foi cadastrado.");
        return;
      }

      const withinProfessionalHours = (professionalHoursResult.data ?? []).some((interval) => startMinutes >= minutesOfTime(interval.starts_at) && endMinutes <= minutesOfTime(interval.ends_at));
      if (!withinProfessionalHours) {
        setNotice("Esse profissional não tem jornada cadastrada que cubra todo o serviço nesse horário.");
        return;
      }

      if (holidayResult.data && holidayResult.data.length > 0) {
        setNotice("Não é possível agendar: " + holidayResult.data[0].name + ".");
        return;
      }

      if (blockResult.data && blockResult.data.length > 0) {
        const reason = blockResult.data[0].reason;
        setNotice(reason ? "Esse horário está bloqueado: " + reason + "." : "Esse horário está bloqueado para atendimento.");
        return;
      }

      const { data: conflicts, error: conflictError } = await supabase
        .from("appointments")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("professional_id", professionalId)
        .neq("status", "cancelled")
        .lt("starts_at", endIso)
        .gt("ends_at", startIso)
        .limit(1);
      if (conflictError) throw conflictError;
      if (conflicts && conflicts.length > 0) {
        setNotice("Esse profissional já tem um atendimento nesse horário. Escolha outro horário.");
        return;
      }

      const { data, error } = await supabase.from("appointments").insert({
        organization_id: organizationId,
        client_id: clientId,
        professional_id: professionalId,
        service_id: serviceId,
        starts_at: startIso,
        ends_at: endIso,
        status: "pending",
        notes: notes.trim() || null,
      }).select("id, client_id, professional_id, service_id, starts_at, ends_at, status, notes").single();
      if (error) throw error;
      setAppointments((current) => [data as Appointment, ...current]);
      setNotes("");
      setNotice("Agendamento salvo com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o agendamento.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(appointment: Appointment, status: Appointment["status"]) {
    const supabase = createClient();
    setNotice("");
    const { data, error } = await supabase.from("appointments")
      .update({ status })
      .eq("id", appointment.id)
      .eq("organization_id", organizationId)
      .select("id, client_id, professional_id, service_id, starts_at, ends_at, status, notes")
      .single();
    if (error) {
      setNotice(error.message);
      return;
    }
    setAppointments((current) => current.map((item) => item.id === data.id ? data as Appointment : item));
    setNotice("Status atualizado.");
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, padding: 20 };
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d0d5dd", borderRadius: 8, padding: "11px 12px", fontSize: 14, color: "#182230" };
  const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const filteredAppointments = appointments.filter((item) => statusFilter === "all" || item.status === statusFilter);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#182230", fontFamily: "Arial, sans-serif", padding: "28px clamp(16px, 4vw, 40px)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/painel" style={{ color: "#3159a5", textDecoration: "none", fontSize: 14 }}>← Voltar ao painel</Link>
        <header style={{ margin: "22px 0 24px" }}>
          <p style={{ color: "#667085", fontSize: 13, margin: "0 0 6px" }}>DMRJ SCHEDULING</p>
          <h1 style={{ margin: 0, fontSize: 28 }}>Agendamentos</h1>
          <p style={{ color: "#667085", marginTop: 8 }}>Crie reservas com os clientes, profissionais e serviços cadastrados.</p>
        </header>

        {notice && <p role="status" style={{ background: "#eef4ff", color: "#244a86", borderRadius: 10, padding: 12, fontSize: 14 }}>{notice}</p>}

        <form onSubmit={createAppointment} style={{ ...card, display: "grid", gap: 14, marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Novo agendamento</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Cliente
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)} style={field}>
                <option value="">Selecione um cliente</option>
                {clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Profissional
              <select required value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} style={field}>
                <option value="">Selecione um profissional</option>
                {professionals.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Serviço
              <select required value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={field}>
                <option value="">Selecione um serviço</option>
                {services.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.duration_minutes} min · {money(item.price)}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Data
              <input type="date" required min={localDateValue()} value={date} onChange={(e) => setDate(e.target.value)} style={field} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Horário
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} style={field} />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Observações (opcional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} placeholder="Informações adicionais" style={{ ...field, resize: "vertical" }} />
          </label>
          <div>
            <button type="submit" disabled={saving || loading || !clients.length || !professionals.length || !services.length} style={{ border: 0, borderRadius: 9, padding: "11px 16px", background: saving ? "#8798bb" : "#243b70", color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Salvando..." : "Salvar agendamento"}
            </button>
          </div>
          {(!loading && (!clients.length || !professionals.length || !services.length)) && <p style={{ color: "#8a4b10", fontSize: 13, margin: 0 }}>Para agendar, é necessário ter pelo menos um cliente, um profissional ativo e um serviço ativo cadastrados.</p>}
        </form>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Reservas registradas</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select aria-label="Filtrar por status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...field, width: "auto" }}>
                <option value="all">Todos os status</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <button type="button" onClick={() => void loadData()} disabled={loading} style={{ border: "1px solid #d0d5dd", borderRadius: 8, background: "#fff", padding: "8px 12px", color: "#344054", cursor: "pointer" }}>Atualizar</button>
            </div>
          </div>
          {loading ? <p style={{ color: "#667085" }}>Carregando agendamentos...</p> : filteredAppointments.length === 0 ? (
            <p style={{ color: "#667085", textAlign: "center", padding: 24 }}>Nenhum agendamento encontrado.</p>
          ) : (
            <div style={{ display: "grid", gap: 9 }}>
              {filteredAppointments.map((item) => {
                const client = clients.find((entry) => entry.id === item.client_id);
                const professional = professionals.find((entry) => entry.id === item.professional_id);
                const service = services.find((entry) => entry.id === item.service_id);
                return <article key={item.id} style={{ border: "1px solid #edf0f5", borderRadius: 10, padding: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: 14 }}>{client?.name ?? "Cliente"}</strong>
                    <span style={{ display: "block", color: "#667085", fontSize: 13, marginTop: 3 }}>{service?.name ?? "Serviço"} · {professional?.name ?? "Profissional"}</span>
                    <span style={{ display: "block", color: "#475467", fontSize: 13, marginTop: 4 }}>{dateTimeLabel(item.starts_at)} até {new Date(item.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {item.notes && <span style={{ display: "block", color: "#667085", fontSize: 12, marginTop: 4 }}>{item.notes}</span>}
                  </div>
                  <div style={{ display: "grid", gap: 6, minWidth: 155 }}>
                    <strong style={{ fontSize: 12, color: item.status === "confirmed" ? "#187245" : item.status === "cancelled" ? "#b42318" : "#8a5a00" }}>{statusLabels[item.status]}</strong>
                    <select aria-label="Alterar status" value={item.status} onChange={(e) => void changeStatus(item, e.target.value as Appointment["status"])} style={field}>
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>
        <p style={{ color: "#98a2b3", fontSize: 12, textAlign: "center", marginTop: 18 }}>Os agendamentos são salvos no Supabase e isolados por empresa.</p>
      </div>
    </main>
  );
}
