/**
 * @file ContextoAutenticacion.jsx
 * Contexto global de autenticación para la aplicación UniTrade.
 * Gestiona el estado de sesión del usuario, token JWT y permisos.
 * Almacena el token en localStorage para persistencia entre sesiones.
 * Maneja el flujo completo de login, logout y verificación de sesión.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { servicioClienteApi } from "../servicios/servicioClienteApi";

/**
 * Contexto de autenticación que gestiona el estado del usuario, token y métodos de login/logout.
 * Provee funciones login, logout y verificación automática de sesión usando el backend.
 */

const AuthContext = createContext({
  usuario: null,
  token: null,
  login: async () => {},
  logout: () => {},
  verificarSesion: () => {},
});

/**
 * Hook personalizado para usar el contexto de autenticación
 * @returns {object} Estado y funciones de autenticación
 * - usuario: objeto con datos del usuario o null
 * - token: string del JWT o null
 * - login: función async para iniciar sesión
 * - logout: función para cerrar sesión y limpiar storage
 * - verificarSesion: función async para validar sesión al cargar la app
 */
export const ContextoAutenticacion = ({ children }) => {
  // Hooks SIEMPRE en nivel superior del componente proveedor
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  /** Inicializar sesión al montar el componente */
  useEffect(() => {
    const inicializarSesion = async () => {
      // Intentar recuperar token y usuario de localStorage
      const tokenGuardado = localStorage.getItem("uniTrade_token");
      const usuarioGuardado = localStorage.getItem("uniTrade_user");

      if (tokenGuardado && usuarioGuardado) {
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));
      }
      // Verificar sesión con el backend (solo si no estamos en modo mock)
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

  /** Función para iniciar sesión - SIN useNavigate() aquí */
  const login = async (credenciales) => {
    const { email, password } = credenciales;

    // Validación de dominio institucional
    if (!email.endsWith("@unisimon.edu.co")) {
      throw new Error("El correo debe ser institucional (@unisimon.edu.co)");
    }

    // Modo mock: login exitoso con cualquier contraseña
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

    // Producción: llamada real al backend
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

  /** Función para cerrar sesión */
  const logout = () => {
    servicioClienteApi.post("/auth/logout").catch(() => {});
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("uniTrade_token");
    localStorage.removeItem("uniTrade_user");
  };

  /** Función para verificar sesión activa */
  const verificarSesion = async () => {
    try {
      const respuesta = await servicioClienteApi.get("/auth/status");
      return respuesta.data?.autenticado || false;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, verificarSesion }}>
      {usuario && usuario.email && !usuario.email.endsWith("@unisimon.edu.co") ? (
        <p className="text-red-500">Dominio no autorizado</p>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

/**
 * Hook helper para consumir el contexto de autenticación fácilmente
 * @returns {object} { usuario, token, login, logout, verificarSesion }
 */
export { AuthContext };
export const useAuth = () => useContext(AuthContext);

export default AuthContext;