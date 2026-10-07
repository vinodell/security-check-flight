import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import type { CheckInData } from "../domain/types";

type FormFieldProps = {
  name: keyof CheckInData;
  label: string;
  value: string;
  onChange: (name: keyof CheckInData, value: string) => void;
  error?: string;
  hint?: string;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "placeholder" | "autoComplete" | "inputMode" | "maxLength"
>;

export default function FormField({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  ...inputProps
}: FormFieldProps) {
  const descriptionId = error || hint ? `${name}-description` : undefined;

  return (
    <div className={`form-field ${error ? "form-field--invalid" : ""}`}>
      <label htmlFor={name}>{label}</label>
      <input
        {...inputProps}
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        required
      />
      {error ? (
        <p className="field-error" id={descriptionId}>
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={descriptionId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
