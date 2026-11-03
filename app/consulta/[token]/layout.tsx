import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consulta privada de agendamento | DMRJ Scheduling",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function PrivateAppointmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
