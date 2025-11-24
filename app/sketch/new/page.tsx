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
        // Generăm un ID unic pentru cameră
        // Folosim un format mai prietenos dar unic: timestamp + random
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        
        // Redirecționăm către noul sistem bazat pe PartyKit
        router.push(`/sketch/${uniqueId}`);
        
      } catch (error: any) {
        console.error('Failed to create board:', error);
        toast.error('Eroare la inițializarea tablei');
        router.push('/sketch');
      }
    };

    createBoard();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 relative z-10" />
        </div>
        <p className="text-lg font-medium text-gray-300">Se inițializează spațiul de lucru...</p>
      </div>
    </div>
  );
}
