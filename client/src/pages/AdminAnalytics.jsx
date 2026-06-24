import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity, FileSpreadsheet, Sparkles } from 'lucide-react';

const AdminAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching analytics database');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sample analytics time sequence data for Recharts area charts
  const filingTimelineData = [
    { month: 'Jan', Filed: 45, Disposed: 32 },
    { month: 'Feb', Filed: 58, Disposed: 45 },
    { month: 'Mar', Filed: 80, Disposed: 60 },
    { month: 'Apr', Filed: 70, Disposed: 65 },
    { month: 'May', Filed: 95, Disposed: 85 },
    { month: 'Jun', Filed: 110, Disposed: 92 },
  ];

  const judgeClearenceData = [
    { name: 'Justice Devi', Cases: 140, Disposed: 122 },
    { name: 'Justice Kumar', Cases: 95, Disposed: 85 },
    { name: 'Justice Sen', Cases: 120, Disposed: 104 },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Registry Analytics & Reports
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Statistical distributions of monthly filings, benched clearance rate ratios.</p>
        </div>
      </div>

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* AREA CHART: FILING GROWTH */}
        <div className="lg:col-span-2 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-150/40">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">Monthly filings vs. disposal curves</h3>
            <span className="text-[10px] font-bold text-slate-400">Past 6 months</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filingTimelineData}>
                <defs>
                  <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDisposed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend fontSize={10} />
                <Area type="monotone" dataKey="Filed" stroke="#6366f1" fillOpacity={1} fill="url(#colorFiled)" strokeWidth={2} />
                <Area type="monotone" dataKey="Disposed" stroke="#10b981" fillOpacity={1} fill="url(#colorDisposed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIDE REPORT COMPILER */}
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 pb-2 border-b border-slate-150/40">Audit Analytics Summary</h3>
            <p className="text-xs text-slate-455 leading-relaxed font-semibold">
              The digital e-Committee directs quarterly clearance updates. Use the shortcut below to export active lawsuit registries, judge load balances, and closed case tallies.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => toast.success('Report snapshot PDF compiled successfully!')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export PDF Registrar Summary
            </button>
          </div>
        </div>

        {/* BAR CHART: JUDGE DISPOSAL RATES */}
        <div className="lg:col-span-3 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-150/40">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">Judicial Officers Disposal performance load</h3>
            <span className="text-[10px] font-bold text-slate-400">Active Bench counts</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={judgeClearenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Cases" fill="#3b82f6" name="Assigned Cases" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Disposed" fill="#10b981" name="Resolved Cases" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
