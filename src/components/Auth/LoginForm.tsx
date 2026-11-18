import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithAzure } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(`${window.location.search}&${window.location.hash.replace(/^#/, '')}`);
    const errorCode = params.get('error_code');

    if (errorCode === 'signup_disabled') {
      setError('Dieses Enea-Konto ist noch nicht für die Academy freigeschaltet. Bitte versuche es später erneut.');
    } else if (params.get('error') === 'access_denied') {
      setError(params.get('error_description') || 'Die Anmeldung mit Microsoft 365 konnte nicht abgeschlossen werden.');
    }

    if (errorCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleMicrosoftLogin = async () => {
    setError('');
    setMicrosoftLoading(true);

    try {
      const { error } = await signInWithAzure();

      if (error) {
        setError(error.message);
        setMicrosoftLoading(false);
      }
    } catch {
      setError('An unexpected error occurred');
      setMicrosoftLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/enea-logo.png" alt="Enea Logo" className="h-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Enea Academy
          </h1>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="text-sm p-3 rounded-lg bg-red-50 text-red-800 mb-6">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={microsoftLoading}
          className="w-full bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
        >
          {microsoftLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Redirecting to Microsoft...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h10.931v10.931H0V0z" fill="#F25022"/>
                <path d="M12.069 0H23v10.931H12.069V0z" fill="#7FBA00"/>
                <path d="M0 12.069h10.931V23H0V12.069z" fill="#00A4EF"/>
                <path d="M12.069 12.069H23V23H12.069V12.069z" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft 365
            </>
          )}
        </button>
      </div>
    </div>
  );
};
