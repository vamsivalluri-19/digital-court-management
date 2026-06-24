import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Inbox, Video, ChevronRight } from 'lucide-react';

const HearingsCalendar = () => {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  const fetchHearings = async () => {
    setLoading(true);
    try {
      const url = dateFilter ? `/hearings?date=${dateFilter}` : '/hearings';
      const res = await api.get(url);
      if (res.data.success) {
        setHearings(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching hearing schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, [dateFilter]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Hearing Calendars</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Observe scheduled trials, virtual court briefs, and courtroom allocations.</p>
        </div>

        {/* DATE SELECT FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Select Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-250 outline-none"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[10px] font-bold text-rose-500 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* SCHEDULED TRIAL TIMELINE LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hearings.length === 0 ? (
        <div className="glass-panel border rounded-3xl p-12 text-center text-slate-400 bg-white/40 dark:bg-slate-900/40">
          <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold">No hearings scheduled on these registry configurations.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {hearings.map((h) => {
            const hDate = new Date(h.hearingDate);
            const isToday = new Date().toDateString() === hDate.toDateString();
            
            return (
              <div
                key={h._id}
                className={`glass-panel border rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-4 transition-all duration-200 ${
                  isToday
                    ? 'border-indigo-500/50 bg-indigo-50/20 shadow-md shadow-indigo-500/5'
                    : 'bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-800'
                }`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-extrabold text-[10px] uppercase">
                      {h.caseId?.caseNumber}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{h.caseId?.type} Juris</span>
                    
                    {isToday && (
                      <span className="text-[9px] font-black uppercase text-indigo-650 bg-indigo-100 px-2 py-0.5 rounded animate-pulse">
                        Today's Agenda
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{h.caseId?.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Trial Purpose: {h.purpose}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {h.hearingTime}
                    </span>
                    <span>Courtroom: {h.courtroom}</span>
                    <span>Judge Bench: {h.judge?.name}</span>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/50">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                    h.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-500 border-emerald-100'
                      : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-955/20'
                  }`}>
                    {h.status}
                  </span>

                  <div className="flex gap-2">
                    {h.status === 'upcoming' && (
                      <Link
                        to={`/hearings/${h._id}/room`}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl shadow-md flex items-center gap-1 transition"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Room
                      </Link>
                    )}
                    <Link
                      to={`/cases/${h.caseId?._id}`}
                      className="p-2 bg-slate-100 hover:bg-indigo-500 hover:text-white dark:bg-slate-800 rounded-xl transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HearingsCalendar;
