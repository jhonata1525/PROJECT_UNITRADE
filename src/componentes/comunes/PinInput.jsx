/**
 * @file PinInput.jsx
 * Componente accesible para entrada de PIN de 4 dígitos (estilo OTP).
 * - Auto-foco y navegación automática entre casillas
 * - Soporte para pegar (paste) el código completo
 * - Teclado numérico en móviles
 * - Accesible: aria-labels, role="group", navegación por teclado
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";

const PIN_LENGTH = 4;
const PIN_LABELS = ["Primer digito del PIN", "Segundo digito del PIN", "Tercer digito del PIN", "Cuarto digito del PIN"];

const PinInput = forwardRef(({ value = "", onChange, disabled = false, error, autoFocus = true }, ref) => {
  const inputsRef = useRef(Array.from({ length: PIN_LENGTH }, () => useRef(null))).current;
  const [values, setValues] = useState(value.split("").slice(0, PIN_LENGTH).concat(Array(PIN_LENGTH).fill("")));

  useEffect(() => {
    if (value) {
      const newValues = value.split("").slice(0, PIN_LENGTH).concat(Array(PIN_LENGTH).fill(""));
      setValues(newValues);
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    focus: () => inputsRef[0]?.current?.focus(),
    clear: () => {
      setValues(Array(PIN_LENGTH).fill(""));
      onChange("");
    },
  }));

  const handleChange = (index, e) => {
    const input = e.target.value.replace(/\D/g, "");
    if (input.length > 1) return;

    const newValues = [...values];
    newValues[index] = input;
    setValues(newValues);

    const finalValue = newValues.join("");
    onChange(finalValue);

    if (input && index < PIN_LENGTH - 1) {
      inputsRef[index + 1]?.current?.focus();
    } else if (!input && index > 0) {
      inputsRef[index - 1]?.current?.focus();
    }

    if (finalValue.length === PIN_LENGTH) {
      inputsRef[PIN_LENGTH - 1]?.current?.blur();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef[index - 1]?.current?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef[index - 1]?.current?.focus();
    }
    if (e.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      inputsRef[index + 1]?.current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (pasted.length === PIN_LENGTH) {
      const newValues = pasted.split("");
      setValues(newValues);
      onChange(pasted);
      inputsRef[PIN_LENGTH - 1]?.current?.blur();
    }
  };

  useEffect(() => {
    if (autoFocus && inputsRef[0]?.current) {
      inputsRef[0].current.focus();
    }
  }, [autoFocus]);

  const getInputClasses = (index) => {
    const base = "w-12 h-12 text-center text-2xl font-mono rounded-lg border-2 transition-all text-white bg-[var(--color-surface)]";
    if (disabled) return `${base} bg-[var(--color-canvas)] border-[var(--color-border)] text-gray-500 cursor-not-allowed`;
    if (error) return `${base} border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
    if (values[index]) return `${base} border-[var(--color-neon)] bg-[var(--color-neon)]/10 focus:border-[var(--color-neon)] focus:ring-2 focus:ring-[var(--color-neon)]/20`;
    return `${base} border-[var(--color-border)] focus:border-[var(--color-neon)] focus:ring-2 focus:ring-[var(--color-neon)]/20`;
  };

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Código PIN de 4 dígitos"
      aria-invalid={!!error}
      aria-describedby={error ? "pin-error" : undefined}
      onPaste={handlePaste}
    >
      {Array.from({ length: PIN_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={inputsRef[index]}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={values[index]}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          autoComplete="one-time-code"
          className={getInputClasses(index)}
          aria-label={PIN_LABELS[index]}
          aria-required="true"
        />
      ))}
      {error && (
        <p id="pin-error" className="text-xs text-red-400 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

PinInput.displayName = "PinInput";

export default PinInput;