'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Copy, Facebook, Linkedin, Twitter, Link as LinkIcon, Instagram, MessageCircle } from 'lucide-react'

interface ShareLessonDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    lessonTitle: string
    lessonUrl: string
}

export function ShareLessonDialog({
    isOpen,
    onOpenChange,
    lessonTitle,
    lessonUrl,
}: ShareLessonDialogProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(lessonUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const handleShare = async (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'instagram') => {
        let url = ''
        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lessonUrl)}`
                window.open(url, '_blank', 'noopener,noreferrer')
                break
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out this lesson: ${lessonTitle}`
                )}&url=${encodeURIComponent(lessonUrl)}`
                window.open(url, '_blank', 'noopener,noreferrer')
                break
            case 'linkedin':
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    lessonUrl
                )}`
                window.open(url, '_blank', 'noopener,noreferrer')
                break
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(
                    `Check out this lesson: ${lessonTitle} ${lessonUrl}`
                )}`
                window.open(url, '_blank', 'noopener,noreferrer')
                break
            case 'instagram':
                // Instagram doesn't support direct web sharing via URL.
                // Strategy: Copy link + Open Instagram
                await handleCopy()
                window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
                break
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#1b1b1b] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Partajează această lecție</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <p className="text-sm text-gray-400">
                        Copiază link-ul sau partajează direct pe rețelele sociale.
                    </p>

                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Input
                                id="link"
                                defaultValue={lessonUrl}
                                readOnly
                                className="bg-[#2a2a2a] border-[#333] text-gray-300 focus-visible:ring-purple-500"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCopy}
                            className="px-3 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            className="w-full bg-[#2a2a2a] border-[#333] hover:bg-[#333] text-white hover:text-white"
                            onClick={() => handleShare('facebook')}
                        >
                            <Facebook className="mr-2 h-4 w-4 text-blue-500" />
                            Facebook
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full bg-[#2a2a2a] border-[#333] hover:bg-[#333] text-white hover:text-white"
                            onClick={() => handleShare('twitter')}
                        >
                            <Twitter className="mr-2 h-4 w-4 text-sky-400" />
                            Twitter
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full bg-[#2a2a2a] border-[#333] hover:bg-[#333] text-white hover:text-white"
                            onClick={() => handleShare('linkedin')}
                        >
                            <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
                            LinkedIn
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full bg-[#2a2a2a] border-[#333] hover:bg-[#333] text-white hover:text-white"
                            onClick={() => handleShare('whatsapp')}
                        >
                            <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                            WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full bg-[#2a2a2a] border-[#333] hover:bg-[#333] text-white hover:text-white"
                            onClick={() => handleShare('instagram')}
                        >
                            <Instagram className="mr-2 h-4 w-4 text-pink-500" />
                            Instagram
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
