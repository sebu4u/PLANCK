"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { BoardCard } from '@/components/sketch/BoardCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { useSubscriptionPlan } from '@/hooks/use-subscription-plan';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Board {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  room_id?: string;
}

const FREE_PLAN_BOARD_LIMIT =
  Number(process.env.NEXT_PUBLIC_FREE_PLAN_BOARD_LIMIT ?? '3') || 3;

export default function BoardsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { isFree, isPaid } = useSubscriptionPlan();
  // Only check limit for free plan users (not for plus/premium)
  // If user has paid plan (plus/premium), they can create unlimited boards
  const hasReachedFreePlanLimit =
    isFree && !isPaid && FREE_PLAN_BOARD_LIMIT > 0 && boards.length >= FREE_PLAN_BOARD_LIMIT;
  const freePlanLimitMessage = `Ai atins limita de ${FREE_PLAN_BOARD_LIMIT} table pe planul Free. Șterge una existentă pentru a crea alta.`;

  useEffect(() => {
    // Only show popup for free plan users who have reached the limit
    if (hasReachedFreePlanLimit) {
      setShowLimitModal(true);
    }
  }, [hasReachedFreePlanLimit]);

  const fetchBoards = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Get access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/sketch/boards', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }

      const data = await response.json();
      setBoards(data.boards || []);
    } catch (error: any) {
      console.error('Failed to fetch boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleCreateBoard = async () => {
    if (!user) {
      toast.error('Trebuie să fii autentificat pentru a crea table');
      return;
    }

    if (hasReachedFreePlanLimit) {
      toast.error(freePlanLimitMessage);
      return;
    }

    setIsCreating(true);
    try {
      // Get access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Generate a unique room ID for PartyKit
      const roomId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

      const response = await fetch('/api/sketch/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: 'Untitled', roomId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create board');
      }

      const data = await response.json();
      const boardRoomId = data.board.room_id || roomId;

      // Redirect to the PartyKit board
      router.push(`/sketch/${boardRoomId}`);
    } catch (error: any) {
      console.error('Failed to create board:', error);
      toast.error(error.message || 'Failed to create board');
      setIsCreating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">Loading boards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md mx-auto px-4">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-white mb-2">Autentificare necesară</h2>
            <p className="text-gray-400 mb-6">
              Trebuie să fii autentificat pentru a vedea și crea table. Tablele se salvează doar pentru utilizatorii autentificați.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-gray-200">
                  Creează cont
                </Button>
              </Link>
              <Button
                onClick={() => {
                  // Dispatch event to open login modal in Navigation
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('openLoginModal'));
                  }
                }}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Autentifică-te
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Boards</h1>
          <p className="text-gray-400">Manage your sketch boards</p>
          {isFree && !isPaid && (
            <p className="text-sm text-gray-500 mt-2">
              Plan Free: poți salva până la {FREE_PLAN_BOARD_LIMIT} table în același timp.
            </p>
          )}
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center mb-8">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-white mb-2">No boards yet</h2>
              <p className="text-gray-400 mb-6">Create your first board to get started</p>
              <Button
                onClick={handleCreateBoard}
                disabled={isCreating || hasReachedFreePlanLimit}
                className="bg-white text-black hover:bg-gray-200"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Board
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} onUpdate={fetchBoards} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      {boards.length > 0 && (
        <Button
          onClick={handleCreateBoard}
          disabled={isCreating || hasReachedFreePlanLimit}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg z-50 flex items-center justify-center p-0"
          size="icon"
        >
          {isCreating ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      )}
      </div>
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="max-w-md rounded-[32px] border border-white/10 bg-white/5 px-0 pb-6 pt-0 text-white shadow-[0_25px_120px_-30px_rgba(0,0,0,0.75)] backdrop-blur-2xl overflow-hidden">
          <div className="w-full h-32 sm:h-36 bg-gradient-to-br from-white/40 via-white/10 to-transparent relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.35),_rgba(14,165,233,0.15),_transparent_70%)]" />
            <div className="absolute inset-0 bg-[url('/sketch-card-placeholder.jpg')] bg-cover bg-center opacity-10" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
          </div>
          <div className="px-6 mt-6 space-y-4">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-bold text-white">
                Upgrade la PLUS+
              </DialogTitle>
              <DialogDescription className="text-gray-200 text-base">
                Ai salvat deja {FREE_PLAN_BOARD_LIMIT} table pe planul Free. Treci la PLUS+ pentru a crea mai multe table și a debloca funcționalități avansate.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-gray-100">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.7)]" />
                <p>Board-uri nelimitate și organizare mai ușoară.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.7)]" />
                <p>Funcții premium pentru colaborare și prezentare.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.7)]" />
                <p>Acces prioritar la noile feature-uri Sketch.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 px-6 pt-6">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-white/0 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setShowLimitModal(false)}
            >
              Mai târziu
            </Button>
            <Link href="/insight" className="w-full sm:w-auto">
              <Button className="w-full bg-blue-500 text-white hover:bg-blue-400">
                Vezi planurile
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

