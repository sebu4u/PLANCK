import { Metadata } from 'next'
import { generateMetadata } from '@/lib/metadata'
import { StructuredData } from '@/components/structured-data'

export const metadata: Metadata = generateMetadata('planckcode-ide')

export default function PlanckCodeIdeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Planck Code Editor",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "RON"
        },
        "description": "IDE Online C++ cu compilator integrat și asistent AI."
    }

    return (
        <>
            <StructuredData data={schema} id="software-app-ide" />
            {children}
        </>
    )
}
