import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// ─── Fetch helpers ──────────────────────────────────────────────────────────

const fetchLeads = async (params = {}) => {
  const res = await api.get('/leads', { params: { limit: 200, ...params } });
  return res.data.data || [];
};

const fetchLead = async (id) => {
  const res = await api.get(`/leads/${id}`);
  return res.data.data;
};

const fetchCompanySettings = async () => {
  const res = await api.get('/company/settings');
  return res.data.data;
};

const changeStatusFn = async ({ id, status, lostReason }) => {
  const res = await api.patch(`/leads/${id}/status`, { status, lostReason });
  return res.data;
};

// ─── Query hooks ─────────────────────────────────────────────────────────────

/**
 * Fetch all leads (role-scoped on server).
 * params: { status, source, assignedTo, search, page, limit }
 */
export const useLeads = (params = {}) => {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => fetchLeads(params),
    placeholderData: (prev) => prev
  });
};

/** Fetch a single lead by ID */
export const useLead = (id) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLead(id),
    enabled: !!id
  });
};

/** Fetch company settings (leadStatuses, leadSources, etc.) */
export const useCompanySettings = () => {
  return useQuery({
    queryKey: ['companySettings'],
    queryFn: fetchCompanySettings,
    staleTime: 1000 * 60 * 10 // settings rarely change, cache 10 min
  });
};

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Mutation to change a lead's status.
 * On success:
 *  - Invalidates all leads queries (forces refetch in LeadList, etc.)
 *  - Invalidates the individual lead query
 *  - Invalidates CRM dashboard summary
 *  - Dispatches 'lead:statusChanged' CustomEvent for non-React-Query pages
 */
export const useLeadStatusChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeStatusFn,
    onSuccess: (data, variables) => {
      // Invalidate all leads queries (pipeline, list, converted, lost)
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Invalidate the specific lead (detail page)
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      // Invalidate CRM dashboard so stats refresh
      queryClient.invalidateQueries({ queryKey: ['crmDashboard'] });

      // Broadcast to non-React-Query components via CustomEvent
      window.dispatchEvent(
        new CustomEvent('lead:statusChanged', {
          detail: {
            leadId: variables.id,
            from: variables.oldStatus,
            to: variables.status
          }
        })
      );
    }
  });
};
