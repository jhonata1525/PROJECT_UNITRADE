import { useState, useEffect } from 'react';
import api from '../../services/api';

const WITHDRAW_METHODS = [
  { id: 'nequi', label: 'Nequi', icon: '📱', placeholder: '300XXXXXXX' },
  { id: 'daviplata', label: 'Daviplata', icon: '📲', placeholder: '300XXXXXXX' },
  { id: 'banco', label: 'Cuenta Bancaria', icon: '🏦', placeholder: 'Número de cuenta' },
];

export default function WalletView() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    method: 'nequi',
    account: '',
    amount: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet/balance');
      setBalance(response.data.balance || 0);
    } catch (err) {
      setError('No se pudo cargar el saldo');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.account.trim()) {
      errors.account = 'Cuenta de destino requerida';
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Monto inválido';
    } else if (amount > balance) {
      errors.amount = `No puedes retirar más de $${balance.toFixed(2)}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/wallet/withdraw', {
        method: formData.method,
        account: formData.account.trim(),
        amount: parseFloat(formData.amount),
      });

      setSuccess('Solicitud de retiro enviada correctamente');
      setFormData({ ...formData, account: '', amount: '' });
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar retiro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billetera UniTrade</h1>
          <p className="text-gray-500 mt-1">Gestiona tus ganancias y retiros</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700" role="alert">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm uppercase tracking-wider">Saldo Disponible</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">${balance.toFixed(2)} COP</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Solicitar Retiro</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de retiro</label>
              <div className="grid grid-cols-3 gap-3">
                {WITHDRAW_METHODS.map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setFormData(prev => ({ ...prev, method: method.id }))}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      formData.method === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={method.id}
                      checked={formData.method === method.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{method.label}</div>
                    </div>
                    {formData.method === method.id && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
                Cuenta de destino
              </label>
              <input
                type="text"
                id="account"
                name="account"
                value={formData.account}
                onChange={handleChange}
                placeholder={WITHDRAW_METHODS.find(m => m.id === formData.method)?.placeholder || 'Cuenta'}
                className={`w-full px-4 py-3 rounded-lg border ${
                  formErrors.account ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors`}
                disabled={submitting}
              />
              {formErrors.account && (
                <p className="mt-1 text-sm text-red-600">{formErrors.account}</p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto a retirar (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  max={balance}
                  className={`w-full pl-7 pr-4 py-3 rounded-lg border ${
                    formErrors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors`}
                  disabled={submitting}
                />
              </div>
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Disponible: <span className="font-medium text-gray-900">${balance.toFixed(2)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || balance <= 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </>
              ) : (
                'Solicitar Retiro'
              )}
            </button>
          </form>

          {balance <= 0 && (
            <p className="mt-4 text-center text-gray-500 text-sm">
              No tienes saldo disponible para retirar
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Información</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Los retiros se procesan en 24-48 horas hábiles
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mínimo de retiro: $1.000 COP
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Comisión de retiro: $0 (promocional por lanzamiento)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}