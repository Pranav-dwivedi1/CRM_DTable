import React, { useContext, useEffect, useState, useRef } from "react";
import {
  MessageSquare, Mail, Phone, Send, Loader2, Clock, CheckCircle,
  Search, Filter, ChevronDown, X, AlertCircle, RefreshCw
} from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const CHANNEL_LABELS = {
  email: { icon: Mail, label: "Email", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  whatsapp: { icon: Phone, label: "WhatsApp", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
};

function LogItem({ log }) {
  const meta = CHANNEL_LABELS[log.channel] || CHANNEL_LABELS.email;
  const Icon = meta.icon;
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-all">
      <span className={`shrink-0 p-2 rounded-xl border ${meta.bg}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-semibold text-white truncate">To: {log.recipientName || log.recipientId?.name || "Unknown"}</p>
          <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
            log.status === "sent" ? "text-green-400 bg-green-500/10 border-green-500/20" :
            log.status === "failed" ? "text-red-400 bg-red-500/10 border-red-500/20" :
            "text-slate-400 bg-slate-500/10 border-slate-500/20"
          }`}>{log.status}</span>
        </div>
        {log.subject && <p className="text-[10px] text-slate-400 mb-1 truncate">Subject: {log.subject}</p>}
        <p className="text-xs text-slate-300 line-clamp-2">{log.body}</p>
        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {new Date(log.createdAt).toLocaleString()} &nbsp;·&nbsp; via {meta.label}
          {log.sentBy?.name && <span className="text-slate-600">&nbsp;by {log.sentBy.name}</span>}
        </p>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("send");
  const [channel, setChannel] = useState("email");
  const [recipients, setRecipients] = useState([]);
  const [loadingRecip, setLoadingRecip] = useState(false);

  // Send form state
  const [form, setForm] = useState({ recipientId: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [filterChannel, setFilterChannel] = useState("");

  // Fetch eligible recipients
  useEffect(() => {
    const fetchRecipients = async () => {
      setLoadingRecip(true);
      try {
        const res = await api.get("/messages/recipients");
        if (res.data.success) setRecipients(res.data.data || []);
      } catch (err) {
        console.error("Failed to load recipients:", err);
      } finally {
        setLoadingRecip(false);
      }
    };
    fetchRecipients();
  }, []);

  // Fetch communication logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logsPage,
        limit: 15,
        ...(filterChannel && { channel: filterChannel }),
      });
      const res = await api.get(`/messages/logs?${params}`);
      if (res.data.success) {
        setLogs(res.data.data || []);
        setLogsTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") fetchLogs();
  }, [activeTab, logsPage, filterChannel]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSendError("");
    setSendSuccess("");
    if (!form.recipientId) { setSendError("Please select a recipient."); return; }
    if (!form.body.trim()) { setSendError("Message body cannot be empty."); return; }
    if (channel === "email" && !form.subject.trim()) { setSendError("Email subject is required."); return; }

    setSending(true);
    try {
      const res = await api.post("/messages/send", {
        channel,
        recipientId: form.recipientId,
        subject: form.subject,
        body: form.body,
      });
      if (res.data.success) {
        setSendSuccess("Message sent successfully!");
        setForm({ recipientId: "", subject: "", body: "" });
      } else {
        setSendError(res.data.message || "Failed to send message.");
      }
    } catch (err) {
      setSendError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-brand-400" />
            Communications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Send emails and WhatsApp messages, view conversation history.</p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex border-b border-slate-800 gap-6">
        {["send", "history"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === tab ? "border-brand-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>
            {tab === "send" ? "Compose Message" : "Message History"}
          </button>
        ))}
      </div>

      {/* Send Tab */}
      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Compose Panel */}
          <div className="lg:col-span-3 glass-panel rounded-2xl border border-slate-800/80 p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Compose</h3>

            {/* Channel Selector */}
            <div className="flex gap-3 mb-6">
              {Object.entries(CHANNEL_LABELS).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button key={key} onClick={() => setChannel(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      channel === key
                        ? `${meta.bg} ${meta.color} border-current`
                        : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-white"
                    }`}>
                    <Icon className="h-4 w-4" /> {meta.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recipient</label>
                {loadingRecip ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading recipients…
                  </div>
                ) : (
                  <select value={form.recipientId} onChange={e => setForm(f => ({ ...f, recipientId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all">
                    <option value="">-- Select recipient --</option>
                    {recipients.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.email || r.phone || "no contact"})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject (email only) */}
              {channel === "email" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Email subject…"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all" />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={6} placeholder={channel === "whatsapp" ? "Type your WhatsApp message…" : "Type your email message…"}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 resize-none transition-all" />
              </div>

              {/* Feedback */}
              {sendError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {sendError}
                </div>
              )}
              {sendSuccess && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                  <CheckCircle className="h-4 w-4 shrink-0" /> {sendSuccess}
                </div>
              )}

              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending…" : `Send ${CHANNEL_LABELS[channel].label}`}
              </button>
            </form>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl border border-slate-800/80 p-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Your Access Level</h4>
              <div className="space-y-3 text-xs text-slate-300">
                {user?.role === "masterAdmin" && (
                  <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    You can message <strong className="text-white">any employee, manager, or client</strong> in the system.
                  </p>
                )}
                {user?.role === "manager" && (
                  <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    You can message <strong className="text-white">your assigned employees and assigned clients</strong>.
                  </p>
                )}
                {user?.role === "employee" && (
                  <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    You can message <strong className="text-white">your assigned clients only</strong>.
                  </p>
                )}
              </div>
            </div>
            <div className="glass-panel rounded-2xl border border-slate-800/80 p-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Channel Notes</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Mail className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Email</strong> — Requires subject and body. Sent via configured SMTP.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Phone className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">WhatsApp</strong> — Sent via configured Twilio/WhatsApp API. No subject required.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <select value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setLogsPage(1); }}
              className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none transition-all min-w-[140px]">
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <button onClick={fetchLogs}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-all">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-slate-800/60 p-16 text-center">
              <MessageSquare className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No messages yet</h3>
              <p className="text-slate-500 text-sm">All sent emails and WhatsApp messages will appear here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {logs.map(log => <LogItem key={log._id} log={log} />)}
              </div>

              {logsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">Page {logsPage} of {logsTotalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      Previous
                    </button>
                    <button onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))} disabled={logsPage === logsTotalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
