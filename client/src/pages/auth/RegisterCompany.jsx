import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters long')
});

export default function RegisterCompany() {
  const { registerCompany } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await registerCompany(data.companyName, data.adminName, data.adminEmail, data.adminPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4 py-12">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 mb-4 animate-pulse">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">TenantFlow CRM</h1>
          <p className="text-slate-400 mt-2 text-sm">Create your multi-tenant CRM instance</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 glow-primary">
          {success ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-6">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Registration Successful!</h2>
              <p className="text-slate-300 text-sm mb-8">
                Your company workspace and Master Admin account have been created.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium py-3 rounded-xl transition-all text-sm"
              >
                Proceed to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Register Company</h2>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Company Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="Acme Corp"
                      {...register('companyName')}
                    />
                  </div>
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Admin Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="John Doe"
                      {...register('adminName')}
                    />
                  </div>
                  {errors.adminName && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.adminName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Admin Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="admin@company.com"
                      {...register('adminEmail')}
                    />
                  </div>
                  {errors.adminEmail && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.adminEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Admin Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="••••••••"
                      {...register('adminPassword')}
                    />
                  </div>
                  {errors.adminPassword && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.adminPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium py-3 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 transition-all text-sm disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register Company'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
