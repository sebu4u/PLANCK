"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { BoardPreview } from './BoardPreview';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Board {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface BoardCardProps {
  board: Board;
  onUpdate: () => void;
}

export function BoardCard({ board, onUpdate }: BoardCardProps) {
  const router = useRouter();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(board.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === board.title) {
      setIsRenameOpen(false);
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(`/api/sketch/boards/${board.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename board');
      }

      toast.success('Board renamed');
      setIsRenameOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to rename board:', error);
      toast.error(error.message || 'Failed to rename board');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sketch/boards/${board.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete board');
      }

      toast.success('Board deleted');
      setIsDeleteOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to delete board:', error);
      toast.error(error.message || 'Failed to delete board');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/sketch/board/${board.id}`);
  };

  return (
    <>
      <div
        className="group relative bg-white/10 backdrop-blur-md border border-white/15 rounded-xl overflow-hidden cursor-pointer hover:border-white/25 hover:bg-white/15 transition-all duration-300 shadow-lg"
        onClick={handleCardClick}
      >
        {/* Preview Area */}
        <div className="aspect-video w-full bg-black/30 relative overflow-hidden">
          <BoardPreview boardId={board.id} className="absolute inset-0" />
        </div>

        {/* Card Footer */}
        <div className="p-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-xs truncate mb-0.5">
              {board.title}
            </h3>
            <p className="text-gray-300/70 text-[10px]">
              {formatDate(board.updated_at)}
            </p>
          </div>

          {/* 3-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white/10 backdrop-blur-md border-white/15 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="text-white hover:bg-white/10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewTitle(board.title);
                  setIsRenameOpen(true);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 hover:bg-white/10 hover:text-red-300 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent
          className="bg-white/10 backdrop-blur-md border-white/15 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a new name for this board.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              placeholder="Board name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameOpen(false)}
              className="border-white/15 text-black hover:bg-white/10 hover:text-black"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleRename}
              disabled={isRenaming || !newTitle.trim()}
              className="border-white/15 text-black hover:bg-white/10 hover:text-black"
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent
          className="bg-white/10 backdrop-blur-md border-white/15 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{board.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-white/15 text-black hover:bg-white/10 hover:text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

