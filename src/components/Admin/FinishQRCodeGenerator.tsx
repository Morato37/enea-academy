import React, { useState } from 'react';
import { Stone } from '../../lib/supabase';
import { QrCode, Download } from 'lucide-react';

interface FinishQRCodeGeneratorProps {
  stone: Stone;
}

type FinishType = 'split' | 'flamed' | 'flamed_wild' | 'split_antique_wild' | 'blasted' | 'sawn' | 'hammered' | 'brushed' | 'polished' | 'honed';

const FINISH_TYPES: { key: FinishType; label: string; enabledKey: keyof Stone }[] = [
  { key: 'split', label: 'Split', enabledKey: 'finish_split' },
  { key: 'flamed', label: 'Flamed', enabledKey: 'finish_flamed' },
  { key: 'flamed_wild', label: 'Flamed Wild', enabledKey: 'finish_flamed_wild' },
  { key: 'split_antique_wild', label: 'Split Antique Wild', enabledKey: 'finish_split_antique_wild' },
  { key: 'blasted', label: 'Blasted', enabledKey: 'finish_blasted' },
  { key: 'sawn', label: 'Sawn', enabledKey: 'finish_sawn' },
  { key: 'hammered', label: 'Hammered', enabledKey: 'finish_hammered' },
  { key: 'brushed', label: 'Brushed', enabledKey: 'finish_brushed' },
  { key: 'polished', label: 'Polished', enabledKey: 'finish_polished' },
  { key: 'honed', label: 'Honed', enabledKey: 'finish_honed' },
];

export const FinishQRCodeGenerator: React.FC<FinishQRCodeGeneratorProps> = ({ stone }) => {
  const [loadedQRCodes, setLoadedQRCodes] = useState<Record<string, boolean>>({});

  const enabledFinishes = FINISH_TYPES.filter(finish => stone[finish.enabledKey] as boolean);

  const getQRCodeUrl = (finishKey: string): string => {
    const baseUrl = window.location.origin;
    const stoneUrl = `${baseUrl}/stone/${stone.id}?finish=${finishKey}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(stoneUrl)}`;
  };

  const handleDownload = async (finishKey: string, finishLabel: string) => {
    try {
      const qrUrl = getQRCodeUrl(finishKey);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${stone.name.replace(/\s+/g, '_')}_${finishKey}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      alert('Failed to download QR code');
    }
  };

  if (enabledFinishes.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No finishes enabled for this stone</p>
        <p className="text-sm text-gray-500 mt-1">Enable finishes in the "Surface Finishes" section above</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>How it works:</strong> Generate QR codes for each finish type. When scanned, users will be directed to the public stone page with the specific finish displayed.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {enabledFinishes.map(({ key, label }) => {
          const qrUrl = getQRCodeUrl(key);
          const hasImage = stone[`finish_${key}_image_url` as keyof Stone];

          return (
            <div key={key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 text-sm">{label}</h4>
                {!hasImage && (
                  <p className="text-xs text-amber-600 mt-1">No image uploaded</p>
                )}
              </div>

              <div className="p-4">
                <div className="bg-white border border-gray-200 rounded-lg p-2 mb-3">
                  <img
                    src={qrUrl}
                    alt={`QR code for ${label} finish`}
                    className="w-full h-auto"
                    onLoad={() => setLoadedQRCodes(prev => ({ ...prev, [key]: true }))}
                  />
                </div>

                <button
                  onClick={() => handleDownload(key, label)}
                  disabled={!loadedQRCodes[key]}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>

                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
                  {window.location.origin}/stone/{stone.id}?finish={key}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
