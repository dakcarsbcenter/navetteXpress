import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Navette Xpress Dakar',
        short_name: 'Navette Xpress',
        description: 'Service premium de chauffeur privé à Dakar',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#C9A84C',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
