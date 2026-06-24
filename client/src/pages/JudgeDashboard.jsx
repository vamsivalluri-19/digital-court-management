import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Gavel, Calendar, Inbox, Clock, ChevronRight, CheckSquare, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const JudgeDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignedCases = cases.filter(
    (c) => c.assignedJudge && (c.assignedJudge._id === user.id || c.assignedJudge === user.id)
  );

  const unassignedCases = cases.filter((c) => !c.assignedJudge);

  const todaysHearings = hearings.filter((h) => {
    const hDate = new Date(h.hearingDate);
    hDate.setHours(0, 0, 0, 0);
    return hDate.getTime() === today.getTime();
  });

  const pendingJudgments = assignedCases.filter(
    (c) => c.status === 'in_progress' || c.status === 'hearing_scheduled'
  );

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
      {/* JUDGE WELCOME BANNER */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-600 to-indigo-750 dark:from-indigo-950 dark:to-slate-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black">Judge Chamber</h2>
          <p className="text-xs text-indigo-100 font-semibold max-w-md leading-relaxed">
            Review petitions, oversee courtroom trial calendars, and digitally compile final judgments.
          </p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Assigned Docket', count: assignedCases.length, icon: Gavel, color: 'from-blue-500 to-indigo-500 shadow-blue-500/10' },
          { label: 'Today\'s Hearings', count: todaysHearings.length, icon: Clock, color: 'from-indigo-500 to-purple-500 shadow-indigo-500/10' },
          { label: 'Pending Judgments', count: pendingJudgments.length, icon: CheckSquare, color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10' },
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

      {/* SUB PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TODAY'S TRIAL CALENDAR */}
        <div className="lg:col-span-2 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Today's Court Calendar</h3>
            <span className="text-xs font-bold text-slate-400">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          {todaysHearings.length === 0 ? (
            <div className="text-center py-12 text-slate-455">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No hearings scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysHearings.map((hear) => (
                <div
                  key={hear._id}
                  className="p-4 border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-950/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-500/20 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-500">{hear.hearingTime}</span>
                      <span className="text-[10px] font-bold text-slate-400">{hear.caseId?.caseNumber}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{hear.caseId?.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Petitioner: {hear.caseId?.petitioner?.name} | Courtroom: {hear.courtroom}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                      to={`/cases/${hear.caseId?._id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Conduct Hearing
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENDING JUDGMENTS BOARD */}
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Pending Judgments</h3>
            <span className="text-xs font-bold text-slate-400">{pendingJudgments.length} Cases</span>
          </div>

          {pendingJudgments.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center font-medium">All cases resolved in docket!</p>
          ) : (
            <div className="space-y-4">
              {pendingJudgments.slice(0, 4).map((item) => (
                <div key={item._id} className="p-3.5 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400">{item.caseNumber}</span>
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase">{item.priority}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[9px] font-bold text-slate-400 capitalize">{item.type}</span>
                    <Link to={`/cases/${item._id}`} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
                      Open briefs <ChevronRight className="w-3 h-3" />
                    </Link>
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
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Pending Court Petitions (Unassigned)</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Dossiers waiting for a presiding Justice to accept the bench.</p>
          </div>
          <span className="text-xs font-bold text-indigo-500">{unassignedCases.length} Available</span>
        </div>

        {unassignedCases.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center font-medium">No pending unassigned petitions in registry.</p>
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
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-1">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Petitioner: {item.petitioner?.name || 'Citizen'}</p>
                </div>
                <Link
                  to={`/cases/${item._id}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition whitespace-nowrap"
                >
                  Accept Bench
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeDashboard;
