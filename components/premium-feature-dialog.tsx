'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import Link from 'next/link'

interface PremiumFeatureDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function PremiumFeatureDialog({
    isOpen,
    onOpenChange,
}: PremiumFeatureDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#1b1b1b] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-500">
                        <Crown className="w-6 h-6" />
                        Funcționalitate Premium
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4">
                    <p className="text-gray-300">
                        Descărcarea lecțiilor este disponibilă doar pentru utilizatorii Premium.
                        Treci la planul Premium pentru a avea acces la descărcări nelimitate și multe altele.
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            Mai târziu
                        </Button>
                        <Link href="/pricing" passHref>
                            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                                Vezi planurile de preț
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
