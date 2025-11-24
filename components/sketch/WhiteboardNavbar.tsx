"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-provider";

interface WhiteboardNavbarProps {
  roomId: string;
  connectedUsers: string[];
}

export function WhiteboardNavbar({ roomId, connectedUsers }: WhiteboardNavbarProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Generate initials or display user IDs
  const getUserInitials = (userId: string) => {
    // Use first 2 characters of user ID as fallback
    return userId.substring(0, 2).toUpperCase();
  };

  // Generate color based on user ID for consistent avatar colors
  const getUserColor = (userId: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <nav className="bg-black border-b border-gray-800 w-full h-16 flex items-center justify-between px-4 sm:px-6 z-50 relative">
      {/* Left side: Logo + Back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white title-font hover:text-gray-300 transition-colors"
        >
          <Rocket className="w-6 h-6 text-white" />
          <span className="text-xl font-bold">PLANCK</span>
        </Link>
        <Button
          onClick={() => router.push(user ? "/sketch/boards" : "/sketch")}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi
        </Button>
      </div>

      {/* Center: AI Chat Bar - Absolute positioned to be truly centered */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10">
        <div className="relative w-[28rem] group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center w-full bg-gray-900/80 border border-gray-700 hover:border-gray-600 rounded-full px-4 py-2 transition-all duration-200 hover:bg-gray-900">
            <Sparkles className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Ask Insight"
              disabled
              className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 text-sm outline-none cursor-not-allowed"
            />
            <div className="flex items-center gap-1 text-[10px] text-gray-600 ml-2">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Connected users */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 mr-2 hidden sm:inline">
          {connectedUsers.length} {connectedUsers.length === 1 ? "utilizator" : "utilizatori"}
        </span>
        <div className="flex items-center gap-2">
          {connectedUsers.length > 0 ? (
            connectedUsers.map((userId) => (
              <Avatar
                key={userId}
                className={`h-8 w-8 border-2 border-gray-700 ${getUserColor(userId)}`}
                title={`User ${userId}`}
              >
                <AvatarFallback className="text-xs font-semibold text-white bg-transparent">
                  {getUserInitials(userId)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <div className="text-sm text-gray-500">Niciun utilizator conectat</div>
          )}
        </div>
      </div>
    </nav>
  );
}

