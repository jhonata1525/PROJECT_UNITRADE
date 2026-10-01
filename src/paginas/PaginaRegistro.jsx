/**
 * @file PaginaRegistro.jsx
 * Página de registro para UniTrade.
 * - Validación de email @unisimon.edu.co (HU-01)
 * - Formulario con campos: email, password, terminos
 * - En producción: POST /api/auth/register con validación de dominio
 */

import React from "react";
import { Encabezado } from "../componentes/comunes/Encabezado";
import FormularioRegistro from "../componentes/auth/FormularioRegistro";

/**
 * PaginaRegistro - Página de registro de usuario
 * - Validación de email @unisimon.edu.co (HU-01)
 * - Campos: email, password, confirmPassword, terminos
 * - En producción: POST /api/auth/register con validación de dominio
 */

export default function PaginaRegistro() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Encabezado />

      <main className="max-w-7xl mx-auto py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
            Registro UniTrade
          </h1>

          {/* Formulario de registro */}
          <FormularioRegistro />
        </div>
      </main>
    </div>
  );
}