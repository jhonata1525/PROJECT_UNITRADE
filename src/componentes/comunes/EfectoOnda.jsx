import React, { useEffect } from "react";

/**
 * @file EfectoOnda.jsx
 * Efecto ripple (onda) global al hacer clic/touch en elementos interactivos.
 * Usa event delegation en document para capturar clicks en cualquier botón, enlace o elemento interactivo.
 */

export const useRippleEffect = () => {
  useEffect(() => {
    const handlePointerDown = (e) => {
      // Buscar el elemento interactivo más cercano
      const target = e.target.closest(
        'button:not([disabled]), a[href], [role="button"], .ripple-target, .card-hover, .btn-primary, .btn-secondary, [data-ripple], .interactive-card'
      );
      if (!target) return;

      // No aplicar ripple en inputs, selects, textareas
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;

      const ripple = document.createElement("span");
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.className = "ripple-effect";
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        position: absolute;
        pointer-events: none;
        z-index: 9999;
      `;

      // Asegurar position relative en el target
      const computedStyle = window.getComputedStyle(target);
      const hadPosition = computedStyle.position !== "static";
      if (!hadPosition) {
        target.style.position = "relative";
      }
      target.style.overflow = "hidden";
      target.appendChild(ripple);

      // Cleanup
      const cleanup = () => {
        ripple.remove();
        if (!hadPosition) {
          target.style.position = "";
        }
      };
      ripple.addEventListener("animationend", cleanup, { once: true });
      // Fallback cleanup
      setTimeout(cleanup, 600);
    };

    // Capturar en fase de captura para interceptar antes que otros handlers
    document.addEventListener("pointerdown", handlePointerDown, { passive: true, capture: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
  }, []);
};

export const EfectoOnda = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>;
};

export default EfectoOnda;