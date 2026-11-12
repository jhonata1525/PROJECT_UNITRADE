/**
 * @file FondoDecorativo.jsx
 * Capa de íconos flotantes muy sutiles detrás del contenido.
 *
 * Es puramente decorativa: no recibe clics y se oculta en móvil para no
 * competir con las tarjetas. Para ajustar la intensidad, cambia la opacidad
 * de `color` o las posiciones de `ICONOS`.
 */

import {
  Bike,
  BookOpen,
  Calculator,
  Camera,
  Dumbbell,
  FlaskConical,
  Headphones,
  Laptop,
} from "lucide-react";

const ICONOS = [
  { Icon: BookOpen, clase: "left-[6%] top-[16%] h-20 w-20", delay: "0s" },
  { Icon: Calculator, clase: "right-[8%] top-[22%] h-24 w-24", delay: "-4s" },
  { Icon: Camera, clase: "left-[14%] bottom-[16%] h-16 w-16", delay: "-8s" },
  { Icon: Dumbbell, clase: "right-[12%] bottom-[12%] h-20 w-20", delay: "-2s" },
  { Icon: Headphones, clase: "left-[28%] top-[8%] h-12 w-12", delay: "-6s" },
  { Icon: Laptop, clase: "right-[26%] bottom-[6%] h-14 w-14", delay: "-10s" },
  { Icon: FlaskConical, clase: "right-[4%] top-[58%] h-16 w-16", delay: "-3s" },
  { Icon: Bike, clase: "left-[4%] bottom-[46%] h-14 w-14", delay: "-7s" },
];

export const FondoDecorativo = () => (
  <div
    className="pointer-events-none fixed inset-0 hidden overflow-hidden md:block"
    style={{ zIndex: -1 }}
    aria-hidden="true"
  >
    {ICONOS.map(({ Icon, clase, delay }, indice) => (
      <Icon
        key={`${clase}-${indice}`}
        className={`absolute animate-float-slow ${clase}`}
        style={{ color: "rgba(255, 255, 255, 0.04)", animationDelay: delay }}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

export default FondoDecorativo;
