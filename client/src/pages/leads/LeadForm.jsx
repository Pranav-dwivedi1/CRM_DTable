import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const schema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  email: z.string().email('Please enter a valid email address').or(z.literal('')),
  phone: z.string().optional(),
  clientCompanyName: z.string().optional(),
  source: z.string().min(1, 'Lead source is required'),
  status: z.string().min(1, 'Lead status is required'),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedValue: z.number().nonnegative('Value must be a positive number').optional(),
  tags: z.string().optional(),
  followUpDate: z.string().or(z.literal('')),
  assignedTo: z.string().optional(),
  lostReason: z.string().optional()
});

const LOST_REASONS = ['Budget', 'No Response', 'Chose Competitor', 'Not a Fit', 'Other'];

/**
 * LeadForm - works both as a modal and as a standalone page.
 *
 * Props:
 *  - lead           : existing lead for edit mode
 *  - companySettings: { leadSources, leadStatuses }
 *  - teamMembers    : array of User objects (for assign dropdown)
 *  - onClose        : callback to close (modal mode only)
 *  - onSuccess      : callback after successful save
 *  - isPage         : if true, renders as full-page form (no overlay / no X button)
 */
export default function LeadForm({ lead, companySettings, teamMembers = [], onClose, onSuccess, isPage = false }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultSources = companySettings?.leadSources || ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'];
  const defaultStatuses = companySettings?.leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      clientCompanyName: lead?.clientCompanyName || '',
      source: lead?.source || defaultSources[0],
      status: lead?.status || defaultStatuses[0],
      priority: lead?.priority || 'medium',
      estimatedValue: lead?.estimatedValue || 0,
      tags: lead?.tags ? lead.tags.join(', ') : '',
      followUpDate: lead?.followUpDate ? new Date(lead.followUpDate).toISOString().substring(0, 10) : '',
      assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
      lostReason: lead?.lostReason || ''
    }
  });

  const watchedStatus = watch('status');
  const isLost = watchedStatus === 'Lost';

  // Clear lostReason when status is not Lost
  useEffect(() => {
    if (!isLost) {
      setValue('lostReason', '');
    }
  }, [isLost, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    const payload = {
      ...data,
      email: data.email === '' ? undefined : data.email,
      followUpDate: data.followUpDate === '' ? undefined : new Date(data.followUpDate).toISOString(),
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimatedValue: data.estimatedValue || 0,
      assignedTo: data.assignedTo === '' ? undefined : data.assignedTo,
      lostReason: isLost ? data.lostReason : undefined
    };

    try {
      if (lead?._id) {
        await api.patch(`/leads/${lead._id}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      if (onSuccess) {
        onSuccess();
      }
      if (isPage) {
        navigate('/crm/leads');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please check your entries.');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${isPage ? '' : 'p-6 max-h-[80vh] overflow-y-auto'}`}>
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Name *</label>
          <input
            type="text"
            placeholder="Jane Doe"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
          <input
            type="text"
            placeholder="jane.doe@example.com"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
          <input
            type="text"
            placeholder="+1 555-0100"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('phone')}
          />
        </div>

        {/* Client Company Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Client Company Name</label>
          <input
            type="text"
            placeholder="Acme Inc"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('clientCompanyName')}
          />
        </div>

        {/* Est Value */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estimated Value ($)</label>
          <input
            type="number"
            placeholder="10000"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('estimatedValue', { valueAsNumber: true })}
          />
          {errors.estimatedValue && <p className="mt-1 text-[10px] text-red-400">{errors.estimatedValue.message}</p>}
        </div>

        {/* Source */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Source *</label>
          <select className="glass-input w-full px-3 py-2 rounded-xl text-xs" {...register('source')}>
            {defaultSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Status *</label>
          <select className="glass-input w-full px-3 py-2 rounded-xl text-xs" {...register('status')}>
            {defaultStatuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Lost Reason (conditional) */}
        {isLost && (
          <div>
            <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Lost Reason</label>
            <select className="glass-input w-full px-3 py-2 rounded-xl text-xs border-red-500/30" {...register('lostReason')}>
              <option value="">Select reason...</option>
              {LOST_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority *</label>
          <select className="glass-input w-full px-3 py-2 rounded-xl text-xs" {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Follow up Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Follow-up Date</label>
          <input
            type="date"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('followUpDate')}
          />
        </div>

        {/* Assignment (Admins and Managers only) */}
        {user.role !== 'employee' && (
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Lead To</label>
            <select className="glass-input w-full px-3 py-2 rounded-xl text-xs" {...register('assignedTo')}>
              <option value="">Choose Agent (Defaults to Creator)</option>
              {teamMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role === 'manager' ? 'Manager' : 'Agent'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tags */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tags (Comma-separated)</label>
          <input
            type="text"
            placeholder="Enterprise, SaaS, Cold outreach"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            {...register('tags')}
          />
        </div>
      </div>

      <div className={`flex gap-3 border-t border-slate-800 pt-4 mt-6 ${isPage ? 'justify-start' : 'justify-end'}`}>
        {!isPage && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
          >
            Cancel
          </button>
        )}
        {isPage && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold px-6 py-2 rounded-xl text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : lead?._id ? 'Update Lead' : 'Create Lead'}
        </button>
      </div>
    </form>
  );

  // Page mode: renders without modal wrapper
  if (isPage) {
    return formContent;
  }

  // Modal mode: renders with backdrop + card
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden modal-enter">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <h2 className="text-md font-bold font-display text-white">
            {lead?._id ? 'Edit Lead' : 'Create New Lead'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-950/80 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
        {formContent}
      </div>
    </div>
  );
}
