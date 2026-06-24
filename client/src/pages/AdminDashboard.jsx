import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, FileText, Inbox, Clock, ShieldAlert, Award, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f97316', '#a855f7', '#ec4899'];

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [unassignedCases, setUnassignedCases] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [metricsRes, casesRes, usersRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/cases'),
        api.get('/admin/users?role=judge'),
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (casesRes.data.success) {
        // Filter cases that have no judge assigned
        const unassigned = casesRes.data.data.filter((c) => !c.assignedJudge);
        setUnassignedCases(unassigned);
      }
      if (usersRes.data.success) setJudges(usersRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching admin details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignJudge = async (caseId, judgeId) => {
    if (!judgeId) return;
    try {
      const res = await api.put(`/cases/${caseId}/assign`, { judgeId });
      if (res.data.success) {
        toast.success('Judge assigned successfully!');
        fetchData(); // Refetch
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign judge.');
    }
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { cards, distributions } = metrics;

  // Prepare chart datasets
  const barChartData = distributions.types.map((t) => ({
    name: t._id.toUpperCase(),
    Count: t.count,
  }));

  const pieChartData = distributions.statuses.map((s) => ({
    name: s._id.replace('_', ' ').toUpperCase(),
    value: s.count,
  }));

  return (
    <div className="space-y-8">
      {/* ADMIN INTRO */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Control Registrar</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          System wide e-governance statistics, security metrics, and judge docket assignment tools.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Registrations', count: cards.totalUsers, icon: Users, color: 'from-blue-500 to-indigo-500' },
          { label: 'Total Filings', count: cards.totalCases, icon: FileText, color: 'from-indigo-500 to-purple-500' },
          { label: 'Judges Docket', count: cards.totalJudges, icon: Award, color: 'from-emerald-500 to-teal-500' },
          { label: 'Today\'s Hearings', count: cards.todaysHearingsCount, icon: Clock, color: 'from-orange-500 to-red-500' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card border rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-400">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{card.count}</h3>
              </div>
              <div className={`p-2.5 bg-gradient-to-br ${card.color} text-white rounded-xl`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CASE TYPE DISTRIBUTION */}
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lawsuit Types Distribution</h3>
          <div className="h-64">
            {barChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Bar dataKey="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CASE STATUS DISTRIBUTION */}
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lawsuit Status Overview</h3>
          <div className="h-64 flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No data available</p>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs">
                  {pieChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                      <span className="text-slate-800 dark:text-slate-200">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CASE ASSIGNMENT LIST */}
      <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
        <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-250">Cases Awaiting Judge Assignment</h3>
          <p className="text-xs text-slate-400 mt-0.5">Newly registered citizen/lawyer petitions requiring judicial bench allocations.</p>
        </div>

        {unassignedCases.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto text-emerald-500/80 mb-2" />
            <p className="text-sm font-semibold">All case files assigned. Registry complete.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3">Case ID</th>
                  <th className="pb-3">Petition Name</th>
                  <th className="pb-3">Filing Date</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3 text-right">Assign Bench</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                {unassignedCases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                    <td className="py-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">
                        {c.caseNumber}
                      </span>
                    </td>
                    <td className="py-4 py-3 max-w-[200px] truncate">{c.title}</td>
                    <td className="py-4 py-3">{new Date(c.filingDate).toLocaleDateString()}</td>
                    <td className="py-4 py-3 capitalize">{c.type}</td>
                    <td className="py-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        c.priority === 'high' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : 'bg-slate-100 dark:bg-slate-850'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-4 py-3 text-right">
                      <select
                        onChange={(e) => handleAssignJudge(c._id, e.target.value)}
                        defaultValue=""
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none"
                      >
                        <option value="" disabled>Assign Judge...</option>
                        {judges.map((j) => (
                          <option key={j._id} value={j._id}>{j.name} ({j.courtroom})</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
