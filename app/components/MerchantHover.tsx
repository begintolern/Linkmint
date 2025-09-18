// app/components/MerchantHover.tsx
'use client';

import React from 'react';

export function MerchantHover({ merchant }: { merchant: Record<string, any> }) {
  return (
    <div className="relative inline-block group">
      <span className="text-sm text-blue-600 underline cursor-help">Details</span>

      <div
        className="absolute z-20 hidden group-hover:block w-[420px] max-h-[70vh]
                   overflow-y-auto rounded-2xl border bg-white p-4 shadow-2xl top-6 right-0"
      >
        <div className="text-xs text-gray-500 mb-2">Merchant JSON</div>
        <pre className="text-xs whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(merchant, null, 2)}
        </pre>
      </div>
    </div>
  );
}
