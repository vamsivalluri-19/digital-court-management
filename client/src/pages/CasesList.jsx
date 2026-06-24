import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, Gavel, Calendar, Inbox, ChevronRight, X } from 'lucide-react';

const CasesList = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);
      if (priority) queryParams.append('priority', priority);

      const res = await api.get(`/cases?${queryParams.toString()}`);
      if (res.data.success) {
        setCases(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching cases list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [type, status, priority]); // Auto-fetch on drop-down changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCases();
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
    setPriority('');
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Lawsuit Registries</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Browse active or closed legal case dossiers.</p>
        </div>
        <Link
          to="/cases/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-xl text-xs transition"
        >
          File Petition
        </Link>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass-panel border rounded-3xl p-5 bg-white/60 dark:bg-slate-900/60 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Search className="w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Case Number, Title, or Respondent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Search Registries
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/30 dark:border-slate-800/20">
          <div className="flex flex-wrap gap-3">
            {/* TYPE FILTER */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
            >
              <option value="">All Case Types</option>
              <option value="civil">Civil Cases</option>
              <option value="criminal">Criminal Cases</option>
              <option value="family">Family Cases</option>
              <option value="property">Property Cases</option>
              <option value="cyber_crime">Cyber Crime Cases</option>
              <option value="consumer">Consumer Cases</option>
            </select>

            {/* STATUS FILTER */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="filed">Filed</option>
              <option value="under_review">Under Review</option>
              <option value="hearing_scheduled">Hearing Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="judgment_issued">Judgment Issued</option>
              <option value="closed">Closed</option>
            </select>

            {/* PRIORITY FILTER */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
            >
              <option value="">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-[11px] font-extrabold uppercase text-slate-400 hover:text-rose-500 transition"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        </div>
      </div>

      {/* CASES DISPLAY CONTAINER */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="glass-panel border rounded-3xl p-12 text-center text-slate-400 bg-white/40 dark:bg-slate-900/40">
          <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold">No dossiers match search query registry filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((item) => (
            <div
              key={item._id}
              className="glass-card border rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-extrabold text-[10px] uppercase border border-indigo-150/40">
                    {item.caseNumber}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 capitalize">{item.type}</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-semibold">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-semibold">
                  <span>Filed: {new Date(item.filingDate).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    item.status === 'closed' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-850'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <Link
                    to={`/cases/${item._id}`}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-500 hover:text-white dark:bg-slate-800 rounded-xl transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CasesList;
