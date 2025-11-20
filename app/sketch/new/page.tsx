"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewBoardPage() {
  const router = useRouter();

  useEffect(() => {
    const createBoard = async () => {
      try {
        const response = await fetch('/api/sketch/boards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Untitled' }),
        });

        if (!response.ok) {
          throw new Error('Nu am putut crea tabla');
        }

        const data = await response.json();
        const boardId = data.board.id;

        // Redirect to the new board
        router.push(`/sketch/board/${boardId}`);
      } catch (error: any) {
        console.error('Failed to create board:', error);
        toast.error(error.message || 'Eroare la crearea tablei');
        router.push('/sketch');
      }
    };

    createBoard();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p>Se creează tabla...</p>
      </div>
    </div>
  );
}




