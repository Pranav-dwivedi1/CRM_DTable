import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const LOST_REASONS = ['Budget', 'No Response', 'Chose Competitor', 'Not a Fit', 'Other'];

/**
 * Modal that forces the user to pick a lostReason before confirming a "Lost" status move.
 *
 * Props:
 *  - leadName   : string — displayed for context
 *  - onConfirm  : (lostReason: string) => void
 *  - onCancel   : () => void
 *  - loading    : bool
 */
export default function LostReasonModal({ leadName, onConfirm, onCancel, loading = false }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-panel rounded-3xl border border-red-500/20 shadow-2xl overflow-hidden modal-enter">
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-500/20 flex justify-between items-center bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold font-display text-white">Mark as Lost</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-950/80 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-xs leading-relaxed">
            Before marking <span className="text-white font-semibold">"{leadName}"</span> as Lost,
            please select a reason. This helps track pipeline health over time.
          </p>

          <div>
            <label className="block text-[10px] font-bold text-red-400/80 uppercase tracking-wider mb-2">
              Lost Reason *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {LOST_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                    reason === r
                      ? 'bg-red-500/15 border-red-500/40 text-red-300 font-semibold'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Cancel — Keep Stage
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!reason || loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Confirm Lost'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
