import React from "react";

export const LoginForm = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Iniciar Sesión
      </h2>
      <p className="text-gray-500 dark:text-gray-400">
        Formulario de login con OTP de WhatsApp
      </p>
    </div>
  );
};