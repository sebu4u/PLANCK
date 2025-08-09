'use client';

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Navigation } from "@/components/navigation";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
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
      // 1. Ia toate problem_id rezolvate de user
      const { data: solved, error: solvedError } = await supabase
        .from("solved_problems")
        .select("problem_id, solved_at")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false });
      if (!solved || solved.length === 0) {
        setSolvedProblems([]);
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
    return <div className="container mx-auto py-8">Se încarcă...</div>;
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden cosmic-bg">
      <Navigation />
      {/* Blurred avatar wallpaper background */}
      {avatarUrl && (
        <div
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <AspectRatio ratio={16 / 9} className="w-full h-full">
            <img
              src={avatarUrl}
              alt="Avatar wallpaper"
              className="w-full h-full object-cover object-center blur-2xl scale-125 opacity-40 animate-fade-in"
              draggable={false}
            />
          </AspectRatio>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/40 via-pink-400/20 to-white/80 dark:to-zinc-900/80" />
        </div>
      )}
      <section className="relative z-10 w-full max-w-2xl px-4 py-12 flex flex-col items-center animate-fade-in-up">
        <Card className="w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-0 shadow-2xl cosmic-glow transition-transform duration-500 hover:scale-[1.01]">
          <CardHeader className="flex flex-col items-center space-y-4">
            <div className="relative group animate-fade-in-up">
              <Avatar className="w-32 h-32 shadow-xl border-4 border-white/80 dark:border-zinc-800/80 transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl">
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
              <label className="absolute bottom-2 right-2 bg-gradient-to-tr from-purple-600 via-pink-400 to-fuchsia-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg cursor-pointer opacity-90 hover:opacity-100 transition-opacity animate-fade-in-up-delay-2">
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
            <div className="flex flex-col items-center gap-1 animate-fade-in-up-delay-2">
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
                    <span className="text-lg font-semibold text-purple-700 dark:text-pink-400 drop-shadow cosmic-text-glow">
                      {nickname || <span className="italic text-gray-400">Adaugă un nickname...</span>}
                    </span>
                    <Button size="icon" variant="ghost" className="ml-1 p-1 text-purple-400 hover:text-purple-600 dark:text-pink-300 dark:hover:text-pink-500 opacity-70 hover:opacity-100 transition-all" onClick={() => setNicknameEdit(true)} aria-label="Editează nickname">
                      <Pencil size={16} />
                    </Button>
                  </>
                )}
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white cosmic-text-glow">
                {profile?.name || user.email}
              </div>
            </div>
            <div className="w-full flex flex-col items-center animate-fade-in-up-delay-3">
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
                <div className="mt-2 text-gray-700 dark:text-gray-300 text-center flex items-center justify-center">
                  <span>{bio || <span className="italic text-gray-400">Adaugă un bio...</span>}</span>
                  <Button size="icon" variant="ghost" className="ml-1 p-1 text-purple-400 hover:text-purple-600 dark:text-pink-300 dark:hover:text-pink-500 opacity-70 hover:opacity-100 transition-all" onClick={() => setBioEdit(true)} aria-label="Editează bio">
                    <Pencil size={16} />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-6 mt-6 animate-fade-in-up-delay-3">
              {/* Progres la probleme - dropdown */}
              <div className="flex flex-col">
                <button
                  type="button"
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-100/80 via-pink-100/60 to-white/80 dark:from-zinc-800/80 dark:via-purple-900/60 dark:to-zinc-900/80 rounded-xl p-4 shadow space-card cursor-pointer focus:outline-none"
                  onClick={() => setProblemsOpen((v) => !v)}
                  aria-expanded={problemsOpen}
                  aria-controls="solved-problems-dropdown"
                >
                  <span className="font-medium text-purple-700 dark:text-pink-400 flex items-center gap-2">
                    <Badge variant="default" className="bg-gradient-to-tr from-purple-600 via-pink-400 to-fuchsia-500 text-white shadow cosmic-glow animate-pulse-scale">Progres la probleme</Badge>
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-purple-600 dark:text-pink-400 font-bold text-lg drop-shadow cosmic-text-glow">{solvedCount} probleme rezolvate</span>
                    <Progress value={Math.min(solvedCount, 100)} className="w-48 h-3 bg-white/60 dark:bg-zinc-800/60 cosmic-glow" />
                  </div>
                  <span className="ml-2 flex items-center">
                    {problemsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </button>
                {/* Dropdown cu probleme rezolvate */}
                <div
                  id="solved-problems-dropdown"
                  className={`transition-all duration-300 overflow-hidden ${problemsOpen ? 'max-h-40 py-3' : 'max-h-0 py-0'} px-2`}
                  aria-hidden={!problemsOpen}
                >
                  {solvedProblems.length === 0 ? (
                    <span className="text-gray-500 italic">Nu ai rezolvat încă nicio problemă.</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {solvedProblems.map((problem) => (
                        <Link
                          key={problem.id}
                          href={`/probleme/${problem.id}`}
                          className="inline-block"
                        >
                          <span className="px-3 py-1 rounded-lg bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-semibold text-sm shadow hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors cursor-pointer border border-purple-300 dark:border-purple-700">
                            #{problem.id}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Progres la cursuri (neschimbat) */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-100/80 via-pink-100/60 to-white/80 dark:from-zinc-800/80 dark:via-blue-900/60 dark:to-zinc-900/80 rounded-xl p-4 shadow space-card">
                <span className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gradient-to-tr from-blue-600 via-pink-400 to-fuchsia-500 text-white shadow cosmic-glow animate-pulse-scale">Progres la cursuri</Badge>
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg drop-shadow cosmic-text-glow">(în curând)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default ProfilPage; 