'use client';

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Pencil, Settings, Lock, Shield, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserBadges } from "@/components/user-badges";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { PrivacySettings } from "@/components/privacy-settings";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getNextRankThreshold } from "@/lib/dashboard-data";

// Skeleton components for profile page
const ProfileSkeleton = () => (
  <div className="rounded-xl bg-[#131316] border border-white/10 p-6 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="w-32 h-32 rounded-full bg-white/5" />
      <Skeleton className="w-32 h-6 bg-white/5" />
      <Skeleton className="w-48 h-4 bg-white/5" />
      <Skeleton className="w-full h-20 bg-white/5 rounded-lg" />
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="w-full h-64 rounded-xl bg-[#131316]" />
    <Skeleton className="w-full h-64 rounded-xl bg-[#131316]" />
  </div>
);

const ProfilPage = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [bioEdit, setBioEdit] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Get rank icon path
  const getRankIconPath = (rankName: string): string => {
    const rankLower = rankName?.toLowerCase() || '';
    if (rankLower.includes('bronze')) return '/ranks/bronze.png';
    if (rankLower.includes('silver')) return '/ranks/silver.png';
    if (rankLower.includes('gold')) return '/ranks/gold.png';
    if (rankLower.includes('platinum')) return '/ranks/platinum.png';
    if (rankLower.includes('diamond')) return '/ranks/diamond.png';
    if (rankLower.includes('masters')) return '/ranks/masters.png';
    if (rankLower.includes('ascendant')) return '/ranks/ascendant.png';
    if (rankLower.includes('singularity')) return '/ranks/singularity.png';
    return '/ranks/bronze.png';
  };

  // Get rank color
  const getRankColor = (rankName: string) => {
    if (rankName?.includes('Bronze')) return 'text-amber-700';
    if (rankName?.includes('Silver')) return 'text-gray-400';
    if (rankName?.includes('Gold')) return 'text-yellow-400';
    if (rankName?.includes('Platinum')) return 'text-cyan-400';
    if (rankName?.includes('Diamond')) return 'text-blue-400';
    if (rankName?.includes('Masters')) return 'text-purple-400';
    if (rankName?.includes('Ascendant')) return 'text-indigo-400';
    if (rankName?.includes('Singularity')) return 'text-pink-400';
    return 'text-gray-400';
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("name, bio, user_icon, nickname")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setBio(data.bio || "");
        if (data.user_icon) {
          setAvatarUrl(`${data.user_icon}?t=${Date.now()}`);
        } else {
          setAvatarUrl("");
        }
        setNickname(data.nickname || "");
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUserStats = async () => {
      setStatsLoading(true);
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserStats(data);
      } else {
        // Default stats if not found
        setUserStats({
          elo: 500,
          rank: 'Bronze I',
          current_streak: 0,
          best_streak: 0,
          problems_solved_total: 0,
        });
      }
      setStatsLoading(false);
    };
    fetchUserStats();
  }, [user]);

  const handleBioSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ bio }).eq("user_id", user.id);
    setBioEdit(false);
    setSaving(false);
    toast({ title: 'Bio actualizat cu succes!' });
  };

  const handleNicknameSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ nickname }).eq("user_id", user.id);
    setNicknameEdit(false);
    setSaving(false);
    toast({ title: 'Username actualizat cu succes!' });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        toast({ title: 'Eroare la upload imagine', description: uploadError.message, variant: 'destructive' });
        setUploadingAvatar(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      let publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        toast({ title: 'Nu s-a putut obține URL-ul public pentru imagine.', variant: 'destructive' });
        setUploadingAvatar(false);
        return;
      }
      await supabase.from('profiles').update({ user_icon: publicUrl }).eq('user_id', user.id);
      const { data } = await supabase
        .from("profiles")
        .select("name, bio, user_icon, nickname")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const cacheBustedUrl = data.user_icon ? `${data.user_icon}?t=${Date.now()}` : '';
        setProfile(data);
        setAvatarUrl(cacheBustedUrl);
        toast({ title: 'Poza de profil a fost actualizată!' });
      }
    } catch (err: any) {
      toast({ title: 'Eroare la upload imagine', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0D0D0F]">
        <Navigation />
        <main className="pt-24 px-4 md:px-6 lg:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ProfileSkeleton />
              </div>
              <div className="lg:col-span-2">
                <StatsSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const nextRankInfo = userStats ? getNextRankThreshold(userStats.elo) : { nextRank: 'Bronze II', threshold: 600, progress: 0 };
  const rankIconPath = userStats ? getRankIconPath(userStats.rank) : '/ranks/bronze.png';
  const rankColor = userStats ? getRankColor(userStats.rank) : 'text-gray-400';

  return (
    <>
      <div className="min-h-screen bg-[#0D0D0F]">
        <Navigation />
        <main className="pt-24 px-4 md:px-6 lg:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white/90 mb-2">Profil</h1>
              <p className="text-white/60">Gestionează-ți profilul și setările</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side - Profile Info */}
              <div className="lg:col-span-1">
                <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-colors">
                  {profileLoading ? (
                    <ProfileSkeleton />
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      {/* Avatar with Rank Badge */}
                      <div className="relative group">
                        <div className="relative">
                          <Avatar className="w-32 h-32 shadow-lg border-4 border-white/10">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={profile?.name || user.email} />
                            ) : (
                              <AvatarFallback className="bg-white/5 text-white/90 text-4xl">
                                {(profile?.name || user.email || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {uploadingAvatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
                              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                            </div>
                          )}
                          {/* Rank Badge Overlay */}
                          {userStats && (
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-[#0D0D0F] border-2 border-white/20 flex items-center justify-center overflow-hidden">
                              <Image
                                src={rankIconPath}
                                alt={userStats.rank}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-sm font-medium shadow cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                            disabled={uploadingAvatar}
                          />
                          Schimbă Avatar
                        </label>
                      </div>

                      {/* User Info */}
                      <div className="flex flex-col items-center gap-4 w-full mt-8">
                        {/* Username */}
                        <div className="w-full">
                          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">Username</label>
                          {nicknameEdit ? (
                            <div className="flex flex-col gap-2">
                              <input
                                className="w-full border border-white/10 rounded-lg p-2 px-3 bg-white/5 text-white/90 focus:outline-none focus:border-white/30"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                maxLength={32}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleNicknameSave} disabled={saving} className="flex-1 bg-white/10 hover:bg-white/20">
                                  Salvează
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setNicknameEdit(false)} className="flex-1 border-white/10 hover:bg-white/5">
                                  Anulează
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                              <span className="text-white/90 font-medium">
                                {nickname || <span className="italic text-white/40">Adaugă un username...</span>}
                              </span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-white/60 hover:text-white/90 hover:bg-white/10" 
                                onClick={() => setNicknameEdit(true)}
                              >
                                <Pencil size={16} />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div className="w-full">
                          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">Nume</label>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-white/90 font-medium">
                              {profile?.name || user.email}
                            </span>
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="w-full">
                          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">Bio</label>
                          {bioEdit ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                className="w-full border border-white/10 rounded-lg p-3 bg-white/5 text-white/90 min-h-[80px] focus:outline-none focus:border-white/30"
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                maxLength={300}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleBioSave} disabled={saving} className="flex-1 bg-white/10 hover:bg-white/20">
                                  Salvează
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setBioEdit(false)} className="flex-1 border-white/10 hover:bg-white/5">
                                  Anulează
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-white/70 text-sm flex-1">
                                  {bio || <span className="italic text-white/40">Adaugă un bio...</span>}
                                </span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-white/60 hover:text-white/90 hover:bg-white/10" 
                                  onClick={() => setBioEdit(true)}
                                >
                                  <Pencil size={16} />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Rank Display */}
                        {userStats && (
                          <div className="w-full mt-2">
                            <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">Rank</label>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                                  <Image
                                    src={rankIconPath}
                                    alt={userStats.rank}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                  />
                                </div>
                                <div>
                                  <h4 className={`text-lg font-bold ${rankColor}`}>{userStats.rank}</h4>
                                  <p className="text-xs text-white/60">Current Rank</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Settings Buttons */}
                        <div className="w-full mt-4 space-y-3">
                          <Button 
                            onClick={() => setShowChangePasswordModal(true)} 
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            variant="outline"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Schimbă parola
                          </Button>
                          <Button 
                            onClick={() => setShowPrivacyModal(true)} 
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            variant="outline"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Setări confidențialitate
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Statistics */}
              <div className="lg:col-span-2 space-y-6">
                {statsLoading ? (
                  <StatsSkeleton />
                ) : (
                  <>
                    {/* Rank & ELO Card */}
                    {userStats && (
                      <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-colors">
                        <h3 className="text-lg font-semibold text-white/90 mb-6">Rank & ELO</h3>

                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                              <Image
                                src={rankIconPath}
                                alt={userStats.rank}
                                width={64}
                                height={64}
                                className="object-contain"
                              />
                            </div>
                            <div>
                              <h4 className={`text-2xl font-bold ${rankColor}`}>{userStats.rank}</h4>
                              <p className="text-sm text-white/60">Current Rank</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              <p className="text-4xl font-bold text-white/90">{userStats.elo}</p>
                            </div>
                            <p className="text-xs text-white/60 mt-1">ELO Rating</p>
                          </div>
                        </div>

                        {/* Progress to Next Rank */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-white/70">Progress to {nextRankInfo.nextRank}</p>
                            <p className="text-sm text-white/60">+{nextRankInfo.threshold - userStats.elo} ELO needed</p>
                          </div>
                          <Progress 
                            value={nextRankInfo.progress} 
                            className="h-2 bg-white/5"
                            indicatorClassName="bg-white"
                          />
                          <p className="text-xs text-white/50 mt-1">{Math.round(nextRankInfo.progress)}% complete</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                          <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                            <p className="text-xs text-white/60">Total Solved</p>
                            <p className="text-lg font-semibold text-white/90">{userStats.problems_solved_total || 0}</p>
                          </div>
                          <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                            <p className="text-xs text-white/60">Current Streak</p>
                            <p className="text-lg font-semibold text-white/90">{userStats.current_streak || 0}🔥</p>
                          </div>
                          <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                            <p className="text-xs text-white/60">Best Streak</p>
                            <p className="text-lg font-semibold text-white/90">{userStats.best_streak || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Badges Card */}
                    <UserBadges />
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Privacy Settings Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#131316] border border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white/90">Setări Confidențialitate</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <PrivacySettings />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilPage;
