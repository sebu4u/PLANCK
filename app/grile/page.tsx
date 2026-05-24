import { Metadata } from 'next';
import { Suspense } from 'react';
import { GrilePageContent } from '@/components/grile/grile-page-content';
import { Navigation } from '@/components/navigation';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata('grile');

export default function GrilePage() {
    return (
        <>
            <Navigation />
            <Suspense>
                <GrilePageContent />
            </Suspense>
        </>
    );
}
