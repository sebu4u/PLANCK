'use client';

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Pencil, Lock, Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserBadges } from "@/components/user-badges";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton components for profile page
const ProfileHeaderSkeleton = () => (
  <div className="flex flex-col items-center gap-4 pb-6 pt-8">
    <div className="relative">
      <Skeleton className="w-28 h-28 rounded-full" />
      <Skeleton className="absolute bottom-2 right-2 w-16 h-6 rounded-full" />
    </div>
    <div className="flex flex-col items-center gap-3 w-full">
      <Skeleton className="w-20 h-3 rounded" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-32 h-6 rounded" />
        <Skeleton className="w-6 h-6 rounded" />
      </div>
      <Skeleton className="w-16 h-3 rounded" />
      <Skeleton className="w-48 h-7 rounded" />
    </div>
    <div className="w-full flex flex-col items-center">
      <Skeleton className="w-64 h-20 rounded-md" />
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <div className="mt-4">
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="w-16 h-8 rounded-md" />
      ))}
    </div>
  </div>
);

const BadgesSkeleton = () => (
  <div className="mt-4">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="w-24 h-4 rounded mb-2" />
            <Skeleton className="w-32 h-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsSkeleton = () => (
  <div className="mt-4">
    <div className="flex items-center justify-between rounded-lg border p-4">
      <Skeleton className="w-32 h-4 rounded" />
      <Skeleton className="w-32 h-10 rounded" />
    </div>
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState<any[]>([]);
  const [problemsOpen, setProblemsOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [solvedProblemsLoading, setSolvedProblemsLoading] = useState(true);

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
    const fetchSolvedCount = async () => {
      const { count } = await supabase
        .from('solved_problems')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setSolvedCount(count || 0);
    };
    fetchSolvedCount();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchSolvedProblems = async () => {
      setSolvedProblemsLoading(true);
      // 1. Ia toate problem_id rezolvate de user
      const { data: solved, error: solvedError } = await supabase
        .from("solved_problems")
        .select("problem_id, solved_at")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false });
      if (!solved || solved.length === 0) {
        setSolvedProblems([]);
        setSolvedProblemsLoading(false);
        return;
      }
      // 2. Ia titlurile problemelor
      const problemIds = solved.map((s: any) => s.problem_id);
      const { data: problems, error: problemsError } = await supabase
        .from("problems")
        .select("id, title")
        .in("id", problemIds);
      if (!problems) {
        setSolvedProblems([]);
        setSolvedProblemsLoading(false);
        return;
      }
      // 3. Asociază solved cu titlurile
      const problemsMap = Object.fromEntries(problems.map((p: any) => [p.id, p.title]));
      const solvedWithTitles = solved.map((s: any) => ({
        id: s.problem_id,
        title: problemsMap[s.problem_id] || "(Fără titlu)",
        solved_at: s.solved_at,
      }));
      setSolvedProblems(solvedWithTitles);
      setSolvedProblemsLoading(false);
    };
    fetchSolvedProblems();
  }, [user]);

  const handleBioSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ bio }).eq("user_id", user.id);
    setBioEdit(false);
    setSaving(false);
  };

  const handleNicknameSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ nickname }).eq("user_id", user.id);
    setNicknameEdit(false);
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setUploadingAvatar(true);
    try {
      // 1. Upload imagine în Supabase Storage
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
      // 2. Obține URL public
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      let publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        toast({ title: 'Nu s-a putut obține URL-ul public pentru imagine.', variant: 'destructive' });
        setUploadingAvatar(false);
        return;
      }
      // 3. Salvează URL-ul în profiles
      await supabase.from('profiles').update({ user_icon: publicUrl }).eq('user_id', user.id);
      // 4. Re-fetch profile to get latest avatar (in case of CDN cache)
      const { data, error } = await supabase
        .from("profiles")
        .select("name, bio, user_icon, nickname")
        .eq("user_id", user.id)
        .single();
      if (data) {
        // Add cache-busting param to avatar URL
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
      <main className="relative min-h-screen flex flex-col items-center overflow-visible cosmic-bg pt-24 md:pt-32">
        <Navigation />
        <section className="relative z-10 w-full max-w-3xl px-4 py-10 flex flex-col items-center animate-fade-in-up">
          <Card className="w-full bg-white/80 dark:bg-zinc-900/70 backdrop-blur-lg border border-zinc-200/40 dark:border-zinc-800/60 shadow-xl flex flex-col min-h-[85vh] md:min-h-[70vh]">
            <ProfileHeaderSkeleton />
            <CardContent className="pt-0">
              <Tabs defaultValue="activity" className="w-full mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="activity">Activitate</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="settings">Setari</TabsTrigger>
                </TabsList>
                <TabsContent value="activity" className="mt-4">
                  <ActivitySkeleton />
                </TabsContent>
                <TabsContent value="badges" className="mt-4">
                  <BadgesSkeleton />
                </TabsContent>
                <TabsContent value="settings" className="mt-4">
                  <SettingsSkeleton />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="relative min-h-screen flex flex-col items-center overflow-visible cosmic-bg pt-24 md:pt-32">
        <Navigation />
        <section className="relative z-10 w-full max-w-3xl px-4 py-10 flex flex-col items-center animate-fade-in-up">
          <Card className="w-full bg-white/80 dark:bg-zinc-900/70 backdrop-blur-lg border border-zinc-200/40 dark:border-zinc-800/60 shadow-xl flex flex-col min-h-[85vh] md:min-h-[70vh]">
          <CardHeader className="flex flex-col items-center gap-4 pb-6 pt-8">
            {profileLoading ? (
              <ProfileHeaderSkeleton />
            ) : (
              <>
                <div className="relative group">
                  <Avatar className="w-28 h-28 shadow-lg border-4 border-white/80 dark:border-zinc-800/80 transition-transform duration-300 group-hover:scale-105">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={profile?.name || user.email} />
                    ) : (
                      <AvatarFallback>
                        {(profile?.name || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-zinc-900/60 rounded-full z-10">
                      <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 bg-gradient-to-tr from-purple-600 via-pink-400 to-fuchsia-500 text-white rounded-full px-3 py-1 text-xs font-medium shadow cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                    />
                    Schimbă
                  </label>
                </div>
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Username</div>
                  <div className="flex items-center gap-2">
                    {nicknameEdit ? (
                      <>
                        <input
                          className="border rounded p-1 px-2 text-base mr-2 bg-white/80 dark:bg-zinc-800/80"
                          value={nickname}
                          onChange={e => setNickname(e.target.value)}
                          maxLength={32}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleNicknameSave} disabled={saving}>
                          Salvează
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setNicknameEdit(false)}>
                          Anulează
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {nickname || <span className="italic text-gray-400">Adaugă un nickname...</span>}
                        </span>
                        <Button size="icon" variant="ghost" className="ml-1 p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200" onClick={() => setNicknameEdit(true)} aria-label="Editează nickname">
                          <Pencil size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Nume</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white text-center">
                    {profile?.name || user.email}
                  </div>
                </div>
                <div className="w-full flex flex-col items-center">
                  {bioEdit ? (
                    <div className="flex flex-col items-center gap-2 mt-2 w-full">
                      <textarea
                        className="border rounded p-2 w-64 min-h-[60px] bg-white/80 dark:bg-zinc-800/80"
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        maxLength={300}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleBioSave} disabled={saving}>
                          Salvează
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setBioEdit(false)}>
                          Anulează
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 w-full max-w-md text-gray-700 dark:text-gray-300 text-center flex items-start justify-center">
                      <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 bg-white/60 dark:bg-zinc-900/40">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-left w-full">{bio || <span className="italic text-gray-400">Adaugă un bio...</span>}</span>
                          <Button size="icon" variant="ghost" className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200" onClick={() => setBioEdit(true)} aria-label="Editează bio">
                            <Pencil size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="activity" className="w-full mt-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="activity">Activitate</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="settings">Setari</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-4">
                {solvedProblemsLoading ? (
                  <ActivitySkeleton />
                ) : solvedProblems.length === 0 ? (
                  <span className="text-gray-500 italic">Nu ai rezolvat încă nicio problemă.</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {solvedProblems.map((problem) => (
                      <Link key={problem.id} href={`/probleme/${problem.id}`} className="inline-block">
                        <span className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                          #{problem.id}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="badges" className="mt-4">
                <UserBadges />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-white/60 dark:bg-zinc-900/40">
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">Resetare parolă</div>
                  <Button onClick={() => setShowChangePasswordModal(true)} variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Schimbă parola
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          </Card>
        </section>

        {/* Modal pentru schimbarea parolei */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      </main>

      {/* Mini Footer pentru pagina de profil (full-width) */}
      <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 px-4 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-2xl font-bold text-black dark:text-white mb-4 title-font">PLANCK</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Platforma educațională de fizică pentru liceeni. Învață, exersează și reușește!
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
                >
                  <Facebook size={20} />
                </Link>
                <Link
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
                >
                  <Instagram size={20} />
                </Link>
                <Link
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
                >
                  <Youtube size={20} />
                </Link>
                <Link
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
                >
                  <Mail size={20} />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 PLANCK. Toate drepturile rezervate.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ProfilPage; 