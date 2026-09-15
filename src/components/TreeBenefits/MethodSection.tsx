import React from 'react';
import { TFn } from '../../lib/treeBenefits/i18n';

/** Methodology, assumptions and sources (static, trusted HTML from the i18n table). */
export const MethodSection: React.FC<{ T: TFn }> = ({ T }) => (
  <div className="mt-8 border-t border-gray-300 pt-3">
    <details className="group">
      <summary className="cursor-pointer list-none text-base font-semibold text-gray-900 hover:text-green-700">
        <span className="mr-2 inline-block font-mono text-gray-400 group-open:hidden">+</span>
        <span className="mr-2 hidden font-mono text-gray-400 group-open:inline">–</span>
        {T('mTitle')}
      </summary>
      <div
        className="tb-method mt-2 max-w-[74ch] text-[13.5px] text-gray-700 [&_code]:rounded [&_code]:bg-green-50 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_h4]:mb-1 [&_h4]:mt-4 [&_h4]:text-[12px] [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:text-gray-500 [&_p]:my-2"
        dangerouslySetInnerHTML={{ __html: T('method') }}
      />
    </details>
  </div>
);
