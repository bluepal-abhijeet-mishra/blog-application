import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../api/services/userService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth(); // login to update local storage if needed

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  });

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || ''
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      
      // Update AuthContext user to sync with Navbar
      const updatedUser = { ...user, displayName: updatedProfile.displayName, avatarUrl: updatedProfile.avatarUrl };
      updateUser(updatedUser);
      
      toast.success('Profile updated successfully.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12 lg:p-16">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Profile Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-12">Manage your public identity and personal information.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
              <div className="relative group">
                <div className="size-32 rounded-[40px] overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-500">
                  <img
                    src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName)}&background=10b981&color=fff&bold=true&size=128`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 size-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </div>
              </div>

              <div className="flex-1 space-y-6 w-full">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                    placeholder="E.g. John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={profile?.email}
                    disabled
                    className="w-full h-14 px-6 bg-slate-100 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                  />
                  <p className="mt-2 text-[10px] text-slate-400 italic ml-1">Email is managed by your authentication provider.</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 md:p-10"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Short Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full h-32 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none resize-none"
                  placeholder="Tell the network about yourself..."
                  maxLength={255}
                />
                <div className="flex justify-end mt-1 text-[10px] font-bold text-slate-400">
                  {formData.bio.length}/255
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between gap-4 pt-4"
          >
            <div className="text-[10px] font-bold text-slate-400 italic uppercase tracking-wider">
              Member since {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-12 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {updateMutation.isPending ? 'Syncing...' : 'Save Updates'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
