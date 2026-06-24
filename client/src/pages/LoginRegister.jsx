import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Gavel, Mail, Lock, User, Phone, BookOpen, Building, ArrowRight } from 'lucide-react';

const LoginRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Tab State
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('citizen');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [courtroom, setCourtroom] = useState('');

  // Password Recovery
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  useEffect(() => {
    // If URL contains tab=register, switch tab
    if (searchParams.get('tab') === 'register') {
      setIsLoginTab(false);
    }
    // If expired prompt in url
    if (searchParams.get('expired') === 'true') {
      toast.error('Session expired. Please log in again.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoginTab) {
      // LOGIN
      dispatch(loginStart());
      try {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
          dispatch(loginSuccess({ token: res.data.token, user: res.data.user }));
          toast.success(`Welcome back, ${res.data.user.name}!`);
          navigate('/dashboard');
        }
      } catch (err) {
        dispatch(loginFailure());
        toast.error(err.response?.data?.message || 'Login failed. Verify credentials.');
      }
    } else {
      // REGISTER
      try {
        const body = {
          name,
          email,
          password,
          role,
          phoneNumber,
          barNumber: role === 'lawyer' ? barNumber : undefined,
          courtroom: role === 'judge' ? courtroom : undefined,
        };

        const res = await api.post('/auth/register', body);
        if (res.data.success) {
          dispatch(loginSuccess({ token: res.data.token, user: res.data.user }));
          if (role === 'citizen') {
            toast.success('Citizen account registered & verified!');
          } else {
            toast.success('Registration filed! Please verify your email mock link.');
          }
          navigate('/dashboard');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed.');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) return;

    try {
      const res = await api.post('/auth/forgotpassword', { email: recoveryEmail });
      if (res.data.success) {
        toast.success('Password recovery link logged/dispatched successfully!');
        setForgotPasswordModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Toaster />

      {/* LEFT DESIGN SIDEBAR */}
      <div className="w-full md:w-5/12 bg-indigo-600 dark:bg-indigo-950 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/20 blur-[60px]" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Gavel className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">CourtConnect</h1>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
              Smart Case Management System
            </p>
          </div>
        </div>

        <div className="space-y-4 my-16 md:my-0 relative z-10 max-w-sm">
          <h2 className="text-3xl font-extrabold leading-tight">
            Connecting citizens, lawyers & judges securely.
          </h2>
          <p className="text-xs text-indigo-100/80 leading-relaxed font-semibold">
            An advanced e-governance platform to manage legal hearings, upload digital affidavits, audit security logs, and generate real-time case analytics.
          </p>
        </div>

        <div className="text-[10px] text-indigo-300 font-medium relative z-10">
          Designed in compliance with Supreme Court Committee Standards.
        </div>
      </div>

      {/* RIGHT AUTH FORM */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16 grid-bg">
        <div className="w-full max-w-md glass-panel border bg-white/60 dark:bg-slate-900/60 p-8 rounded-3xl shadow-2xl relative">
          
          {/* TAB HEADERS */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setIsLoginTab(true)}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
                isLoginTab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginTab(false)}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
                !isLoginTab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* REGISTER FIELDS */}
            {!isLoginTab && (
              <div className="space-y-4">
                {/* NAME */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">Full Legal Name</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <User className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikas Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* ROLE */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">Register As</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="citizen">Citizen / Petitioner</option>
                    <option value="lawyer">Lawyer / Advocate</option>
                    <option value="judge">Judge</option>
                    <option value="admin">Court Administrator</option>
                  </select>
                </div>

                {/* PHONE */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">Phone Number</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* DYNAMIC ROLE FIELDS */}
                {role === 'lawyer' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-[11px] font-extrabold uppercase text-slate-400">Advocate Bar Association Number</label>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. BAR/DL/2018/893"
                        value={barNumber}
                        onChange={(e) => setBarNumber(e.target.value)}
                        className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}

                {role === 'judge' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-[11px] font-extrabold uppercase text-slate-400">Assigned Courtroom</label>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <Building className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Courtroom 3A (High Court)"
                        value={courtroom}
                        onChange={(e) => setCourtroom(e.target.value)}
                        className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-400">Email Address</label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. email@courtconnect.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-extrabold uppercase text-slate-400">Password</label>
                {isLoginTab && (
                  <button
                    type="button"
                    onClick={() => setForgotPasswordModal(true)}
                    className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-600/10 hover:scale-[1.01] active:scale-95 transition-all"
            >
              <span>{isLoginTab ? 'Sign In Securely' : 'Submit Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recover Password</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Enter your registered email address below, and we will dispatch a password recovery link.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                required
                placeholder="e.g. email@courtconnect.gov.in"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setForgotPasswordModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 rounded-lg"
                >
                  Dispatch Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginRegister;
