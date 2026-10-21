/**
 * @file ContextoAutenticacion.jsx
 * Contexto global de autenticación para la aplicación UniTrade.
 * Gestiona el estado de sesión del usuario usando localStorage (mock local).
 * No realiza peticiones a backend - autenticación 100% local simulada.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import servicioClienteApi from "../servicios/servicioClienteApi";

const ContextoAutenticacion = createContext({
  usuario: null,
  cargando: true,
  login: async () => {},
  logout: () => {},
  actualizarUsuario: async () => {},
});

export { ContextoAutenticacion, ContextoAutenticacion as AuthContext };

export const useAuth = () => {
  const context = useContext(ContextoAutenticacion);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un ProveedorAutenticacion");
  }
  return context;
};

const ProveedorAutenticacion = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario_unitrade");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  const login = async (credenciales) => {
    const { email, password } = credenciales;

    try {
      const { data } = await servicioClienteApi.post("/auth/login", {
        email: email.trim(),
        password,
      });
      const usuarioAutenticado = {
        ...data.usuario,
        email: data.usuario.correo,
        rol: data.usuario.rol.toLowerCase(),
      };

      localStorage.setItem("usuario_unitrade", JSON.stringify(usuarioAutenticado));
      setUsuario(usuarioAutenticado);

      return { usuario: usuarioAutenticado };
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      if (error.response?.status === 401) {
        throw new Error("Correo o contraseña incorrectos", { cause: error });
      }

      const mensaje = error.response?.data?.message;
      if (typeof mensaje === "string") {
        throw new Error(mensaje, { cause: error });
      }
      if (Array.isArray(mensaje)) {
        throw new Error(mensaje.join(", "), { cause: error });
      }

      if (!error.response) {
        throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.", {
          cause: error,
        });
      }

      throw new Error("No se pudo iniciar sesión. Intenta de nuevo.", {
        cause: error,
      });
    }
  };

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem("usuario_unitrade");
    localStorage.removeItem("uniTrade_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const actualizarUsuario = useCallback(async (datosActualizados) => {
    const usuarioActualizado = {
      ...usuario,
      ...datosActualizados,
    };
    localStorage.setItem("usuario_unitrade", JSON.stringify(usuarioActualizado));
    setUsuario(usuarioActualizado);
    return { usuario: usuarioActualizado };
  }, [usuario]);

  return (
    <ContextoAutenticacion.Provider value={{ usuario, cargando, login, logout, actualizarUsuario }}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export { ProveedorAutenticacion };

export default ProveedorAutenticacion;