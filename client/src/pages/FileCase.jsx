import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Save, ArrowLeft, Upload, AlertCircle } from 'lucide-react';

const FileCase = () => {
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('civil');
  const [priority, setPriority] = useState('medium');
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [description, setDescription] = useState('');
  const [petitionFile, setPetitionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!petitionFile) {
      toast.error('Please attach the initial Petition document.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Case
      const caseRes = await api.post('/cases', {
        title,
        type,
        priority,
        respondentName,
        respondentEmail,
        description,
      });

      if (caseRes.data.success) {
        const caseId = caseRes.data.data._id;
        
        // 2. Upload Petition Document
        const formData = new FormData();
        formData.append('caseId', caseId);
        formData.append('name', 'Initial_Petition_Complaint.pdf');
        formData.append('type', 'petition');
        formData.append('file', petitionFile);

        const docRes = await api.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (docRes.data.success) {
          toast.success('Dossier and petition registered successfully!');
          navigate(`/cases/${caseId}`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error filing case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-850 dark:text-slate-100">File New Case dossier</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Submit legal grievance petitions to court registry.</p>
        </div>
      </div>

      <div className="glass-panel border rounded-3xl p-6 md:p-8 bg-white/60 dark:bg-slate-900/60">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* TITLE */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Case Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikas Sharma vs. Rohan Mehra Land Dispute"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            {/* JURISDICTION TYPE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Jurisdiction Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-250 outline-none"
              >
                <option value="civil">Civil Cases</option>
                <option value="criminal">Criminal Cases</option>
                <option value="family">Family Cases</option>
                <option value="property">Property Cases</option>
                <option value="cyber_crime">Cyber Crime Cases</option>
                <option value="consumer">Consumer Cases</option>
              </select>
            </div>

            {/* PRIORITY */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Priority Evaluation</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-250 outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority / Urgent</option>
              </select>
            </div>

            {/* RESPONDENT NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Respondent Legal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Mehra"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            {/* RESPONDENT EMAIL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Respondent Contact Email</label>
              <input
                type="email"
                required
                placeholder="e.g. rohan.mehra@gmail.com"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Petition Brief Details</label>
              <textarea
                required
                rows={5}
                placeholder="Describe the legal grievances, chronology of incidents, and desired reliefs from the court..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-850 dark:text-slate-100 outline-none"
              />
            </div>

            {/* FILE ATTACHMENT */}
            <div className="space-y-1.5 sm:col-span-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                <Upload className="w-4 h-4 text-indigo-500" />
                Upload Petition Brief (PDF format required)
              </label>
              <input
                type="file"
                required
                accept=".pdf"
                onChange={(e) => setPetitionFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
              />
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Files are secured under cryptographic registry hashes. Max limit 10MB.</span>
              </div>
            </div>

          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Registering legal dossier...' : 'Submit Lawsuit Petition'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default FileCase;
