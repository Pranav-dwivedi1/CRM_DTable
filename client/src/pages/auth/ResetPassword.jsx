import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import api from '../../services/api';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export default function ResetPassword() {
  const { token } = useParams();
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
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">TenantFlow CRM</h1>
          <p className="text-slate-400 mt-2 text-sm">Update your password credentials</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 glow-primary">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-6">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Password Updated</h2>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Your new password has been successfully configured. You may now login to your workspace.
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
              <h2 className="text-lg font-semibold text-white mb-6">Create New Password</h2>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium py-3 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 transition-all text-sm disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
