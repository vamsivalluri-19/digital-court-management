import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileSuccess } from '../redux/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Phone, BookOpen, Building, Palette, Save, Trash } from 'lucide-react';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Form Fields
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [barNumber, setBarNumber] = useState(user?.barNumber || '');
  const [courtroom, setCourtroom] = useState(user?.courtroom || '');

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState(user?.signature || '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setBarNumber(user.barNumber || '');
      setCourtroom(user.courtroom || '');
      setSavedSignature(user.signature || '');
    }
  }, [user]);

  // Canvas drawing listeners
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Support mouse and touch events
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#4f46e5'; // Indigo stroke
    ctx.lineWidth = 2.5;
    ctx.stroke();
    setHasDrawing(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    let finalSignature = savedSignature;

    if (hasDrawing) {
      const canvas = canvasRef.current;
      finalSignature = canvas.toDataURL('image/png');
    }

    try {
      const res = await api.put('/auth/profile', {
        name,
        phoneNumber,
        barNumber: user.role === 'lawyer' ? barNumber : undefined,
        courtroom: user.role === 'judge' ? courtroom : undefined,
        signature: finalSignature,
      });

      if (res.data.success) {
        dispatch(updateProfileSuccess(res.data.data));
        setSavedSignature(finalSignature);
        setHasDrawing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Account Profile Settings
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Maintain your legal identity information and cryptographic signature.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT PROFILE CARD */}
        <div className="glass-panel border rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 bg-white/40 dark:bg-slate-900/40">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/20">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-semibold">{user?.email}</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
            {user?.role}
          </span>
        </div>

        {/* RIGHT INPUT PANEL */}
        <div className="md:col-span-2 glass-panel border rounded-3xl p-6 md:p-8 space-y-6 bg-white/60 dark:bg-slate-900/60">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NAME */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-slate-400">Full Name</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-250"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-slate-400">Phone Number</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-250"
                  />
                </div>
              </div>

              {/* DYNAMIC ROLE CARD */}
              {user?.role === 'lawyer' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">Bar Association Number</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-250"
                    />
                  </div>
                </div>
              )}

              {user?.role === 'judge' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">Assigned Courtroom</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Building className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={courtroom}
                      onChange={(e) => setCourtroom(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-250"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DIGITAL E-SIGNATURE REGISTER */}
            {(user?.role === 'lawyer' || user?.role === 'judge') && (
              <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    Draw E-Signature Stamp
                  </label>
                  {hasDrawing && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <Trash className="w-3 h-3" /> Clear Pad
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* CANVAS PAD */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative h-40">
                    <canvas
                      ref={canvasRef}
                      width={350}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-full cursor-crosshair touch-none"
                    />
                  </div>

                  {/* DISPLAY PREVIEW */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 h-40">
                    {savedSignature ? (
                      <div className="text-center">
                        <img
                          src={savedSignature}
                          alt="Registered Signature Preview"
                          className="max-h-24 object-contain bg-white rounded-lg p-2 border border-slate-100 shadow-sm"
                        />
                        <p className="text-[10px] text-emerald-500 font-bold mt-2">Registered Cryptographic Stamp</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center font-semibold leading-relaxed">
                        Draw your signature inside the left canvas pad, then click Save Profile.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SAVE ACTION */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/10 transition"
            >
              <Save className="w-4 h-4" />
              <span>Update Profile & Settings</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
