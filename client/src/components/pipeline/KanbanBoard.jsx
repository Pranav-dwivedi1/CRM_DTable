import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import LostReasonModal from './LostReasonModal';

/**
 * Desktop Kanban board using dnd-kit.
 *
 * Props:
 *  - leads          : Lead[] (full, role-scoped list)
 *  - statuses       : string[] (ordered column names from company config)
 *  - onStatusChange : ({ id, status, lostReason?, oldStatus }) => Promise<void>
 *  - isChanging     : bool
 *  - toast          : useToast() result
 */
export default function KanbanBoard({ leads, statuses, onStatusChange, isChanging, toast }) {
  // Local optimistic state — columns keyed by status
  const [localLeads, setLocalLeads] = useState(() => buildColumns(leads, statuses));
  const [activeId, setActiveId] = useState(null);         // currently dragged lead id
  const [lostModal, setLostModal] = useState(null);       // { lead, targetStatus }
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Sync when parent leads change (React Query refetch)
  React.useEffect(() => {
    setLocalLeads(buildColumns(leads, statuses));
  }, [leads, statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Find which column a lead belongs to
  const findColumnOfLead = (leadId) => {
    for (const [col, colLeads] of Object.entries(localLeads)) {
      if (colLeads.some(l => l._id === leadId)) return col;
    }
    return null;
  };

  const findLead = (leadId) => {
    for (const colLeads of Object.values(localLeads)) {
      const found = colLeads.find(l => l._id === leadId);
      if (found) return found;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const sourceCol = findColumnOfLead(active.id);
    // over.id could be a column id (status string) or a lead id
    const targetCol = statuses.includes(over.id) ? over.id : findColumnOfLead(over.id);

    if (!sourceCol || !targetCol || sourceCol === targetCol) return;

    // Optimistically move card between columns
    setLocalLeads(prev => {
      const lead = prev[sourceCol].find(l => l._id === active.id);
      if (!lead) return prev;
      return {
        ...prev,
        [sourceCol]: prev[sourceCol].filter(l => l._id !== active.id),
        [targetCol]: [...prev[targetCol], lead]
      };
    });
  };

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null);
    if (!over) {
      // Dropped outside any column — rebuild from original
      setLocalLeads(buildColumns(leads, statuses));
      return;
    }

    const targetCol = statuses.includes(over.id) ? over.id : findColumnOfLead(over.id);
    const sourceCol = findColumnOfLead(active.id);

    if (!targetCol || !sourceCol) return;

    // If dropped in same column do nothing
    if (targetCol === sourceCol) return;

    const lead = findLead(active.id);
    if (!lead) return;

    // Intercept Lost drops — show modal first
    if (targetCol === 'Lost') {
      setLostModal({ lead, targetStatus: targetCol });
      return;
    }

    // Call API
    try {
      await onStatusChange({ id: lead._id, status: targetCol, oldStatus: sourceCol });
    } catch (err) {
      // Revert on failure
      toast?.error(err?.response?.data?.message || 'Failed to update stage. Please try again.');
      setLocalLeads(buildColumns(leads, statuses));
    }
  }, [leads, statuses, onStatusChange, toast]);

  const handleLostConfirm = async (lostReason) => {
    if (!lostModal) return;
    setConfirmLoading(true);
    try {
      await onStatusChange({
        id: lostModal.lead._id,
        status: 'Lost',
        lostReason,
        oldStatus: lostModal.targetStatus
      });
      setLostModal(null);
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Failed to mark lead as Lost.');
      setLocalLeads(buildColumns(leads, statuses));
      setLostModal(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleLostCancel = () => {
    setLostModal(null);
    // Revert optimistic move back
    setLocalLeads(buildColumns(leads, statuses));
  };

  const activeLead = activeId ? findLead(activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scrollable board */}
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 pipeline-scroll" style={{ minHeight: '520px' }}>
          {statuses.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              leads={localLeads[status] || []}
            />
          ))}
        </div>

        {/* Drag overlay — ghost card that follows cursor */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
          {activeLead ? <LeadCard lead={activeLead} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Lost reason gate */}
      {lostModal && (
        <LostReasonModal
          leadName={lostModal.lead.name}
          onConfirm={handleLostConfirm}
          onCancel={handleLostCancel}
          loading={confirmLoading}
        />
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildColumns(leads, statuses) {
  const cols = {};
  statuses.forEach(s => { cols[s] = []; });
  leads.forEach(lead => {
    if (cols[lead.status] !== undefined) {
      cols[lead.status].push(lead);
    } else {
      // Put unknown-status leads into first column as fallback
      if (statuses.length) cols[statuses[0]].push(lead);
    }
  });
  return cols;
}
