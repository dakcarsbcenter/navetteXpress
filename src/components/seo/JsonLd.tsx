// src/components/seo/JsonLd.tsx
interface JsonLdProps {
    data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
    // `<` est échappé en < : une valeur venant de la base (FAQ, segments
    // de prix) contenant "</script>" ne peut plus fermer la balise et injecter
    // du HTML. Le JSON reste valide et identique une fois parsé.
    const json = JSON.stringify(data).replace(/</g, '\\u003c');

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: json }}
        />
    );
}
