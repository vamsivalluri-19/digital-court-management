import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Gavel, FileText, CheckCircle2, Calendar, ShieldAlert, Award, Clock } from 'lucide-react';
import api from '../services/api';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/cases?search=${searchQuery}`);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* PUBLIC HEADER */}
      <header className="glass-nav sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              CourtConnect
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              Supreme Court E-Committee Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Sign In
          </Link>
          <Link
            to="/login?tab=register"
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            File New Case
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 md:py-32 px-6 overflow-hidden grid-bg">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30 uppercase tracking-widest">
            Ministry of Law & Justice Initiative
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Transparent, Digital & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">
              Accessible Legal Justice
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            CourtConnect eliminates paperwork, streamlines scheduling, and enables virtual hearings. Log in to file petitions, register evidence, e-sign documents, and query the AI Legal Assistant.
          </p>

          {/* PUBLIC CASE SEARCH */}
          <div className="max-w-2xl mx-auto pt-6">
            <form onSubmit={handleSearch} className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-none">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search case status by Case Number (e.g. CC-2026-10001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-sm font-semibold outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* BACKGROUND DECORATIVE GLOWS */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -z-10 w-[400px] h-[400px] rounded-full bg-indigo-400/10 blur-[80px]" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 -z-10 w-[300px] h-[300px] rounded-full bg-blue-400/10 blur-[80px]" />
      </section>

      {/* SEARCH RESULTS BOARD */}
      {searchResults && (
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="glass-panel rounded-3xl p-6 md:p-8 border bg-white/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50 mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Public Inquiry Case Lookup
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Found {searchResults.length} case records
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400 font-semibold">Searching court registries...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <ShieldAlert className="w-12 h-12 mx-auto text-rose-500 mb-3" />
                <p className="text-sm font-bold">No active public records matching "{searchQuery}"</p>
                <p className="text-xs mt-1">Verify the Case Number format e.g. CC-YEAR-SEQUENCE</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((item) => (
                  <div
                    key={item._id}
                    className="p-5 border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-500/30 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 uppercase">
                          {item.caseNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {item.type}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Petitioner: {item.petitioner?.name || 'Private Citizen'} | Respondent: {item.respondentName}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                          item.status === 'closed'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Filed: {new Date(item.filingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to="/login"
                        className="px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-600/30 rounded-xl hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-950/20 transition"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CORE METRICS AND STATS */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Cases Registered', count: '14,200+', icon: FileText, color: 'text-indigo-500' },
          { label: 'Disposal Rate', count: '92.4%', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Daily Virtual Hearings', count: '320+', icon: Calendar, color: 'text-blue-500' },
          { label: 'Advocates Registered', count: '5,800+', icon: Award, color: 'text-orange-500' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-5 border text-center flex flex-col items-center">
              <div className={`p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stat.count}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-8 text-center text-xs text-slate-400 font-semibold">
        <p>© 2026 CourtConnect – Ministry of Law and Justice. All Rights Reserved.</p>
        <p className="mt-1 text-[10px] text-slate-500">Designed under Digital India E-Committee Initiatives.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
