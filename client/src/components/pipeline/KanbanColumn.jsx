import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DollarSign } from 'lucide-react';
import LeadCard from './LeadCard';

const COLUMN_ACCENT = {
  'New':           'border-t-blue-500',
  'Contacted':     'border-t-indigo-500',
  'Qualified':     'border-t-purple-500',
  'Proposal Sent': 'border-t-yellow-500',
  'Won':           'border-t-green-500',
  'Lost':          'border-t-red-500'
};

const COLUMN_COUNT_BADGE = {
  'New':           'bg-blue-500/10 text-blue-400',
  'Contacted':     'bg-indigo-500/10 text-indigo-400',
  'Qualified':     'bg-purple-500/10 text-purple-400',
  'Proposal Sent': 'bg-yellow-500/10 text-yellow-400',
  'Won':           'bg-green-500/10 text-green-400',
  'Lost':          'bg-red-500/10 text-red-400'
};

/**
 * A droppable Kanban column.
 *
 * Props:
 *  - status  : string (column name / lead status)
 *  - leads   : Lead[]
 */
export default function KanbanColumn({ status, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const accentClass = COLUMN_ACCENT[status] || 'border-t-slate-600';
  const badgeClass  = COLUMN_COUNT_BADGE[status] || 'bg-slate-500/10 text-slate-400';

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-800/80 border-t-2 ${accentClass} bg-slate-900/30 backdrop-blur-sm transition-all duration-200 min-w-[220px] w-[220px] shrink-0 ${
        isOver ? 'ring-2 ring-brand-500/40 bg-brand-500/5' : ''
      }`}
      style={{ minHeight: '500px' }}
    >
      {/* Column Header */}
      <div className="px-3 py-3 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">{status}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
            <DollarSign className="h-3 w-3" />
            <span className="font-semibold text-slate-400">{totalValue.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto transition-colors duration-150 ${
          isOver ? 'bg-brand-500/5' : ''
        }`}
      >
        <SortableContext
          items={leads.map(l => l._id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <div className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${
              isOver ? 'border-brand-500/50 bg-brand-500/5' : 'border-slate-800/60'
            }`}>
              <p className="text-[10px] text-slate-600 italic">
                {isOver ? 'Drop here' : 'Empty stage'}
              </p>
            </div>
          ) : (
            leads.map(lead => (
              <LeadCard key={lead._id} lead={lead} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
