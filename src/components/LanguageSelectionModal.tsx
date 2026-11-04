import React from 'react';
import { X } from 'lucide-react';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (language: 'de' | 'en') => void;
  title: string;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">Choose a language for the PDF export:</p>

          <div className="space-y-3">
            <button
              onClick={() => onSelectLanguage('de')}
              className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-lg">German</div>
                <div className="text-sm text-gray-600">PDF in German</div>
              </div>
              <span className="text-2xl">🇩🇪</span>
            </button>

            <button
              onClick={() => onSelectLanguage('en')}
              className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-lg">English</div>
                <div className="text-sm text-gray-600">PDF in English</div>
              </div>
              <span className="text-2xl">🇬🇧</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
