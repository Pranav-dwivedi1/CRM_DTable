import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, GripVertical } from 'lucide-react';

const PRIORITY_STYLES = {
  high:   { dot: 'bg-red-400',    badge: 'text-red-400 border-red-500/20',    label: 'H' },
  medium: { dot: 'bg-orange-400', badge: 'text-orange-400 border-orange-500/20', label: 'M' },
  low:    { dot: 'bg-slate-400',  badge: 'text-slate-400 border-slate-500/20', label: 'L' }
};

/**
 * Draggable lead card using @dnd-kit/sortable.
 * The ENTIRE card is the drag handle — listeners/attributes are on the outer wrapper
 * so users can grab anywhere on the card, not just the grip icon.
 */
export default function LeadCard({ lead, isDragOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead._id });

  const style = {
    // Use Translate (not Transform) to prevent scaling during drag
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const priority = PRIORITY_STYLES[lead.priority] || PRIORITY_STYLES.medium;
  const initials = lead.assignedTo?.name
    ? lead.assignedTo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Card body — shared between drag overlay and normal render
  const cardBody = (
    <div
      className={`glass-card rounded-2xl border p-3.5 space-y-3 select-none ${
        isDragOverlay
          ? 'border-brand-500/40 shadow-2xl shadow-brand-500/25 ring-1 ring-brand-500/30 scale-105'
          : 'border-slate-800/60 hover:border-slate-700/80'
      }`}
    >
      {/* Top row: grip icon + name + priority */}
      <div className="flex items-start gap-2">
        {/* Grip icon is now PURELY decorative — drag is on the whole card */}
        <GripVertical className="mt-0.5 h-4 w-4 text-slate-600 shrink-0" />

        <div className="flex-1 min-w-0">
          <Link
            to={`/leads/${lead._id}`}
            onClick={e => {
              // Prevent navigation while dragging
              if (isDragging) e.preventDefault();
              e.stopPropagation();
            }}
            className="text-xs font-bold text-white hover:text-brand-400 transition-colors leading-snug line-clamp-2"
            draggable={false}
          >
            {lead.name}
          </Link>
          {lead.clientCompanyName && (
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{lead.clientCompanyName}</p>
          )}
        </div>

        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-transparent ${priority.badge}`}>
          {priority.label}
        </span>
      </div>

      {/* Value + follow-up date */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-brand-400 font-semibold">
          {lead.estimatedValue > 0 && (
            <>
              <DollarSign className="h-3 w-3" />
              <span>{lead.estimatedValue.toLocaleString()}</span>
            </>
          )}
        </div>
        {lead.followUpDate && (
          <div className="flex items-center gap-1 text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>{new Date(lead.followUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Footer: assignee avatar + priority dot */}
      <div className="flex items-center justify-between border-t border-slate-800/50 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-[9px] font-bold shrink-0">
            {initials}
          </div>
          <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
            {lead.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full ${priority.dot}`} title={`${lead.priority} priority`} />
      </div>
    </div>
  );

  // Drag overlay: no ref/listeners needed — just the styled card
  if (isDragOverlay) return cardBody;

  return (
    <div
      ref={setNodeRef}
      style={style}
      // ← Listeners on the whole card so ANY part of the card initiates drag
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      {cardBody}
    </div>
  );
}
