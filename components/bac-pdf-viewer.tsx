'use client'

import { BacSubject } from '@/lib/supabase-bac'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText } from 'lucide-react'

interface BacPdfViewerProps {
    subject: BacSubject | null
    isLoading?: boolean
}

export function BacPdfViewer({
    subject,
    isLoading = false
}: BacPdfViewerProps) {
    if (isLoading) {
        return <BacPdfViewerSkeleton />
    }

    if (!subject) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-[#323232] rounded-l-2xl">
                <div className="text-center text-white/60 p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Selectează un subiect</h3>
                    <p className="text-sm">Alege un subiect din sidebar pentru a-l vizualiza</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-[#323232] rounded-l-2xl overflow-hidden">
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden p-4 lg:p-6">
                <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
                    <iframe
                        src={`${subject.pdf_url}#view=FitH`}
                        className="w-full h-full border-0"
                        title={subject.name}
                    />
                </div>
            </div>
        </div>
    )
}

function BacPdfViewerSkeleton() {
    return (
        <div className="flex-1 h-full flex flex-col bg-[#323232] rounded-l-2xl overflow-hidden">
            {/* PDF skeleton */}
            <div className="flex-1 overflow-hidden p-4 lg:p-6">
                <Skeleton className="w-full h-full bg-white/10 rounded-lg" />
            </div>
        </div>
    )
}
