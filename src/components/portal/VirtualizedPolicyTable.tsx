"use client";

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Shield, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Policy {
  id: string;
  policyNumber: string;
  carrier: string;
  policyType: string;
  premium: string | number;
  expirationDate: Date | string | null;
}

interface VirtualizedPolicyTableProps {
  policies: Policy[];
}

export function VirtualizedPolicyTable({ policies }: VirtualizedPolicyTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: policies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Estimated height of a row including padding
    overscan: 5,
  });

  if (policies.length === 0) {
    return (
      <div className="px-8 py-16 text-center text-white/20 italic font-medium">
        No active policies currently synced to this portal.
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="max-h-[600px] overflow-auto scrollbar-hide"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <table className="w-full text-left border-collapse absolute top-0 left-0">
          <tbody className="divide-y divide-white/5">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const policy = policies[virtualRow.index];
              return (
                <tr 
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="hover:bg-white/[0.02] transition-colors group absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="px-8 py-6 w-[35%]">
                    <div className="space-y-1">
                      <p className="font-bold text-white group-hover:text-primary transition-colors truncate">{policy.policyType}</p>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate">{policy.policyNumber}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 w-[25%]">
                    <span className="text-sm font-bold text-white/60 italic truncate block">{policy.carrier}</span>
                  </td>
                  <td className="px-8 py-6 w-[20%]">
                    <span className="text-lg font-black text-white tracking-tighter">
                      {formatCurrency(policy.premium.toString())}
                    </span>
                  </td>
                  <td className="px-8 py-6 w-[20%]">
                    <div className="flex items-center gap-2 text-white/40">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
