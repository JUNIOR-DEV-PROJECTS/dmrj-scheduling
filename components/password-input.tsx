"use client";

import { useState } from "react";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
};

/**
 * Campo reutilizável de senha.
 * A senha começa oculta e pode ser exibida somente por ação explícita
 * da pessoa que está preenchendo o formulário.
 */
export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  required = true,
  placeholder = "Digite sua senha",
  name = "password",
  disabled = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ display: "grid", gap: 6, width: "100%" }}>
      <label htmlFor={id} style={{ color: "#344054", fontSize: 14, fontWeight: 600 }}>
        {label}
      </label>

      <div style={{ position: "relative", width: "100%" }}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid #d0d5dd",
            borderRadius: 9,
            padding: "11px 46px 11px 12px",
            minHeight: 44,
            color: "#182230",
            background: disabled ? "#f2f4f7" : "#ffffff",
            fontSize: 15,
            outlineOffset: 2,
          }}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-controls={id}
          aria-pressed={visible}
          title={visible ? "Ocultar senha" : "Mostrar senha"}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: 44,
            display: "grid",
            placeItems: "center",
            border: 0,
            borderRadius: 8,
            background: "transparent",
            color: "#667085",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A11.2 11.2 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.3 3.1" />
              <path d="M6.2 6.2C4.1 7.5 2.8 9.5 2.5 12c.7 2.1 4.2 7 9.5 7 1.3 0 2.5-.3 3.5-.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
              <circle cx="12" cy="12" r="2.7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
