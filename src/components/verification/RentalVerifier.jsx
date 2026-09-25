import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

const Html5Qrcode = (window.Html5Qrcode);

export default function RentalVerifier({ rentalId, onVerifySuccess, onClose }) {
  const [activeTab, setActiveTab] = useState('qr');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinFocusedIndex, setPinFocusedIndex] = useState(0);
  const qrReaderRef = useRef(null);
  const qrScannerRef = useRef(null);
  const pinInputsRef = useRef([]);

  const verifyCode = useCallback(async (code, type) => {
    setStatus('loading');
    setError(null);

    try {
      const response = await api.post('/rentals/verify-code', {
        rentalId,
        code,
        type,
      });

      if (response.data.success) {
        setStatus('success');
        onVerifySuccess?.(response.data);
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Código inválido');
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || err.message || 'Error al verificar');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [rentalId, onVerifySuccess, onClose]);

  const startQrScanner = useCallback(async () => {
    if (!Html5Qrcode) {
      setError('Librería html5-qrcode no cargada. Instala: npm i html5-qrcode');
      return;
    }

    try {
      qrReaderRef.current = new Html5Qrcode('qr-reader');
      await qrReaderRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (decodedText && status !== 'loading') {
            verifyCode(decodedText, 'qr');
          }
        },
        (err) => {}
      );
    } catch (err) {
      setError('No se pudo acceder a la cámara. Usa el PIN manual.');
      setActiveTab('pin');
    }
  }, [status, verifyCode]);

  const stopQrScanner = useCallback(async () => {
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.stop();
      } catch (err) {}
      qrReaderRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'qr') {
      startQrScanner();
    } else {
      stopQrScanner();
    }
    return () => stopQrScanner();
  }, [activeTab, startQrScanner, stopQrScanner]);

  useEffect(() => {
    if (pinInputsRef.current[pinFocusedIndex]) {
      pinInputsRef.current[pinFocusedIndex].focus();
    }
  }, [pinFocusedIndex]);

  const handlePinChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    const newDigits = [...pinDigits];
    newDigits[index] = numericValue;
    setPinDigits(newDigits);

    if (numericValue && index < 3) {
      setPinFocusedIndex(index + 1);
    } else if (!numericValue && index > 0) {
      setPinFocusedIndex(index - 1);
    }

    const completePin = newDigits.join('');
    if (completePin.length === 4) {
      verifyCode(completePin, 'pin');
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      setPinFocusedIndex(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      setPinFocusedIndex(index - 1);
    }
    if (e.key === 'ArrowRight' && index < 3) {
      setPinFocusedIndex(index + 1);
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const digits = pasted.split('');
    digits.forEach((digit, i) => {
      if (i < 4) {
        const newDigits = [...pinDigits];
        newDigits[i] = digit;
        setPinDigits(newDigits);
      }
    });
    setPinFocusedIndex(Math.min(digits.length, 3));
    if (digits.length === 4) {
      verifyCode(digits.join(''), 'pin');
    }
  };

  const renderStatusIcon = () => {
    if (status === 'loading') {
      return (
        <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    }
    if (status === 'success') {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (status === 'error') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Validar Entrega / Devolución</h2>
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'qr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                QR Cámara
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pin')}
              className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'pin'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                PIN Manual
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="text-center">
                {renderStatusIcon()}
                <p className="mt-2 text-gray-600">
                  {status === 'loading'
                    ? 'Procesando código QR...'
                    : status === 'success'
                    ? '¡Validación exitosa!'
                    : status === 'error'
                    ? 'Código QR inválido'
                    : 'Apunta la cámara al código QR del artículo'}
                </p>
              </div>

              <div id="qr-reader" ref={qrScannerRef} className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {status === 'loading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="bg-white p-4 rounded-lg">
                      <svg className="animate-spin w-8 h-8 text-blue-600 mx-auto" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center" role="alert">
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                Asegura buena iluminación. El QR debe estar dentro del marco.
              </p>
            </div>
          )}

          {activeTab === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                {renderStatusIcon()}
                <p className="mt-2 text-gray-600">
                  {status === 'loading'
                    ? 'Verificando PIN...'
                    : status === 'success'
                    ? '¡Validación exitosa!'
                    : status === 'error'
                    ? 'PIN incorrecto'
                    : 'Ingresa el PIN de 4 dígitos'}
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex items-center justify-center gap-2 sm:gap-3">
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (pinInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    onPaste={handlePinPaste}
                    onFocus={() => setPinFocusedIndex(index)}
                    autoComplete="one-time-code"
                    className={`w-12 sm:w-14 h-12 sm:h-14 text-center text-2xl sm:text-3xl font-mono rounded-lg border-2 transition-all ${
                      index === pinFocusedIndex
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                        : digit
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } focus:outline-none`}
                    aria-label={`Dígito ${index + 1} del PIN`}
                    disabled={status === 'loading' || status === 'success'}
                  />
                ))}
              </form>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center" role="alert">
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                Usa este método si la cámara no está disponible o falla el escaneo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}