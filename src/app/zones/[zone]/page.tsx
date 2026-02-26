// src/app/zones/[zone]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ZoneClient from './ZoneClient';

interface ZoneData {
    id: string;
    name: string;
    description: string;
    content: string; // Long content for SEO (600+ words)
}

const zones: Record<string, ZoneData> = {
    almadies: {
        id: 'almadies',
        name: 'Almadies',
        description: 'Chauffeur privé et transfert aéroport aux Almadies, Dakar. Service premium 24h/24 pour résidents et entreprises.',
        content: `<h3>Besoin d'un chauffeur privé aux Almadies ?</h3>
    <p>Navette Xpress dessert le quartier le plus prestigieux de Dakar : <strong>les Almadies</strong>. Connu pour ses résidences diplomatiques, ses sièges d'organisations internationales et ses restaurants de luxe, ce quartier demande une mobilité d'exception.</p>
    
    <p>Que vous soyez résident, homme d'affaires en déplacement ou touriste séjournant dans l'un des palaces du quartier, nous vous offrons un service de chauffeur privé à la hauteur de vos exigences. Nos chauffeurs connaissent parfaitement les rues sinueuses et les raccourcis des Almadies pour vous éviter les embouteillages du rond-point de Ngor.</p>
    
    <h3>Transfert Aéroport Almadies — AIBD en toute sérénité</h3>
    <p>Pour vos départs et arrivées à l'aéroport Blaise Diagne (AIBD), nous assurons une liaison directe depuis votre domicile ou votre bureau aux Almadies. Imaginez : pas besoin de chercher un taxi, pas de négociation de prix, un chauffeur vous attend with une pancarte pour votre retour, et un véhicule climatisé vous emmène confortablement chez vous.</p>
    
    <h3>Pourquoi choisir Navette Xpress aux Almadies ?</h3>
    <ul>
      <li><strong>Ponctualité garantie</strong> : Nous arrivons 15 minutes en avance pour chaque prise en charge.</li>
      <li><strong>Véhicules Premium</strong> : SUV et berlines de luxe pour vos rendez-vous d'affaires.</li>
      <li><strong>Prix fixe</strong> : Pas de compteur, pas de surprise. Le tarif Almadies-AIBD est communiqué à la réservation.</li>
      <li><strong>Service 24h/24</strong> : Que votre vol soit à 3h du matin ou à midi, nous sommes là.</li>
    </ul>`,
    },
    plateau: {
        id: 'plateau',
        name: 'Dakar Plateau',
        description: 'Service de chauffeur privé au Plateau, centre-ville de Dakar. Ponctualité absolue pour vos rendez-vous business.',
        content: `<h3>Votre chauffeur privé au cœur de Dakar Plateau</h3>
    <p>Le <strong>Plateau</strong> est le centre névralgique des affaires, de l'administration et de la politique au Sénégal. Navette Xpress propose une offre de mise à disposition de chauffeur privé pour vous accompagner dans tous vos déplacements professionnels dans le centre-ville.</p>
    
    <p>Nos chauffeurs sont formés pour circuler avec fluidité dans les rues denses du centre-ville, entre la Place de l'Indépendance, le Port de Dakar et les différents ministères. Gagnez du temps et restez productif à bord de nos véhicules équipés du Wi-Fi.</p>
    
    <h3>Liaison Dakar Plateau — Aéroport AIBD</h3>
    <p>Le trajet entre le Plateau et l'aéroport international Blaise Diagne peut s'avérer long en fonction du trafic sur l'autoroute à péage. En réservant with Navette Xpress, vous avez l'assurance d'un départ calculé pour ne jamais manquer votre vol. Votre chauffeur surveille l'état du trafic en temps réel pour adapter l'itinéraire.</p>
    
    <h3>Un service sur mesure pour les entreprises du Plateau</h3>
    <ul>
      <li><strong>Facturation mensuelle</strong> : Pour vos collaborateurs et vos invités de marque.</li>
      <li><strong>Accueil personnalisé</strong> : Accueil VIP au salon de l'aéroport.</li>
      <li><strong>Discrétion totale</strong> : Chauffeurs professionnels formés au protocole.</li>
    </ul>`,
    },
    ngor: {
        id: 'ngor',
        name: 'Ngor & Virage',
        description: 'Transfert aéroport et transport privé à Ngor. Profitez de la côte en toute sérénité with Navette Xpress.',
        content: `<h3>Déplacez-vous à Ngor with un chauffeur privé</h3>
    <p>Le quartier de <strong>Ngor</strong>, with son village de pêcheurs, son île paradisiaque et ses zones résidentielles du Virage, est une destination incontournable. Navette Xpress facilite vos déplacements vers cette zone balnéaire très prisée.</p>
    
    <p>Que vous rentriez de l'île de Ngor en soirée ou que vous ayez besoin d'un transfert vers l'aéroport après un week-end au bord de l'eau, nos véhicules sont stationnés à proximité pour intervenir rapidement.</p>
    
    <h3>Navette Aéroport vers Ngor / Virage</h3>
    <p>Le Virage est l'un des premiers accès à Dakar depuis l'autoroute en venant de l'AIBD. Nous assurons des transferts rapides et sécurisés pour tous les hôtels et résidences meublées du secteur Ngor-Virage.</p>
    
    <h3>Services disponibles à Ngor</h3>
    <ul>
      <li><strong>Mise à disposition</strong> : Pour une journée shopping ou visites.</li>
      <li><strong>Vans pour groupes</strong> : Idéal pour les familles ou groupes d'amis.</li>
      <li><strong>Trajets de nuit</strong> : Sécurité garantie pour vos sorties au restaurant ou en boîte aux Almadies/Ngor.</li>
    </ul>`,
    },
    yoff: {
        id: 'yoff',
        name: 'Yoff',
        description: 'Chauffeur privé à Yoff. Transport fiable et économique vers l\'aéroport AIBD et le centre-ville.',
        content: `<h3>Navette Xpress à Yoff : Votre partenaire mobilité</h3>
    <p>Le quartier de <strong>Yoff</strong>, poumon culturel et religieux de Dakar with ses plages immenses et son ancien aéroport, est en plein développement. Navette Xpress renforce sa présence à Yoff pour offrir aux habitants et visiteurs un transport fiable et sécurisé.</p>
    
    <p>Évitez les tarifs aléatoires des taxis clandestins. With nous, vous réservez une voiture de standing with un tarif transparent, que ce soit pour aller à la Grande Mosquée de Yoff ou pour un trajet interurbain.</p>
    
    <h3>Accès rapide à l'autoroute depuis Yoff</h3>
    <p>Yoff bénéficie d'un accès stratégique à l'autoroute à péage. Nous utilisons cet avantage pour vous proposer des transferts vers l'aéroport AIBD en un temps record depuis Yoff-Diamalaye, Yoff-Tonghor ou Yoff-Aéroport.</p>
    
    <h3>Les avantages Navette Xpress à Yoff</h3>
    <ul>
      <li><strong>Sécurité des passagers</strong> : Suivi GPS de chaque trajet.</li>
      <li><strong>Espace bagages</strong> : Nos SUV sont parfaits pour les voyageurs chargés au départ de Yoff.</li>
      <li><strong>Paiement flexible</strong> : Espèces, Orange Money ou Wave.</li>
    </ul>`,
    },
    'sacre-coeur': {
        id: 'sacre-coeur',
        name: 'Sacré-Cœur & Mermoz',
        description: 'Transport privé au cœur de Dakar : Sacré-Cœur 1, 2, 3 et Mermoz. Le choix du confort urbain.',
        content: `<h3>Chauffeur privé à Sacré-Cœur et Mermoz</h3>
    <p>Quartiers résidentiels centraux et dynamiques, <strong>Sacré-Cœur</strong> (1, 2, 3, VDN) et <strong>Mermoz</strong> sont au centre de tous les trajets à Dakar. Navette Xpress y propose un service de proximité pour vos besoins quotidiens ou exceptionnels.</p>
    
    <p>Besoin d'aller au supermarché Exclusive, de vous rendre à un rendez-vous sur la VDN ou de rejoindre l'aéroport AIBD sans stress ? Nos chauffeurs sont postés stratégiquement pour vous servir rapidement.</p>
    
    <h3>La solution idéale pour les familles de Sacré-Cœur</h3>
    <p>Nous savons que les familles de Sacré-Cœur et Mermoz apprécient le confort. Nos véhicules spacieux permettent de transporter enfants et bagages pour vos départs en week-end à Saly ou vos retours d'expatriation via l'AIBD.</p>
    
    <h3>Pourquoi nous faire confiance à Sacré-Cœur ?</h3>
    <ul>
      <li><strong>Véhicules familiaux</strong> : Sièges auto sur demande.</li>
      <li><strong>Connaissance du trafic</strong> : Maîtrise des raccourcis VDN et ancienne piste.</li>
      <li><strong>Réservation simple</strong> : Via notre application web en 3 clics.</li>
    </ul>`,
    },
};

export async function generateMetadata({ params }: { params: { zone: string } }): Promise<Metadata> {
    const zone = zones[params.zone];
    if (!zone) return {};

    return {
        title: `Chauffeur Privé ${zone.name} & Transfert Aéroport AIBD | Navette Xpress`,
        description: zone.description,
        alternates: { canonical: `https://navettexpress.com/zones/${zone.id}` },
        openGraph: {
            title: `Chauffeur Privé ${zone.name} — Navette Xpress`,
            description: zone.description,
            url: `https://navettexpress.com/zones/${zone.id}`,
            images: [{ url: '/og/og-zones.jpg' }],
        }
    };
}

export default function Page({ params }: { params: { zone: string } }) {
    const t = zones[params.zone];
    if (!t) notFound();

    const breadcrumbs = [
        { name: 'Accueil', item: 'https://navettexpress.com' },
        { name: 'Zones', item: 'https://navettexpress.com/zones' },
        { name: t.name, item: `https://navettexpress.com/zones/${t.id}` },
    ];

    return <ZoneClient t={t} breadcrumbs={breadcrumbs} />;
}
