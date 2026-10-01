/**
 * @file ContextoAutenticacion.jsx
 * Contexto global de autenticación para la aplicación UniTrade.
 * Gestiona el estado de sesión del usuario, token JWT y permisos.
 * Almacena el token en localStorage para persistencia entre sesiones.
 * Maneja el flujo completo de login, logout y verificación de sesión.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { servicioClienteApi } from "../servicios/servicioClienteApi";

const ContextoAutenticacion = createContext({
  usuario: null,
  token: null,
  login: async () => {},
  logout: () => {},
  verificarSesion: () => {},
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
  const [token, setToken] = useState(null);

  useEffect(() => {
    const inicializarSesion = async () => {
      const tokenGuardado = localStorage.getItem("uniTrade_token");
      const usuarioGuardado = localStorage.getItem("uniTrade_user");

      if (tokenGuardado && usuarioGuardado) {
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));
      }
      if (import.meta.env.VITE_USAR_MOCK !== "true") {
        try {
          const respuesta = await servicioClienteApi.get("/auth/status");
          if (respuesta.data?.autenticado) {
            setToken(tokenGuardado);
            setUsuario(respuesta.data.usuario);
          } else {
            limpiarSesion();
          }
        } catch (error) {
          limpiarSesion();
        }
      }
    };

    const limpiarSesion = () => {
      setToken(null);
      setUsuario(null);
      localStorage.removeItem("uniTrade_token");
      localStorage.removeItem("uniTrade_user");
    };

    inicializarSesion();
  }, []);

  const login = async (credenciales) => {
    const { email, password } = credenciales;

    if (!email.endsWith("@unisimon.edu.co")) {
      throw new Error("El correo debe ser institucional (@unisimon.edu.co)");
    }

    if (import.meta.env.VITE_USAR_MOCK === "true") {
      const mockUsuario = {
        id: `user-${Date.now()}`,
        email,
        nombre: email.split("@")[0],
        rol: "estudiante",
      };
      const mockToken = `mock-token-${Date.now()}`;

      setToken(mockToken);
      setUsuario(mockUsuario);

      localStorage.setItem("uniTrade_token", mockToken);
      localStorage.setItem("uniTrade_user", JSON.stringify(mockUsuario));

      return { token: mockToken, usuario: mockUsuario };
    }

    try {
      const respuesta = await servicioClienteApi.post("/auth/login", credenciales);
      const { token, usuario: usuarioData } = respuesta.data;

      setToken(token);
      setUsuario(usuarioData);

      localStorage.setItem("uniTrade_token", token);
      localStorage.setItem("uniTrade_user", JSON.stringify(usuarioData));
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  const logout = () => {
    servicioClienteApi.post("/auth/logout").catch(() => {});
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("uniTrade_token");
    localStorage.removeItem("uniTrade_user");
  };

  const verificarSesion = async () => {
    try {
      const respuesta = await servicioClienteApi.get("/auth/status");
      return respuesta.data?.autenticado || false;
    } catch (error) {
      return false;
    }
  };

  return (
    <ContextoAutenticacion.Provider value={{ usuario, token, login, logout, verificarSesion }}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export { ProveedorAutenticacion };

export default ProveedorAutenticacion;