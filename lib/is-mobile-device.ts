import { headers } from 'next/headers'

/**
 * Server-side utility to detect if the request is from a mobile device (Android/iOS)
 * Uses the User-Agent header to determine the device type
 */
export async function isMobileDevice(): Promise<boolean> {
    const userAgent = (await headers()).get('user-agent') || ''

    // Detect Android and iOS devices
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return mobileRegex.test(userAgent)
}
