import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Calendar,
  User,
  Clock,
  Sparkles,
  MessageSquare,
  Upload,
  PenTool,
  FileBadge,
  Send,
  Video,
  ExternalLink,
  BookOpen,
  Gavel,
} from 'lucide-react';

const CaseDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  // Data States
  const [caseDetails, setCaseDetails] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'details' | 'documents' | 'chat' | 'ai'
  const [activeTab, setActiveTab] = useState('details');

  // AI Assistant States
  const [aiSummary, setAiSummary] = useState('');
  const [relatedCases, setRelatedCases] = useState([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Chat States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Upload States
  const [uploadFile, setUploadFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('evidence');
  const [uploading, setUploading] = useState(false);

  // Hearing Scheduling States
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [hearingDate, setHearingDate] = useState('');
  const [hearingTime, setHearingTime] = useState('');
  const [courtroom, setCourtroom] = useState('');
  const [hearingPurpose, setHearingPurpose] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const fetchCaseData = async () => {
    try {
      const res = await api.get(`/cases/${id}`);
      if (res.data.success) {
        setCaseDetails(res.data.data.caseDetails);
        setHearings(res.data.data.hearings);
        setDocuments(res.data.data.documents);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading case records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  // Socket.IO Room setup for chat
  useEffect(() => {
    if (!caseDetails || !user) return;

    socketRef.current = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    
    // Join room
    socketRef.current.emit('join_case', id);

    // Gracefully handle socket connection errors (e.g., server offline during startup)
    socketRef.current.on('connect_error', (err) => {
      console.log('Socket.IO connection deferred: server offline.');
    });

    // Fetch initial chat logs from API
    const fetchChatLogs = async () => {
      try {
        const res = await api.get(`/chat/${id}`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChatLogs();

    // Listen for incoming messages
    socketRef.current.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for real-time case data updates
    socketRef.current.on('case_data_updated', () => {
      fetchCaseData();
      toast.success('Case records updated in real-time.', { icon: '🔄' });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_case', id);
        socketRef.current.disconnect();
      }
    };
  }, [caseDetails, user, id]);

  // Scroll chat to bottom when message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    // Emit event
    socketRef.current.emit('send_message', {
      caseId: id,
      senderId: user.id,
      text: newMessage,
    });
    setNewMessage('');
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('caseId', id);
    formData.append('name', docName || uploadFile.name);
    formData.append('type', docType);
    formData.append('file', uploadFile);

    try {
      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Document uploaded to case vault!');
        setUploadFile(null);
        setDocName('');
        fetchCaseData(); // reload
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSignDocument = async (docId) => {
    if (!user.signature) {
      toast.error('Draw/Register your Digital Signature in Profile Settings first!');
      return;
    }

    try {
      const res = await api.post(`/documents/${docId}/sign`, {
        signatureDataUrl: user.signature,
      });
      if (res.data.success) {
        toast.success('Document signed successfully!');
        fetchCaseData(); // reload
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error signing document');
    }
  };

  // AI Assistant triggers
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    try {
      const res = await api.post(`/cases/${id}/ai`, {});
      if (res.data.success) {
        setAiSummary(res.data.data.summary);
        setRelatedCases(res.data.data.relatedCases);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI summary compile error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userQ = aiQuery;
    setAiChat((prev) => [...prev, { role: 'user', text: userQ }]);
    setAiQuery('');
    setAiLoading(true);

    try {
      const res = await api.post(`/cases/${id}/ai`, { query: userQ });
      if (res.data.success) {
        setAiChat((prev) => [...prev, { role: 'ai', text: res.data.data.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptCase = async () => {
    try {
      const res = await api.put(`/cases/${id}/accept-lawyer`, {});
      if (res.data.success) {
        toast.success('You have successfully accepted to represent this client!');
        fetchCaseData(); // Reload case details
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error accepting case representation');
    }
  };

  const handleFileCaseToJudge = async () => {
    try {
      const res = await api.put(`/cases/${id}/file-to-judge`, {});
      if (res.data.success) {
        toast.success('You have successfully filed this case to the judge!');
        fetchCaseData(); // Reload case details
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error filing case to judge.');
    }
  };

  const handleAcceptHearing = async (hearingId) => {
    try {
      const res = await api.put(`/hearings/${hearingId}/accept`, {});
      if (res.data.success) {
        toast.success('You have successfully accepted the scheduled hearing details!');
        fetchCaseData(); // Reload case details
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error accepting hearing details.');
    }
  };

  const handleAcceptJudge = async () => {
    try {
      const res = await api.put(`/cases/${id}/accept-judge`, {});
      if (res.data.success) {
        toast.success('You have successfully accepted to preside over this case!');
        fetchCaseData(); // Reload case details
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error accepting case jurisdiction');
    }
  };

  const handleScheduleHearing = async (e) => {
    e.preventDefault();
    if (!hearingDate || !hearingTime || !courtroom || !hearingPurpose) {
      toast.error('Please fill in all scheduling fields.');
      return;
    }

    setScheduling(true);
    try {
      const res = await api.post('/hearings', {
        caseId: id,
        hearingDate,
        hearingTime,
        courtroom,
        purpose: hearingPurpose,
      });

      if (res.data.success) {
        toast.success('Hearing trial has been scheduled!');
        setScheduleModalOpen(false);
        setHearingDate('');
        setHearingTime('');
        setCourtroom('');
        setHearingPurpose('');
        fetchCaseData(); // reload
        if (socketRef.current) {
          socketRef.current.emit('update_case_data', { caseId: id });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error scheduling trial.');
    } finally {
      setScheduling(false);
    }
  };

  if (loading || !caseDetails) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // QR Code details link representation
  const verificationUrl = `${window.location.origin}/verify/case/${caseDetails._id}`;

  return (
    <div className="space-y-8">
      {/* HEADER META CARD */}
      <div className="glass-panel border rounded-3xl p-6 md:p-8 bg-white/60 dark:bg-slate-900/60 flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm rounded-lg uppercase border border-indigo-200/50">
              {caseDetails.caseNumber}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 capitalize">
              {caseDetails.type} Case
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
            {caseDetails.title}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-2xl leading-relaxed font-semibold">
            {caseDetails.description}
          </p>
        </div>

        {/* QR CODE AND STATUS */}
        <div className="flex md:flex-col justify-between items-end gap-4 min-w-[120px] self-start md:self-auto border-t md:border-t-0 pt-4 md:pt-0">
          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
              {caseDetails.status.replace('_', ' ')}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Priority: {caseDetails.priority}</p>
          </div>
          
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
            <QRCodeSVG value={verificationUrl} size={64} />
            <span className="text-[8px] font-bold text-slate-400 mt-1">Registry QR Verified</span>
          </div>
        </div>
      </div>

      {/* BENCH ASSIGNMENT SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Petitioner / Client', name: caseDetails.petitioner?.name || 'Vikas Sharma', contact: caseDetails.petitioner?.email },
          { label: 'Assigned Advocate', name: caseDetails.assignedLawyer?.name || 'Unassigned Counsel', contact: caseDetails.assignedLawyer?.email },
          { label: 'Assigned Judicial Bench', name: caseDetails.assignedJudge?.name || 'Awaiting Allocation', contact: caseDetails.assignedJudge?.courtroom },
        ].map((item, idx) => (
          <div key={idx} className="glass-card border rounded-2xl p-4 flex gap-3 items-center">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase text-slate-400">{item.label}</p>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</h4>
              <p className="text-[10px] text-slate-400 truncate">{item.contact}</p>
            </div>
          </div>
        ))}
      </div>

      {/* NAV TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {[
          { id: 'details', label: 'Hearings & Timelines' },
          { id: 'documents', label: 'Secure Document Vault' },
          { id: 'chat', label: 'Discussion Room' },
          { id: 'ai', label: 'AI Legal Chamber' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-bold transition border-b-2 relative -mb-[2px] ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="min-h-96">
        {/* DETAILS: HEARINGS TIMELINE */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                Hearing Logs & Case Timeline
              </h3>
              
              {hearings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No hearings recorded for this lawsuit docket.</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-indigo-100 dark:border-indigo-950 space-y-8">
                  {hearings.map((h) => {
                    const hasPassed = new Date(h.hearingDate) < new Date();
                    return (
                      <div key={h._id} className="relative">
                        {/* Dot indicator */}
                        <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                          h.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`} />

                        <div className="space-y-1.5">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h4 className="text-xs font-extrabold uppercase text-indigo-500 flex items-center gap-1.5">
                              {h.status === 'completed' ? 'Hearing Transacted' : 'Hearing Scheduled'}
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">{h.status}</span>
                            </h4>
                            <span className="text-xs text-slate-400 font-bold">{new Date(h.hearingDate).toLocaleDateString()} at {h.hearingTime}</span>
                          </div>
                          
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{h.purpose}</p>
                          <p className="text-[11.5px] text-indigo-650 dark:text-indigo-405 font-bold">Courtroom: {h.courtroom}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{h.remarks || 'No registrar outcomes compiled yet.'}</p>
                          
                          {/* Join Video & Confirm buttons for upcoming trials */}
                          {h.status === 'upcoming' && (
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <Link
                                to={`/hearings/${h._id}/room`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-sm"
                              >
                                <Video className="w-3.5 h-3.5" /> Join Virtual Courtroom
                              </Link>
                              
                              {h.citizenAccepted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                                  ✓ Details Confirmed by Petitioner
                                </span>
                              ) : (
                                user?.role === 'citizen' && (
                                  <button
                                    onClick={() => handleAcceptHearing(h._id)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg shadow-sm transition"
                                  >
                                    Accept Hearing Schedule & Location
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTION CARD */}
            <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">Docket Administration</h4>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed font-semibold">
                  This dossier is registered with Supreme Court digital committees. Audit logging is active. Only assigned advocates and benched justices are authorized to append files or digitally stamp orders.
                </p>
              </div>
              <div className="space-y-3">
                {user?.role === 'lawyer' && !caseDetails.assignedLawyer && (
                  <button
                    onClick={handleAcceptCase}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <PenTool className="w-4.5 h-4.5" /> Represent Client (Accept Case)
                  </button>
                )}

                {user?.role === 'lawyer' && 
                 (caseDetails.assignedLawyer?._id === user.id || caseDetails.assignedLawyer === user.id) && 
                 caseDetails.status === 'filed' && (
                  <button
                    onClick={handleFileCaseToJudge}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <FileText className="w-4 h-4" /> File Case to Judge
                  </button>
                )}

                {user?.role === 'judge' && !caseDetails.assignedJudge && (
                  <button
                    onClick={handleAcceptJudge}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <Gavel className="w-4.5 h-4.5" /> Preside Over Case (Accept Bench)
                  </button>
                )}
                
                {/* Upload allowed if citizen, or lawyer representing the case */}
                {(user?.role === 'citizen' || (user?.role === 'lawyer' && (caseDetails.assignedLawyer?._id === user.id || caseDetails.assignedLawyer === user.id))) && (
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <Upload className="w-4 h-4" /> Upload Evidence Brief
                  </button>
                )}

                {/* Schedule trial allowed if judge or admin */}
                {(user?.role === 'judge' || user?.role === 'admin') && (
                  <button
                    onClick={() => setScheduleModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <Calendar className="w-4 h-4" /> Schedule Trial Hearing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SECURE DOCUMENT VAULT */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* DOCUMENTS TABLE */}
            <div className="lg:col-span-2 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                Evidentiary Files & Affidavits
              </h3>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No documents deposited in this vault.</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => {
                    const hasSigned = doc.signatures.some((sig) => sig.userId?._id === user.id);
                    return (
                      <div
                        key={doc._id}
                        className="p-4 border border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-950/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-500/20 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                              {doc.type}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">v{doc.version}.0</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{doc.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Uploaded by {doc.uploadedBy?.name} ({doc.uploadedBy?.role})
                          </p>

                          {/* SIGNATURE TAGS */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {doc.signatures.map((sig, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <PenTool className="w-2.5 h-2.5" /> Signed by {sig.userId?.name.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          {/* Sign Option (Judge or Lawyer) */}
                          {(user.role === 'judge' || user.role === 'lawyer') && !hasSigned && (
                            <button
                              onClick={() => handleSignDocument(doc._id)}
                              className="px-3.5 py-2 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 text-[10px] font-bold rounded-xl flex items-center gap-1 transition"
                            >
                              <PenTool className="w-3.5 h-3.5" /> E-Sign
                            </button>
                          )}
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-100 hover:bg-indigo-500 hover:text-white dark:bg-slate-800 rounded-xl transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* UPLOAD EVIDENCE BLOCK */}
            <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">Deposit Evidence Document</h4>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">File Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-250 outline-none"
                  >
                    <option value="petition">Petition Brief</option>
                    <option value="evidence">Exhibits / Evidence</option>
                    <option value="fir">FIR Copy</option>
                    <option value="identity_proof">Identity Proof</option>
                    <option value="affidavit">Signed Affidavit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Document Custom Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Statement Affidavit"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Attach Document (PDF/PNG/JPEG)</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> {uploading ? 'Depositing file...' : 'Submit to Vault'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: ROOM CHAT */}
        {activeTab === 'chat' && (
          <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 max-w-4xl mx-auto flex flex-col h-[500px] justify-between animate-in fade-in duration-200">
            {/* MESSAGES HEADER */}
            <div className="pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Case Room Communication Room
              </h3>
              <p className="text-[10px] text-slate-400">Secure conversation logs for petitioner counsel, advocates, and administrators.</p>
            </div>

            {/* CHAT MESSAGES PORT */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  No messages exchanged. Initiate discussion.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === user.id;
                  return (
                    <div key={msg._id || Math.random()} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-bold text-slate-400 px-1 mb-1">
                        {msg.sender?.name} ({msg.sender?.role})
                      </span>
                      <div className={`p-3 rounded-2xl max-w-sm text-xs font-semibold leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-250 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* MESSAGE ENTRY BAR */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
              <input
                type="text"
                placeholder="Type your secure case query here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-600/10 hover:scale-105 active:scale-95 transition-all"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        )}

        {/* TAB: AI LEGAL ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* AI CHAT INTERACTION PANEL */}
            <div className="lg:col-span-2 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 flex flex-col h-[500px] justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800/50 mb-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                    AI Legal FAQ Bot
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">e-Court AI Engine</span>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1">
                  {aiChat.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-20 font-semibold">
                      Ask a legal question: e.g. "when are hearing dates scheduled?", "how do I sign documents?"
                    </p>
                  ) : (
                    aiChat.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-extrabold text-slate-400 mb-1">
                          {msg.role === 'user' ? 'You' : 'CourtConnect AI'}
                        </span>
                        <div className={`p-3 rounded-2xl max-w-sm text-xs font-semibold leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-slate-700 text-white rounded-tr-none'
                            : 'bg-indigo-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-indigo-100 dark:border-transparent'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-75" />
                      Evaluating Indian Jurisprudence...
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleAskAI} className="flex gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                <input
                  type="text"
                  placeholder="Ask the FAQ assistant..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* CASE SUMMARY COMPILER */}
            <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 pb-3 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Summarize Briefs
                </h4>
                
                {aiSummary ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-transparent rounded-2xl p-4 text-[11px] leading-relaxed text-slate-655 dark:text-slate-300 font-semibold">
                      {aiSummary}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        Relevant Case Citations
                      </h5>
                      {relatedCases.map((rc, idx) => (
                        <div key={idx} className="p-2.5 border border-slate-200/50 dark:border-slate-800/50 rounded-xl space-y-1 bg-white/50 dark:bg-slate-950/20">
                          <h6 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{rc.citation}</h6>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">{rc.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Click compiling below to analyze the petitioner's descriptions under IPC laws and suggest supreme court case citations.
                  </p>
                )}
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" /> Compile AI Brief Summary
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE HEARING MODAL */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Trial Hearing</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Define the courtroom, date, time, and bench purpose to record a new scheduled trial hearing for case {caseDetails.caseNumber}.
            </p>
            
            <form onSubmit={handleScheduleHearing} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Hearing Date</label>
                  <input
                    type="date"
                    required
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Hearing Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    value={hearingTime}
                    onChange={(e) => setHearingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Assigned Courtroom</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courtroom 3A (High Court)"
                  value={courtroom}
                  onChange={(e) => setCourtroom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Trial Purpose</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the objective of this hearing, e.g. admission of affidavits, cross examination..."
                  value={hearingPurpose}
                  onChange={(e) => setHearingPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-850 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Trial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;
