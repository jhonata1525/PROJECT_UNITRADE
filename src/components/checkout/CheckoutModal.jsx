import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function CheckoutModal({ isOpen, onClose, rentalData }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    if (isOpen && rentalData) {
      const baseRate = rentalData.hourlyRate * rentalData.hours;
      const commissionRate = 0.10;
      const commission = baseRate * commissionRate;
      const total = baseRate + commission;

      setBreakdown({ baseRate, commission, total, commissionRate: commissionRate * 100 });
      setStatus('idle');
      setError(null);
    }
  }, [isOpen, rentalData]);

  const handlePay = async () => {
    if (!rentalData || status === 'loading') return;

    setStatus('loading');
    setError(null);

    try {
      const response = await api.post('/payments/checkout', {
        rentalId: rentalData.id,
        amount: breakdown.total,
        paymentMethod: 'sandbox',
      });

      if (response.data.success) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Error en el pago');
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || err.message || 'Error al procesar el pago');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Procesar Pago</h2>
          <button
            onClick={onClose}
            disabled={status === 'loading' || status === 'success'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">¡Pago confirmado!</h3>
              <p className="text-gray-500 mt-1">Tu alquiler ha sido confirmado. Redirigiendo...</p>
            </div>
          ) : (
            <>
              {breakdown && (
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tarifa base ({rentalData.hours}h × ${rentalData.hourlyRate}/h)</span>
                    <span className="font-medium">${breakdown.baseRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Comisión plataforma ({breakdown.commissionRate}%)</span>
                    <span className="font-medium">${breakdown.commission.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${breakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={status === 'loading' || status === 'success'}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'Pagar en Pasarela (Sandbox)'
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                Modo sandbox: simula pago sin cargo real
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}