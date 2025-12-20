"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  boardId: string;
  shareUrl: string;
}

export function ShareButton({ boardId, shareUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiat!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Nu am putut copia link-ul');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-white text-black hover:bg-gray-100 transition-all duration-300 shadow-lg"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white text-black border-gray-200" overlayClassName="bg-black/50">
        <DialogHeader>
          <DialogTitle className="text-black">Partajează tabla</DialogTitle>
          <DialogDescription className="text-gray-600">
            Trimite link-ul acesta colegilor pentru a colabora în timp real
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="bg-gray-50 border-gray-300 text-black"
            />
            <Button
              onClick={handleCopy}
              variant={copied ? "default" : "outline"}
              className={copied ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiat!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiază
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Oricine are link-ul poate accesa și edita tabla în timp real.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


