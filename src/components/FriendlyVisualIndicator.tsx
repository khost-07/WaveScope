import React from 'react';
import { FriendlyIconType, FriendlyLevel } from '../layer2_engine/easyModeMapper';

interface FriendlyVisualIndicatorProps {
  level: FriendlyLevel;
  iconType?: FriendlyIconType;
  size?: 'small' | 'large';
}

export const FriendlyVisualIndicator: React.FC<FriendlyVisualIndicatorProps> = ({
  level,
  size = 'large'
}) => {
  if (size === 'small') {
    if (level === 'GREAT') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 border border-[#86EFAC]">
          {/* Circle with checkmark */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Good</span>
        </span>
      );
    }
    if (level === 'ATTENTION') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 border border-[#FDE68A]">
          {/* Diamond with exclamation */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Fair</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 border border-[#FCA5A5]">
        {/* Octagon / Alert */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>Weak</span>
      </span>
    );
  }

  // Large visual indicator for main view
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* 3-State Friendly Icon Badge */}
      <div className="flex items-center gap-3">
        {level === 'GREAT' && (
          <div className="w-14 h-14 bg-[#DCFCE7] border-2 border-[#16A34A] flex items-center justify-center text-[#16A34A]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        )}
        {level === 'ATTENTION' && (
          <div className="w-14 h-14 bg-[#FEF3C7] border-2 border-[#D97706] flex items-center justify-center text-[#D97706]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )}
        {level === 'PROBLEM' && (
          <div className="w-14 h-14 bg-[#FEE2E2] border-2 border-[#DC2626] flex items-center justify-center text-[#DC2626]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        )}

        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6B7280]">
            Connection Status
          </div>
          <div
            className="text-[17px] font-bold"
            style={{
              color: level === 'GREAT' ? '#16A34A' : level === 'ATTENTION' ? '#D97706' : '#DC2626'
            }}
          >
            {level === 'GREAT' ? 'Great Connection' : level === 'ATTENTION' ? 'Can Be Improved' : 'Needs Attention'}
          </div>
        </div>
      </div>

      {/* Signal Bars Visual Meter (Full / Medium / Low) */}
      <div className="flex items-center gap-1.5 p-2 bg-[#F8F9FA] border border-[#E2E5E9]">
        <span className="font-mono text-[10px] font-bold text-[#6B7280] mr-1 uppercase">Signal:</span>
        <div className="flex items-end gap-1 h-5">
          {/* Bar 1 */}
          <div
            className="w-2.5 h-2.5"
            style={{
              backgroundColor: level === 'GREAT' ? '#16A34A' : level === 'ATTENTION' ? '#D97706' : '#DC2626'
            }}
          />
          {/* Bar 2 */}
          <div
            className="w-2.5 h-3.5"
            style={{
              backgroundColor: level === 'GREAT' ? '#16A34A' : level === 'ATTENTION' ? '#D97706' : '#CBD0D6'
            }}
          />
          {/* Bar 3 */}
          <div
            className="w-2.5 h-5"
            style={{
              backgroundColor: level === 'GREAT' ? '#16A34A' : '#CBD0D6'
            }}
          />
        </div>
        <span className="font-mono text-[11px] font-bold text-black ml-1">
          {level === 'GREAT' ? 'Full' : level === 'ATTENTION' ? 'Fair' : 'Low'}
        </span>
      </div>
    </div>
  );
};
