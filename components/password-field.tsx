"use client";

import { useId, useState, type CSSProperties, type ChangeEventHandler } from "react";

export type PasswordVisibilityCopy = {
  show: string;
  hide: string;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete: string;
  visibility: PasswordVisibilityCopy;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  help?: string;
  labelStyle?: CSSProperties;
  inputStyle?: CSSProperties;
};

const wrapStyle: CSSProperties = {
  position: "relative",
  marginTop: 6,
};

const toggleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 44,
  minHeight: 44,
  padding: "0 12px",
  border: 0,
  background: "transparent",
  color: "#123c59",
  cursor: "pointer",
};

const eyeSvgProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: false as const,
};

function EyeOpenIcon() {
  return (
    <svg {...eyeSvgProps}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...eyeSvgProps}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2.75 2.75 0 0 0 13.4 13.4" />
      <path d="M7.1 7.3C4.7 8.7 3 12 3 12s3.5 6.5 9.5 6.5a9.7 9.7 0 0 0 4.4-1" />
      <path d="M16.9 15.2C19 13.9 21 12 21 12s-3.5-6.5-9.5-6.5a9.8 9.8 0 0 0-2.4.3" />
    </svg>
  );
}

/**
 * Password input with a show/hide toggle. Passwords stay hidden by default.
 * Does not alter authentication behavior — only the input type for display.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  visibility,
  required = true,
  minLength,
  maxLength,
  help,
  labelStyle,
  inputStyle,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const helpId = useId();
  const describedBy = help ? helpId : undefined;
  const inputPadding = {
    ...inputStyle,
    paddingRight: 48,
    marginTop: 0,
  };

  return (
    <>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <div style={wrapStyle}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          aria-describedby={describedBy}
          spellCheck={false}
          style={inputPadding}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? visibility.hide : visibility.show}
          aria-controls={id}
          style={toggleStyle}
        >
          {visible ? <EyeOffIcon /> : <EyeOpenIcon />}
        </button>
      </div>
      {help ? (
        <p id={helpId} style={{ margin: "8px 0 0", color: "#536b7c", lineHeight: 1.5 }}>{help}</p>
      ) : null}
    </>
  );
}
