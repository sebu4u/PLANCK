import { Metadata } from 'next';
import { Suspense } from 'react';
import { GrilePageContent } from '@/components/grile/grile-page-content';
import { Navigation } from '@/components/navigation';

export const metadata: Metadata = {
    title: 'Teste Grilă Fizică | Planck',
    description: 'Teste grilă de fizică pentru clasele IX-XII. Întrebări cu variante de răspuns pentru pregătirea examenelor.',
};

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
