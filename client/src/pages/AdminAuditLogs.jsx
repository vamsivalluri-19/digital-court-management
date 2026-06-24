import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldAlert, Inbox, Clock } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/auditlogs');
        if (res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching system audit trails');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          System Security Audit Trails
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Automated logging of registry transactions, credential changes, and API mappings.</p>
      </div>

      {/* TIMELINE LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel border rounded-3xl p-12 text-center text-slate-455 bg-white/40 dark:bg-slate-900/40">
          <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold">No security audit entries recorded.</p>
        </div>
      ) : (
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-4 border border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-950/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-550/20 transition-all duration-150"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-955/20 text-rose-500 font-extrabold text-[9px] uppercase border border-rose-100">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      IP: {log.ipAddress || 'Internal Call'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.details}</p>
                  <p className="text-[10px] text-slate-400">
                    Triggered by: {log.userId?.name || 'System Auto'} ({log.userId?.email || 'automated@courtconnect.gov.in'})
                  </p>
                </div>

                <div className="text-right text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
