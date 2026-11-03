"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
};
type Professional = { id: string; name: string };
type PublicData = {
  business: { name: string; slug: string };
  timezone: string;
  services: Service[];
  professionals: Professional[];
};
type Slot = { slot_time: string };

function todayLocal() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedService = useMemo(
    () => publicData?.services.find((item) => item.id === serviceId),
    [publicData, serviceId]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadPublicData() {
      setLoading(true);
      setNotice("");
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_public_booking_data", {
          p_slug: slug,
        });
        if (error) throw error;
        if (!data) throw new Error("Esta página de agendamento não está disponível.");
        const parsed = data as PublicData;
        if (!cancelled) {
          setPublicData(parsed);
          setServiceId(parsed.services?.[0]?.id ?? "");
          setProfessionalId(parsed.professionals?.[0]?.id ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "Não foi possível carregar esta empresa.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (slug) void loadPublicData();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!slug || !serviceId || !professionalId || !date || success) {
      setSlots([]);
      setTime("");
      return;
    }
    let cancelled = false;
    async function loadSlots() {
      setSlotsLoading(true);
      setNotice("");
      setSlots([]);
      setTime("");
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_public_available_slots", {
          p_slug: slug,
          p_service_id: serviceId,
          p_professional_id: professionalId,
          p_date: date,
        });
        if (error) throw error;
        const available = ((data ?? []) as Slot[]).map((item) => item.slot_time);
        if (!cancelled) {
          setSlots(available);
          setTime(available[0] ?? "");
          if (!available.length) setNotice("Não há horários disponíveis nesta data. Escolha outro dia.");
        }
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Não foi possível consultar os horários.");
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }
    void loadSlots();
    return () => { cancelled = true; };
  }, [slug, serviceId, professionalId, date, success]);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceId || !professionalId || !date || !time) {
      setNotice("Escolha o serviço, profissional, data e horário.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_public_booking", {
        p_slug: slug,
        p_service_id: serviceId,
        p_professional_id: professionalId,
        p_date: date,
        p_time: time,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_email: email.trim(),
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível enviar sua solicitação. Tente outro horário.");
      const supabase = createClient();
      const { data } = await supabase.rpc("get_public_available_slots", {
        p_slug: slug,
        p_service_id: serviceId,
        p_professional_id: professionalId,
        p_date: date,
      });
      const refreshed = ((data ?? []) as Slot[]).map((item) => item.slot_time);
      setSlots(refreshed);
      setTime(refreshed.includes(time) ? time : refreshed[0] ?? "");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d8deea",
    borderRadius: 11,
    padding: "13px 14px",
    fontSize: 15,
    color: "#172033",
    background: "#fff",
    outlineColor: "#3857a6",
  };
  const labelStyle: React.CSSProperties = {
    display: "grid",
    gap: 7,
    color: "#344054",
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f4f7ff 0%, #ffffff 420px)", color: "#172033", fontFamily: "Arial, sans-serif", padding: "34px 16px" }}>
      <section style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "#304b91", fontWeight: 800, letterSpacing: ".04em", fontSize: 13 }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: "#304b91", color: "#fff" }}>D</span>
            DMRJ SCHEDULING
          </div>
          <p style={{ color: "#667085", fontSize: 13, margin: "13px 0 0" }}>Agendamento online</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e7eaf1", borderRadius: 20, padding: "clamp(20px, 5vw, 32px)", boxShadow: "0 16px 50px rgba(28, 43, 78, .08)" }}>
          {loading ? (
            <p style={{ color: "#667085", textAlign: "center", padding: 30 }}>Carregando agendamento...</p>
          ) : success ? (
            <div style={{ textAlign: "center", padding: "18px 4px" }}>
              <div style={{ width: 58, height: 58, margin: "0 auto 18px", borderRadius: 30, background: "#e9f7ef", color: "#167447", display: "grid", placeItems: "center", fontSize: 28 }}>✓</div>
              <h1 style={{ fontSize: 25, margin: "0 0 10px" }}>Solicitação enviada!</h1>
              <p style={{ color: "#667085", lineHeight: 1.6, margin: 0 }}>Sua solicitação foi registrada para {publicData?.business.name}. A empresa poderá confirmar o atendimento.</p>
              <p style={{ color: "#667085", fontSize: 13, marginTop: 18 }}>Você pode fechar esta página.</p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 26, margin: "0 0 7px", letterSpacing: "-.03em" }}>{publicData?.business.name ?? "Agendar atendimento"}</h1>
              <p style={{ color: "#667085", margin: "0 0 24px", lineHeight: 1.5 }}>Escolha o serviço, o profissional e um horário disponível.</p>

              {notice && <p role="status" style={{ background: "#fff4e8", color: "#8a4b10", borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.5 }}>{notice}</p>}

              {publicData && publicData.services.length > 0 && publicData.professionals.length > 0 ? (
                <form onSubmit={submitBooking} style={{ display: "grid", gap: 16 }}>
                  <label style={labelStyle}>Serviço
                    <select required value={serviceId} onChange={(event) => setServiceId(event.target.value)} style={inputStyle}>
                      {publicData.services.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} · {item.duration_minutes} min · {Number(item.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</option>
                      ))}
                    </select>
                    {selectedService?.description && <span style={{ color: "#667085", fontWeight: 400, lineHeight: 1.4 }}>{selectedService.description}</span>}
                  </label>

                  <label style={labelStyle}>Profissional
                    <select required value={professionalId} onChange={(event) => setProfessionalId(event.target.value)} style={inputStyle}>
                      {publicData.professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={labelStyle}>Data
                      <input type="date" min={todayLocal()} required value={date} onChange={(event) => setDate(event.target.value)} style={inputStyle} />
                    </label>
                    <label style={labelStyle}>Horário
                      <select required disabled={slotsLoading || slots.length === 0} value={time} onChange={(event) => setTime(event.target.value)} style={inputStyle}>
                        <option value="">{slotsLoading ? "Consultando..." : "Selecione"}</option>
                        {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                    </label>
                  </div>

                  <div style={{ height: 1, background: "#edf0f5", margin: "2px 0" }} />
                  <h2 style={{ fontSize: 17, margin: 0 }}>Seus dados</h2>

                  <label style={labelStyle}>Nome completo
                    <input required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Como podemos chamar você?" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>Telefone com DDD
                    <input required minLength={8} maxLength={30} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>E-mail
                    <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" style={inputStyle} />
                  </label>

                  <button type="submit" disabled={saving || slotsLoading || !time} style={{ border: 0, borderRadius: 11, padding: "15px 18px", background: saving || slotsLoading || !time ? "#9aa8c7" : "#304b91", color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving || slotsLoading || !time ? "not-allowed" : "pointer", marginTop: 4 }}>
                    {saving ? "Enviando solicitação..." : "Solicitar agendamento"}
                  </button>
                  <p style={{ color: "#98a2b3", fontSize: 11, lineHeight: 1.5, textAlign: "center", margin: "0 8px" }}>Ao enviar, você concorda em compartilhar seus dados com esta empresa para organizar o atendimento.</p>
                </form>
              ) : (
                <p style={{ color: "#667085", lineHeight: 1.6 }}>Esta empresa ainda não cadastrou serviços e profissionais disponíveis para agendamento.</p>
              )}
            </>
          )}
        </div>
        <p style={{ textAlign: "center", color: "#98a2b3", fontSize: 12, marginTop: 18 }}>Agendamento online por DMRJ Scheduling</p>
      </section>
    </main>
  );
}
