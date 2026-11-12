/**
 * @file FondoDecorativo.jsx
 * Capa de íconos flotantes de color detrás del contenido.
 *
 * Cada ícono vive en una capa que recorre buena parte de la pantalla
 * (`--dx` / `--dy`) mientras el ícono interno hace un vaivén suave. Es
 * puramente decorativa: no recibe clics y se oculta en móvil para no competir
 * con las tarjetas. Para ajustar la intensidad, cambia el alfa de `color`.
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
  {
    Icon: BookOpen,
    color: "rgba(129, 140, 248, 0.28)",
    pos: { left: "5%", top: "14%" },
    size: "h-20 w-20",
    dx: "16vw",
    dy: "24vh",
    dur: "26s",
    delay: "0s",
    floatDur: "8s",
  },
  {
    Icon: Calculator,
    color: "rgba(56, 189, 248, 0.24)",
    pos: { right: "7%", top: "18%" },
    size: "h-24 w-24",
    dx: "-18vw",
    dy: "22vh",
    dur: "22s",
    delay: "-4s",
    floatDur: "9s",
  },
  {
    Icon: Camera,
    color: "rgba(167, 139, 250, 0.24)",
    pos: { left: "12%", bottom: "14%" },
    size: "h-16 w-16",
    dx: "14vw",
    dy: "-24vh",
    dur: "24s",
    delay: "-8s",
    floatDur: "7s",
  },
  {
    Icon: Dumbbell,
    color: "rgba(244, 114, 182, 0.22)",
    pos: { right: "9%", bottom: "12%" },
    size: "h-20 w-20",
    dx: "-16vw",
    dy: "-26vh",
    dur: "28s",
    delay: "-2s",
    floatDur: "10s",
  },
  {
    Icon: Headphones,
    color: "rgba(52, 211, 153, 0.20)",
    pos: { left: "30%", top: "6%" },
    size: "h-12 w-12",
    dx: "20vw",
    dy: "34vh",
    dur: "20s",
    delay: "-6s",
    floatDur: "6.5s",
  },
  {
    Icon: Laptop,
    color: "rgba(251, 191, 36, 0.18)",
    pos: { right: "24%", bottom: "6%" },
    size: "h-14 w-14",
    dx: "-22vw",
    dy: "-30vh",
    dur: "30s",
    delay: "-10s",
    floatDur: "9.5s",
  },
  {
    Icon: FlaskConical,
    color: "rgba(34, 211, 238, 0.22)",
    pos: { right: "4%", top: "52%" },
    size: "h-16 w-16",
    dx: "-12vw",
    dy: "-34vh",
    dur: "23s",
    delay: "-3s",
    floatDur: "7.5s",
  },
  {
    Icon: Bike,
    color: "rgba(251, 146, 60, 0.20)",
    pos: { left: "4%", bottom: "44%" },
    size: "h-14 w-14",
    dx: "18vw",
    dy: "-26vh",
    dur: "27s",
    delay: "-7s",
    floatDur: "8.5s",
  },
];

export const FondoDecorativo = () => (
  <div
    className="pointer-events-none fixed inset-0 hidden overflow-hidden md:block"
    style={{ zIndex: -1 }}
    aria-hidden="true"
  >
    {ICONOS.map(
      (
        { Icon, color, pos, size, dx, dy, dur, delay, floatDur },
        indice,
      ) => (
        <span
          key={`${size}-${indice}`}
          className="animate-drift absolute"
          style={{
            ...pos,
            color,
            "--dx": dx,
            "--dy": dy,
            "--dur": dur,
            "--delay": delay,
          }}
        >
          <Icon
            className={`animate-float-slow ${size}`}
            style={{
              "--float-dur": floatDur,
              "--delay": delay,
              filter: "drop-shadow(0 0 18px currentColor)",
            }}
            strokeWidth={1.4}
          />
        </span>
      ),
    )}
  </div>
);

export default FondoDecorativo;
