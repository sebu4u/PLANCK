'use client';

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav";
import { Pencil, Settings, Lock, Shield, Trophy, Gift, GraduationCap, Copy, Check, CreditCard, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserBadges } from "@/components/user-badges";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { PrivacySettings } from "@/components/privacy-settings";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { getRankIconPath } from "@/lib/rank-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getNextRankThreshold } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Skeleton components for profile page
const ProfileSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-32 w-32 rounded-full bg-[#f1f1f1]" />
      <Skeleton className="h-6 w-32 bg-[#f1f1f1]" />
      <Skeleton className="h-4 w-48 bg-[#f1f1f1]" />
      <Skeleton className="h-20 w-full rounded-2xl bg-[#f1f1f1]" />
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-64 w-full rounded-3xl bg-[#f1f1f1]" />
    <Skeleton className="h-64 w-full rounded-3xl bg-[#f1f1f1]" />
  </div>
);

const ProfilPage = () => {
  const { user, loading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
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
  const [contestRegistration, setContestRegistration] = useState<{
    contest_code: string;
    full_name: string;
    school: string;
    grade: string;
    registered_at: string;
  } | null>(null);
  const [contestLoading, setContestLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Get rank color
  const getRankColor = (rankName: string) => {
    if (rankName?.includes('Bronze')) return 'text-amber-700';
    if (rankName?.includes('Silver')) return 'text-gray-600';
    if (rankName?.includes('Gold')) return 'text-yellow-600';
    if (rankName?.includes('Platinum')) return 'text-cyan-600';
    if (rankName?.includes('Diamond')) return 'text-blue-600';
    if (rankName?.includes('Masters')) return 'text-purple-600';
    if (rankName?.includes('Ascendant')) return 'text-indigo-600';
    if (rankName?.includes('Singularity')) return 'text-pink-600';
    return 'text-gray-600';
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
      const { error: streakRpcError } = await supabase.rpc('check_and_reset_streak_if_needed', {
        user_uuid: user.id,
      })
      if (streakRpcError) {
        console.warn('Streak reset check failed:', streakRpcError.message)
      }
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

  // Fetch contest registration status
  useEffect(() => {
    if (!user) return;
    const fetchContestStatus = async () => {
      setContestLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          setContestLoading(false);
          return;
        }

        const response = await fetch('/api/contest/status', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const data = await response.json();
        if (data.registered && data.registration) {
          setContestRegistration(data.registration);
        }
      } catch (error) {
        console.error('Error fetching contest status:', error);
      } finally {
        setContestLoading(false);
      }
    };
    fetchContestStatus();
  }, [user]);

  const copyContestCode = () => {
    if (contestRegistration?.contest_code) {
      navigator.clipboard.writeText(contestRegistration.contest_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast({ title: 'Cod copiat!' });
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)]">
        <Navigation />
        <main className={cn("pt-16 px-4 md:px-6 lg:px-8 md:pt-24", MOBILE_BOTTOM_NAV_PADDING_CLASS, "burger:pb-12")}>
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  const nextRankInfo = userStats ? getNextRankThreshold(userStats.elo) : { nextRank: 'Bronze II', threshold: 650, progress: 0 };
  const rankIconPath = userStats ? getRankIconPath(userStats.rank) : getRankIconPath("Bronze");
  const rankColor = userStats ? getRankColor(userStats.rank) : 'text-gray-400';

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)]">
        <Navigation />
        <main className={cn("pt-16 px-4 md:px-6 lg:px-8 md:pt-24", MOBILE_BOTTOM_NAV_PADDING_CLASS, "burger:pb-12")}>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#111111]">Profil</h1>
              <p className="text-[#6d6d6d]">Gestionează-ți profilul și setările</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side - Profile Info */}
              <div className="lg:col-span-1">
                <div className="rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-colors hover:border-[#d4d4d4]">
                  {profileLoading ? (
                    <ProfileSkeleton />
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      {/* Avatar with Rank Badge */}
                      <div className="relative group">
                        <div className="relative">
                          <Avatar className="h-32 w-32 border-4 border-white shadow-lg shadow-black/10">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={profile?.name || user.email} />
                            ) : (
                              <AvatarFallback className="bg-[#f1f1f1] text-4xl text-[#191919]">
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
                            <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-lg shadow-black/10">
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
                        <label className="absolute bottom-0 left-1/2 translate-y-8 -translate-x-1/2 transform cursor-pointer rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-semibold text-[#191919] shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all hover:bg-[#f7f7f7]">
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
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f7f7f]">Username</label>
                          {nicknameEdit ? (
                            <div className="flex flex-col gap-2">
                              <input
                                className="w-full rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-2 px-3 text-[#191919] focus:border-[#bdbdbd] focus:outline-none"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                maxLength={32}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleNicknameSave} disabled={saving} className="flex-1 rounded-full bg-[#111111] text-white hover:bg-[#2a2a2a]">
                                  Salvează
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setNicknameEdit(false)} className="flex-1 rounded-full border-[#e5e5e5] bg-white text-[#444444] hover:bg-[#f7f7f7]">
                                  Anulează
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3 transition-all hover:border-[#d4d4d4]">
                              <span className="font-medium text-[#191919]">
                                {nickname || <span className="italic text-[#8a8a8a]">Adaugă un username...</span>}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-[#707070] hover:bg-[#eeeeee] hover:text-[#191919]"
                                onClick={() => setNicknameEdit(true)}
                              >
                                <Pencil size={16} />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div className="w-full">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f7f7f]">Nume</label>
                          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3">
                            <span className="font-medium text-[#191919]">
                              {profile?.name || user.email}
                            </span>
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="w-full">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f7f7f]">Bio</label>
                          {bioEdit ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                className="min-h-[80px] w-full rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3 text-[#191919] focus:border-[#bdbdbd] focus:outline-none"
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                maxLength={300}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleBioSave} disabled={saving} className="flex-1 rounded-full bg-[#111111] text-white hover:bg-[#2a2a2a]">
                                  Salvează
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setBioEdit(false)} className="flex-1 rounded-full border-[#e5e5e5] bg-white text-[#444444] hover:bg-[#f7f7f7]">
                                  Anulează
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3 transition-all hover:border-[#d4d4d4]">
                              <div className="flex items-start justify-between gap-2">
                                <span className="flex-1 text-sm text-[#666666]">
                                  {bio || <span className="italic text-[#8a8a8a]">Adaugă un bio...</span>}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-[#707070] hover:bg-[#eeeeee] hover:text-[#191919]"
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
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f7f7f]">Rank</label>
                            <div className="flex items-center justify-between rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#e5e5e5] bg-white">
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
                                  <p className="text-xs text-[#7f7f7f]">Current Rank</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Settings Buttons */}
                        <div className="w-full mt-4 space-y-3">
                          <Button
                            onClick={() => router.push('/profil/referral')}
                            className="w-full rounded-full border-none bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/40"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Invită prieteni & primește Plus+
                          </Button>
                          <Button
                            onClick={() => setShowChangePasswordModal(true)}
                            className="w-full rounded-full border-[#e5e5e5] bg-white text-[#191919] hover:bg-[#f7f7f7]"
                            variant="outline"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Schimbă parola
                          </Button>
                          <Button
                            onClick={() => setShowPrivacyModal(true)}
                            className="w-full rounded-full border-[#e5e5e5] bg-white text-[#191919] hover:bg-[#f7f7f7]"
                            variant="outline"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Setări confidențialitate
                          </Button>
                          <Button
                            onClick={() => router.push("/pricing")}
                            className="w-full rounded-full border-[#e5e5e5] bg-white text-[#191919] hover:bg-[#f7f7f7]"
                            variant="outline"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Abonament
                          </Button>
                          <Button
                            onClick={async () => {
                              await logout()
                              toast({ title: "Te-ai delogat cu succes!" })
                              router.push("/")
                            }}
                            className="w-full rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                            variant="outline"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
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
                      <div className="rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-colors hover:border-[#d4d4d4]">
                        <h3 className="mb-6 text-lg font-semibold text-[#191919]">Rank & ELO</h3>

                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#e5e5e5] bg-[#fafafa]">
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
                              <p className="text-sm text-[#7f7f7f]">Current Rank</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              <p className="text-4xl font-bold text-[#191919]">{userStats.elo}</p>
                            </div>
                            <p className="mt-1 text-xs text-[#7f7f7f]">ELO Rating</p>
                          </div>
                        </div>

                        {/* Progress to Next Rank */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-[#666666]">Progress to {nextRankInfo.nextRank}</p>
                            <p className="text-sm text-[#7f7f7f]">+{nextRankInfo.threshold - userStats.elo} ELO needed</p>
                          </div>
                          <Progress
                            value={nextRankInfo.progress}
                            className="h-2 bg-[#eeeeee]"
                            indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                          />
                          <p className="mt-1 text-xs text-[#8a8a8a]">{Math.round(nextRankInfo.progress)}% complete</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3 text-center">
                            <p className="text-xs text-[#7f7f7f]">Total Solved</p>
                            <p className="text-lg font-semibold text-[#191919]">{userStats.problems_solved_total || 0}</p>
                          </div>
                          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3 text-center">
                            <p className="text-xs text-[#7f7f7f]">Current Streak</p>
                            <p className="text-lg font-semibold text-[#191919]">{userStats.current_streak || 0}🔥</p>
                          </div>
                          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-3 text-center">
                            <p className="text-xs text-[#7f7f7f]">Best Streak</p>
                            <p className="text-lg font-semibold text-[#191919]">{userStats.best_streak || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contest Registration Card */}
                    {!contestLoading && (
                      <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-colors hover:border-orange-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100">
                            <GraduationCap className="w-5 h-5 text-orange-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-[#191919]">Concursul PLANCK 2026</h3>
                        </div>

                        {contestRegistration ? (
                          <div className="space-y-4">
                            {/* Contest Code Display */}
                            <div className="rounded-2xl border border-orange-200 bg-white p-4">
                              <p className="mb-2 text-xs font-medium text-orange-700">Codul tău de concurs:</p>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-2xl font-bold tracking-wider text-[#191919]">
                                  {contestRegistration.contest_code}
                                </span>
                                <button
                                  onClick={copyContestCode}
                                  className="rounded-xl bg-[#f7f7f7] p-2 transition-colors hover:bg-[#eeeeee]"
                                >
                                  {codeCopied ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-[#707070]" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Registration Details */}
                            <div className="space-y-1 text-sm text-[#666666]">
                              <p><span className="text-[#8a8a8a]">Clasă:</span> a {contestRegistration.grade}-a</p>
                              <p><span className="text-[#8a8a8a]">Școală:</span> {contestRegistration.school}</p>
                            </div>

                            <p className="text-xs text-orange-700">
                              Folosește acest cod pentru a accesa subiectele în ziua concursului.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="mb-4 text-[#666666]">Nu ești încă înscris la concurs.</p>
                            <Button
                              onClick={() => router.push('/concurs/inscriere')}
                              className="rounded-full bg-gradient-to-r from-orange-500 to-orange-400 font-medium text-white hover:from-orange-600 hover:to-orange-500"
                            >
                              Înscrie-te acum
                            </Button>
                          </div>
                        )}
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
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl border border-[#e5e5e5] bg-white text-[#191919] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#191919]">Setări Confidențialitate</DialogTitle>
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
