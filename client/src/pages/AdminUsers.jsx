import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, UserCheck, ShieldAlert, CheckCircle, Search } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching user logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleApprove = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/approve`);
      if (res.data.success) {
        toast.success('User credentials approved and verified successfully!');
        fetchUsers(); // reload list
      }
    } catch (err) {
      console.error(err);
      toast.error('Error approving user credentials.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 font-outfit">User Registries & Approvals</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Approve incoming advocates and judicial officers, examine bar profiles.</p>
      </div>

      {/* FILTER HEADER */}
      <div className="glass-panel border rounded-3xl p-5 bg-white/60 dark:bg-slate-900/60 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or Email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold w-full outline-none text-slate-800 dark:text-slate-200"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">
            Search
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-250 outline-none"
        >
          <option value="">All Roles</option>
          <option value="citizen">Citizen</option>
          <option value="lawyer">Advocate</option>
          <option value="judge">Judge</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {/* USERS DOCKET TABLE */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold">No users matching filter parameters.</p>
        </div>
      ) : (
        <div className="glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="text-slate-450 border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Verification Details</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {users.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                  <td className="py-4 py-3 font-bold">{item.name}</td>
                  <td className="py-4 py-3">{item.email}</td>
                  <td className="py-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400">
                      {item.role}
                    </span>
                  </td>
                  <td className="py-4 py-3 text-slate-400">
                    {item.role === 'lawyer' && <span>Bar No: {item.barNumber || 'N/A'}</span>}
                    {item.role === 'judge' && <span>Bench: {item.courtroom || 'N/A'}</span>}
                    {item.role === 'citizen' && <span>Verified Citizen</span>}
                    {item.role === 'admin' && <span>Master Controller</span>}
                  </td>
                  <td className="py-4 py-3">
                    {item.isVerified ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> Pending approval
                      </span>
                    )}
                  </td>
                  <td className="py-4 py-3 text-right">
                    {!item.isVerified && (
                      <button
                        onClick={() => handleApprove(item._id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 ml-auto"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
