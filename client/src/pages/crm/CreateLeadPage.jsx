import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import LeadForm from '../leads/LeadForm';

export default function CreateLeadPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [companySettings, setCompanySettings] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const settingsRes = await api.get('/company/settings');
        if (settingsRes.data.success) setCompanySettings(settingsRes.data.data);

        if (user?.role !== 'employee') {
          const usersRes = await api.get('/users');
          if (usersRes.data.success) setTeamMembers(usersRes.data.data);
        }
      } catch (e) {
        console.error('Failed to load form metadata:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold font-display text-white">Create New Lead</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-14">Fill in the details to add a new lead to your pipeline.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800/80">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <LeadForm
            isPage
            companySettings={companySettings}
            teamMembers={teamMembers}
            onSuccess={() => navigate('/crm/leads')}
          />
        )}
      </div>
    </div>
  );
}
