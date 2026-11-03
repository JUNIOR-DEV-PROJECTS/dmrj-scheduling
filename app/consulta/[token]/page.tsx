"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type AppointmentView = {
  business_name: string;
  client_name: string;
  service_name: string;
  professional_name: string;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
};

const statusLabels: Record<AppointmentView["status"], string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default function PrivateAppointmentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [appointment, setAppointment] = useState<AppointmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadAppointment() {
      setLoading(true);
      setNotice("");
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_public_appointment", {
          p_token: token,
        });
        if (error) throw error;
        if (!data) throw new Error("Este link não foi encontrado ou não está mais disponível.");
        if (!cancelled) setAppointment(data as AppointmentView);
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "Não foi possível consultar este agendamento.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token) void loadAppointment();
    return () => { cancelled = true; };
  }, [token]);

  const dateLabel = (value: string) => new Date(value).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fb", color: "#172033", fontFamily: "Arial, sans-serif", padding: "36px 16px" }}>
      <section style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "#304b91", fontWeight: 800, letterSpacing: ".04em", fontSize: 13 }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: "#304b91", color: "#fff" }}>D</span>
            DMRJ SCHEDULING
          </div>
          <p style={{ color: "#667085", fontSize: 13, margin: "13px 0 0" }}>Consulta privada de agendamento</p>
        </header>

        <div style={{ background: "#fff", border: "1px solid #e7eaf1", borderRadius: 20, padding: "clamp(22px, 5vw, 34px)", boxShadow: "0 16px 50px rgba(28, 43, 78, .07)" }}>
          {loading ? (
            <p style={{ color: "#667085", textAlign: "center", padding: 28 }}>Consultando agendamento...</p>
          ) : notice ? (
            <div role="alert" style={{ textAlign: "center", padding: 18 }}>
              <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>Link indisponível</h1>
              <p style={{ color: "#667085", lineHeight: 1.6, margin: 0 }}>{notice}</p>
            </div>
          ) : appointment ? (
            <>
              <p style={{ color: "#667085", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", margin: "0 0 8px" }}>AGENDAMENTO</p>
              <h1 style={{ fontSize: 25, lineHeight: 1.25, margin: "0 0 8px" }}>{appointment.business_name}</h1>
              <p style={{ color: "#667085", margin: "0 0 22px" }}>Olá, {appointment.client_name}. Confira os dados do seu atendimento.</p>
              <div style={{ display: "grid", gap: 15 }}>
                <div style={{ border: "1px solid #e7eaf1", borderRadius: 12, padding: 15 }}>
                  <span style={{ display: "block", color: "#667085", fontSize: 12, marginBottom: 5 }}>Serviço</span>
                  <strong>{appointment.service_name}</strong>
                </div>
                <div style={{ border: "1px solid #e7eaf1", borderRadius: 12, padding: 15 }}>
                  <span style={{ display: "block", color: "#667085", fontSize: 12, marginBottom: 5 }}>Profissional</span>
                  <strong>{appointment.professional_name}</strong>
                </div>
                <div style={{ border: "1px solid #e7eaf1", borderRadius: 12, padding: 15 }}>
                  <span style={{ display: "block", color: "#667085", fontSize: 12, marginBottom: 5 }}>Data e horário</span>
                  <strong style={{ textTransform: "capitalize" }}>{dateLabel(appointment.starts_at)}</strong>
                  <span style={{ display: "block", color: "#667085", fontSize: 13, marginTop: 5 }}>Término: {new Date(appointment.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ background: "#f3f6fc", borderRadius: 12, padding: 15 }}>
                  <span style={{ display: "block", color: "#667085", fontSize: 12, marginBottom: 5 }}>Situação</span>
                  <strong style={{ color: appointment.status === "confirmed" ? "#187245" : appointment.status === "cancelled" ? "#b42318" : "#344b7a" }}>{statusLabels[appointment.status]}</strong>
                </div>
              </div>
              <p style={{ color: "#98a2b3", fontSize: 12, lineHeight: 1.5, margin: "20px 0 0" }}>Este link é individual. Não compartilhe com outras pessoas.</p>
            </>
          ) : null}
        </div>
        <p style={{ textAlign: "center", color: "#98a2b3", fontSize: 12, marginTop: 18 }}>Consulta privada por DMRJ Scheduling</p>
      </section>
    </main>
  );
}
