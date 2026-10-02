/**
 * @file ContextoAutenticacion.jsx
 * Contexto global de autenticación para la aplicación UniTrade.
 * Gestiona el estado de sesión del usuario usando localStorage (mock local).
 * No realiza peticiones a backend - autenticación 100% local simulada.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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

    if (!email.endsWith("@unisimon.edu.co")) {
      throw new Error("Solo se permiten correos institucionales @unisimon.edu.co");
    }

    const usuarioMock = {
      id: "1",
      nombre: "Jhonatan Acevedo",
      email,
      rol: "estudiante",
      telefono: null,
      telefonoVerificado: false,
    };

    localStorage.setItem("usuario_unitrade", JSON.stringify(usuarioMock));
    setUsuario(usuarioMock);

    return { usuario: usuarioMock };
  };

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem("usuario_unitrade");
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