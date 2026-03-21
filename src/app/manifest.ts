import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Navette Xpress Dakar',
        short_name: 'Navette Xpress',
        description: 'Service premium de chauffeur prive a Dakar',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#C9A84C',
        icons: [
            {
                src: '/icons/icon-16.png',
                sizes: '16x16',
                type: 'image/png',
            },
            {
                src: '/icons/icon-32.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/icons/icon-180.png',
                sizes: '180x180',
                type: 'image/png',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
