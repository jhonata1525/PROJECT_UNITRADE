/**
 * @file PaginaDashboard.jsx
 * Página principal del dashboard de UniTrade con sidebar glassmorphism.
 * - Layout de dos columnas: sidebar fijo + contenido principal
 * - Tarjetas oscuras estilizadas con bordes sutiles y efectos hover
 * - Navegación funcional hacia /billetera, /pago, /mis-articulos
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import {
  obtenerBalance,
  mensajeErrorBilletera,
} from "../servicios/servicioBilletera";
import {
  listarMisArticulos,
  mensajeErrorArticulos,
} from "../servicios/servicioArticulos";
import { formatCurrency } from "../utils/formatters";
import {
  Wallet,
  CreditCard,
  Package,
  KeyRound,
  Compass,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";

const STAT_CARDS = [
  {
    title: "Saldo Disponible",
    icon: Wallet,
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/20",
    trend: "Saldo actual de tu billetera",
    trendColor: "text-emerald-400",
  },
  {
    title: "Artículos Publicados",
    icon: Package,
    color: "from-blue-500 to-cyan-500",
    bg: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-500/20",
    trend: "Productos que subiste para alquilar",
    trendColor: "text-blue-400",
  },
  {
    title: "Transacciones",
    value: "0",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
    bg: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-500/20",
    trend: "+8% vs mes anterior",
    trendColor: "text-purple-400",
  },
  {
    title: "Rating Promedio",
    value: "5.0",
    icon: Shield,
    color: "from-amber-500 to-orange-500",
    bg: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/20",
    trend: "Basado en 0 reseñas",
    trendColor: "text-amber-400",
  },
];

const QUICK_ACTIONS = [
  {
    path: "/catalogo",
    label: "Explorar Artículos",
    description: "Encuentra artículos disponibles de otros estudiantes",
    icon: Compass,
    color: "from-cyan-500 to-blue-500",
    hoverColor: "hover:border-cyan-500/50",
  },
  {
    path: "/billetera",
    label: "Billetera Virtual",
    description: "Administra ganancias, retiros y recargas",
    icon: Wallet,
    color: "from-emerald-500 to-teal-500",
    hoverColor: "hover:border-emerald-500/50",
  },
  {
    path: "/pago",
    label: "Pasarela de Pago",
    description: "Procesa pagos de reservas activas",
    icon: CreditCard,
    color: "from-blue-500 to-indigo-500",
    hoverColor: "hover:border-blue-500/50",
  },
  {
    path: "/mis-alquileres",
    label: "Mis Alquileres",
    description: "Consulta tus reservas y códigos de devolución",
    icon: KeyRound,
    color: "from-amber-500 to-orange-500",
    hoverColor: "hover:border-amber-500/50",
  },
  {
    path: "/mis-articulos",
    label: "Mis Artículos",
    description: "Publica y gestiona tus artículos en alquiler",
    icon: Package,
    color: "from-purple-500 to-pink-500",
    hoverColor: "hover:border-purple-500/50",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Pagos Instantáneos",
    description: "Procesamiento en tiempo real con confirmación inmediata",
  },
  {
    icon: Shield,
    title: "Seguridad Garantizada",
    description: "Transacciones protegidas con encriptación bancaria",
  },
  {
    icon: Users,
    title: "Comunidad Universitaria",
    description: "Conecta con estudiantes de @unisimon.edu.co",
  },
  {
    icon: Clock,
    title: "Disponibilidad 24/7",
    description: "Accede a tus alquileres y pagos en cualquier momento",
  },
];

export const PaginaDashboard = () => {
  const { usuario } = useAuth();
  const [resultadoSaldo, setResultadoSaldo] = React.useState(null);
  const [resultadoArticulos, setResultadoArticulos] = React.useState(null);
  const usuarioId = usuario?.id;

  React.useEffect(() => {
    if (!usuarioId) return undefined;

    let cancelado = false;

    obtenerBalance(usuarioId)
      .then((balance) => {
        if (!Number.isFinite(balance?.saldoDisponible)) {
          throw new Error("El servidor devolvió un saldo inválido.");
        }
        if (!cancelado) {
          setResultadoSaldo({
            usuarioId,
            valor: balance.saldoDisponible,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (!cancelado) {
          setResultadoSaldo({
            usuarioId,
            valor: null,
            error: mensajeErrorBilletera(error, "No se pudo cargar el saldo."),
          });
        }
      });

    listarMisArticulos(usuarioId)
      .then((articulos) => {
        if (!Array.isArray(articulos)) {
          throw new Error(
            "El servidor devolvió una lista de artículos inválida.",
          );
        }
        if (!cancelado) {
          setResultadoArticulos({
            usuarioId,
            valor: articulos.length,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (!cancelado) {
          setResultadoArticulos({
            usuarioId,
            valor: null,
            error: mensajeErrorArticulos(
              error,
              "No se pudo cargar la cantidad de artículos.",
            ),
          });
        }
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  const saldoActual =
    resultadoSaldo?.usuarioId === usuarioId ? resultadoSaldo : null;
  const articulosActuales =
    resultadoArticulos?.usuarioId === usuarioId ? resultadoArticulos : null;
  const valoresDinamicos = [
    saldoActual?.error || !usuarioId
      ? "No disponible"
      : saldoActual === null
        ? "Cargando..."
        : formatCurrency(saldoActual.valor),
    articulosActuales?.error || !usuarioId
      ? "No disponible"
      : articulosActuales === null
        ? "Cargando..."
        : String(articulosActuales.valor),
  ];
  const erroresDinamicos = [
    !usuarioId
      ? "No se pudo identificar al usuario."
      : saldoActual?.error || "",
    !usuarioId
      ? "No se pudo identificar al usuario."
      : articulosActuales?.error || "",
  ];

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-gray-100">
      <NavegacionLateral />

      <main className="transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container">
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
            <p className="text-gray-400 mt-1">
              Bienvenido,{" "}
              <span className="font-medium text-gradient">
                {usuario?.email?.split("@")[0] || "Usuario"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map((stat, index) => {
              const Icon = stat.icon;
              const valor =
                index < valoresDinamicos.length
                  ? valoresDinamicos[index]
                  : stat.value;
              const error = erroresDinamicos[index];
              return (
                <Link
                  key={stat.title}
                  to={
                    index === 0
                      ? "/billetera"
                      : index === 1
                        ? "/mis-articulos"
                        : "/pago"
                  }
                  className={`glass-card-hover p-5 group ${stat.border} ${stat.bg} ${stat.hoverColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {valor}
                      </p>
                      <p className={`text-xs mt-2 ${stat.trendColor}`}>
                        {error || stat.trend}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div
              className="lg:col-span-2 animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="glass-card-hover p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Accesos Rápidos
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        className={`glass-card-hover p-5 group flex flex-col ${action.hoverColor}`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.color} mb-4 group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-white mb-1">
                          {action.label}
                        </h3>
                        <p className="text-sm text-gray-400 flex-1">
                          {action.description}
                        </p>
                        <div className="flex items-center gap-1 text-[var(--color-neon)] text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                          <span>Ir</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              className="animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              <div className="glass-card-hover p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Características
                  </h2>
                </div>
                <div className="space-y-4">
                  {FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[var(--color-neon)]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div
            className="glass-card-hover p-6 animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Próximos Pasos
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  title: "Publica tu primer artículo",
                  description:
                    "Sube fotos, define precio por hora/día y describe el estado",
                  action: "Crear artículo",
                  href: "/mis-articulos",
                },
                {
                  step: "02",
                  title: "Recibe solicitudes de alquiler",
                  description:
                    "Gestiona reservas desde tu dashboard en tiempo real",
                  action: "Ver solicitudes",
                  href: "/mis-articulos",
                },
                {
                  step: "step",
                  title: "Retira tus ganancias",
                  description:
                    "Transfiere a Nequi, Daviplata o cuenta bancaria al instante",
                  action: "Ir a billetera",
                  href: "/billetera",
                },
              ].map((item) => (
                <Link
                  key={item.step}
                  to={item.href}
                  className="glass-panel-hover p-5 relative overflow-hidden group"
                >
                  <span className="text-4xl font-bold text-[var(--color-border)] absolute top-4 right-4">
                    {item.step}
                  </span>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1 text-[var(--color-neon)] text-sm font-medium group-hover:gap-2 transition-all">
                      <span>{item.action}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaDashboard;
