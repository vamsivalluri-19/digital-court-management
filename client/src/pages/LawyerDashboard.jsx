import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { FileText, Calendar, Users, ChevronRight, Gavel, FolderMinus, MessageSquare } from 'lucide-react';

const LawyerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, hearingsRes] = await Promise.all([
          api.get('/cases'),
          api.get('/hearings'),
        ]);

        if (casesRes.data.success) setCases(casesRes.data.data);
        if (hearingsRes.data.success) setHearings(hearingsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const assignedCases = cases.filter(
    (c) => c.assignedLawyer && (c.assignedLawyer._id === user.id || c.assignedLawyer === user.id)
  );

  const unassignedCases = cases.filter((c) => !c.assignedLawyer);

  const activeCases = assignedCases.filter((c) => c.status !== 'closed');
  const upcomingHearings = hearings.filter((h) => h.status === 'upcoming');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-600 to-indigo-750 dark:from-indigo-950 dark:to-slate-900 rounded-3xl text-white shadow-xl shadow-indigo-650/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black">Advocate Panel</h2>
          <p className="text-xs text-indigo-100 font-semibold max-w-md leading-relaxed">
            Manage your legal clients, file new petitions, upload court evidence folders, and track hearing schedules.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/cases/new"
            className="px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-2xl shadow-lg transition text-xs"
          >
            File Client Case
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Assigned Cases', count: assignedCases.length, icon: Gavel, color: 'from-blue-500 to-indigo-500 shadow-blue-500/10' },
          { label: 'Active Trials', count: activeCases.length, icon: FileText, color: 'from-indigo-500 to-purple-500 shadow-indigo-500/10' },
          { label: 'Upcoming Calendars', count: upcomingHearings.length, icon: Calendar, color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card border rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-400">{card.label}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{card.count}</h3>
              </div>
              <div className={`p-3 bg-gradient-to-br ${card.color} text-white rounded-xl shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* LOWER PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ASSIGNED CLIENT CASES */}
        <div className="lg:col-span-2 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Active Client Lawsuits</h3>
            <Link to="/cases" className="text-xs font-bold text-indigo-500 hover:underline">View All</Link>
          </div>

          {assignedCases.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FolderMinus className="w-12 h-12 mx-auto text-slate-355 mb-2" />
              <p className="text-sm font-semibold">No assigned cases found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedCases.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="p-4 border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-950/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-500/20 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                        {item.caseNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 capitalize">{item.type}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Petitioner: {item.petitioner?.name} | Respondent: {item.respondentName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      item.priority === 'high'
                        ? 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-955/20'
                        : 'bg-slate-100 text-slate-600 border-transparent dark:bg-slate-800'
                    }`}>
                      {item.priority}
                    </span>
                    <Link
                      to={`/cases/${item._id}`}
                      className="p-1.5 bg-slate-100 hover:bg-indigo-500 hover:text-white dark:bg-slate-800 rounded-xl transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING HEARINGS PANEL */}
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Scheduled Hearings</h3>
            <Link to="/hearings" className="text-xs font-bold text-indigo-500 hover:underline">Calendar</Link>
          </div>

          {upcomingHearings.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center font-medium">No trials scheduled in registry.</p>
          ) : (
            <div className="space-y-4">
              {upcomingHearings.slice(0, 4).map((hear) => (
                <div key={hear._id} className="p-3.5 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-500">{hear.hearingTime}</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(hear.hearingDate).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{hear.caseId?.title}</h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>{hear.courtroom}</span>
                    <Link to={`/cases/${hear.caseId?._id}`} className="text-indigo-500 hover:underline">Details</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* UNASSIGNED CASES SECTION */}
      <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Pending Petitions (Unassigned Lawyers)</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Lawsuits where citizens have requested legal representation.</p>
          </div>
          <span className="text-xs font-bold text-indigo-500">{unassignedCases.length} Available</span>
        </div>

        {unassignedCases.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center font-medium">No pending unassigned cases in registry.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unassignedCases.map((item) => (
              <div
                key={item._id}
                className="p-4 border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-950/20 rounded-2xl flex justify-between items-center gap-3 hover:border-indigo-500/20 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                      {item.caseNumber}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{item.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Petitioner: {item.petitioner?.name || 'Citizen'}</p>
                </div>
                <Link
                  to={`/cases/${item._id}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition whitespace-nowrap"
                >
                  Accept Case
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LawyerDashboard;
