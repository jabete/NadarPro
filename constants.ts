import { Attribute, Club, CompetitionTier, Stroke } from './types';

// Flags and Icons
export const COUNTRY_FLAGS: Record<string, string> = {
    'ES': '🇪🇸', 'US': '🇺🇸', 'RU': '🇷🇺', 'FR': '🇫🇷', 'PT': '🇵🇹', 
    'GB': '🇬🇧', 'DE': '🇩🇪', 'IT': '🇮🇹', 'CN': '🇨🇳', 'AU': '🇦🇺', 
    'PL': '🇵🇱', 'XX': '🏳️' // Generic
};

export const CLUB_ICONS = [
    '🦈', '🐬', '🐋', '🏊', '🌊', '🔱', '⚓', '⚡', '🐊', '🧜',
    '🦁', '🐯', '🐻', '🦅', '🦉', '🐙', '🦖', '🐟', '⭐', '🔥',
    '💎', '⚔️', '🛡️', '👑', '🐉', '⛰️', '☠️', '🌪️', '❄️', '🌵',
    '🕊️', '🤽', '🐧', '🐸', '🛟' // New icons added
];

// Vivid Colors (Solid backgrounds, White text/icons)
export const CLUB_COLORS = [
    { name: 'Azul Eléctrico', hex: 'text-white', bg: 'bg-blue-600' },
    { name: 'Rojo Fuego', hex: 'text-white', bg: 'bg-red-600' },
    { name: 'Verde Lima', hex: 'text-slate-900', bg: 'bg-lime-400' },
    { name: 'Amarillo Sol', hex: 'text-slate-900', bg: 'bg-yellow-400' },
    { name: 'Morado Real', hex: 'text-white', bg: 'bg-purple-600' },
    { name: 'Rosa Neón', hex: 'text-white', bg: 'bg-pink-500' },
    { name: 'Naranja Vivo', hex: 'text-white', bg: 'bg-orange-500' },
    { name: 'Cian', hex: 'text-slate-900', bg: 'bg-cyan-400' },
    { name: 'Indigo Profundo', hex: 'text-white', bg: 'bg-indigo-800' },
    { name: 'Negro Carbón', hex: 'text-white', bg: 'bg-slate-900' },
    { name: 'Verde Esmeralda', hex: 'text-white', bg: 'bg-emerald-600' },
    { name: 'Turquesa', hex: 'text-slate-900', bg: 'bg-teal-400' },
    { name: 'Oro Viejo', hex: 'text-white', bg: 'bg-amber-600' },
    { name: 'Blanco', hex: 'text-slate-900', bg: 'bg-white' }, 
    { name: 'Marrón Café', hex: 'text-white', bg: 'bg-stone-600' },
    { name: 'Azul Claro', hex: 'text-slate-900', bg: 'bg-sky-300' },
    { name: 'Rojo Claro', hex: 'text-slate-900', bg: 'bg-red-300' },
    { name: 'Granate', hex: 'text-white', bg: 'bg-red-900' },
    { name: 'Verde Pistacho', hex: 'text-slate-900', bg: 'bg-lime-300' },
    { name: 'Amarillo Clarito', hex: 'text-slate-900', bg: 'bg-yellow-100' },
    // New Colors
    { name: 'Gris Claro', hex: 'text-slate-900', bg: 'bg-gray-300' },
    { name: 'Verde Muy Oscuro', hex: 'text-white', bg: 'bg-green-950' },
    { name: 'Rojo Pastel', hex: 'text-slate-900', bg: 'bg-red-200' },
    { name: 'Marrón Tierra', hex: 'text-white', bg: 'bg-amber-900' },
    { name: 'Blanco Grisáceo', hex: 'text-slate-900', bg: 'bg-slate-200' },
];

// Geography Structure
export interface ZoneData {
    id: string;
    name: string; 
    cities: string[];
}

export interface RegionData {
    id: string;
    name: string; 
    zones: ZoneData[];
}

export const SPANISH_GEOGRAPHY: RegionData[] = [
    {
        id: 'CLM', name: 'Castilla La Mancha', zones: [
            { id: 'Z1', name: 'Zona 1 (CR Sur)', cities: ['Valdepeñas', 'Manzanares', 'Puertollano'] },
            { id: 'Z2', name: 'Zona 2 (Toledo/Guada)', cities: ['Toledo', 'Guadalajara', 'Talavera'] },
            { id: 'Z3', name: 'Zona 3 (CR Norte)', cities: ['Ciudad Real', 'Tomelloso', 'Fuensalida'] },
            { id: 'Z4', name: 'Zona 4 (Albacete)', cities: ['Albacete', 'La Roda', 'Villarrobledo'] },
        ]
    },
    {
        id: 'MAD', name: 'Madrid', zones: [
            { id: 'Z_MAD_C', name: 'Zona Centro (Capital)', cities: ['Madrid Capital'] },
            { id: 'Z_MAD_S', name: 'Zona Sur', cities: ['Alcorcón', 'Móstoles', 'Leganés', 'Getafe'] },
            { id: 'Z_MAD_N', name: 'Zona Norte', cities: ['Alcobendas', 'San Sebastián de los Reyes', 'Tres Cantos'] },
            { id: 'Z_MAD_E', name: 'Corredor del Henares', cities: ['Alcalá de Henares', 'Torrejón de Ardoz', 'Coslada'] },
            { id: 'Z_MAD_W', name: 'Zona Oeste', cities: ['Las Rozas', 'Majadahonda', 'Pozuelo'] },
            { id: 'Z_MAD_SIE', name: 'La Sierra', cities: ['Collado Villalba', 'El Escorial', 'Guadarrama'] },
        ]
    },
    {
        id: 'CAT', name: 'Cataluña', zones: [
            { id: 'Z_BCN', name: 'Barcelonès', cities: ['Barcelona', 'Hospitalet', 'Badalona'] },
            { id: 'Z_VALLES', name: 'Vallès Occidental', cities: ['Terrassa', 'Sabadell', 'Sant Cugat'] },
            { id: 'Z_GIR', name: 'Girona', cities: ['Girona', 'Figueres', 'Blanes'] },
            { id: 'Z_TGN', name: 'Tarragona', cities: ['Tarragona', 'Reus', 'El Vendrell'] },
            { id: 'Z_LLE', name: 'Lleida', cities: ['Lleida', 'Balaguer'] },
            { id: 'Z_BAIX', name: 'Baix Llobregat', cities: ['Cornellà', 'El Prat', 'Castelldefels'] },
        ]
    },
    {
        id: 'AND', name: 'Andalucía', zones: [
            { id: 'Z_MAL', name: 'Málaga-Costa', cities: ['Málaga', 'Marbella', 'Fuengirola'] },
            { id: 'Z_SEV', name: 'Sevilla', cities: ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra'] },
            { id: 'Z_COR', name: 'Córdoba', cities: ['Córdoba', 'Lucena'] },
            { id: 'Z_GRA', name: 'Granada', cities: ['Granada', 'Motril'] },
            { id: 'Z_CAD', name: 'Cádiz', cities: ['Cádiz', 'Jerez', 'Algeciras'] },
            { id: 'Z_ALM', name: 'Almería', cities: ['Almería', 'Roquetas de Mar'] },
        ]
    },
    {
        id: 'VAL', name: 'Comunidad Valenciana', zones: [
            { id: 'Z_VAL', name: 'Valencia Capital', cities: ['Valencia'] },
            { id: 'Z_HORTA', name: 'L\'Horta', cities: ['Torrent', 'Paterna', 'Mislata'] },
            { id: 'Z_ALI', name: 'Alicante', cities: ['Alicante', 'Elche', 'Benidorm'] },
            { id: 'Z_CAS', name: 'Castellón', cities: ['Castellón', 'Vila-real'] },
            { id: 'Z_RIBERA', name: 'La Ribera', cities: ['Alzira', 'Sueca'] },
        ]
    },
    {
        id: 'GAL', name: 'Galicia', zones: [
            { id: 'Z11', name: 'Zona Norte', cities: ['Lugo', 'Ferrol', 'A Coruña'] },
            { id: 'Z17', name: 'Zona Sur', cities: ['Santiago', 'Ourense', 'Vigo'] },
        ]
    },
    {
        id: 'MUR', name: 'Región de Murcia', zones: [
            { id: 'Z9', name: 'Murcia Centro', cities: ['Murcia'] },
            { id: 'Z15', name: 'Campo de Cartagena', cities: ['Cartagena', 'San Javier'] },
            { id: 'Z_LOR', name: 'Guadalentín', cities: ['Lorca', 'Águilas'] },
        ]
    },
    {
        id: 'PV', name: 'País Vasco', zones: [
            { id: 'Z_PV_1', name: 'Zona 1 (Bizkaia/Costa)', cities: ['Bilbao', 'Getxo', 'Barakaldo'] },
            { id: 'Z_PV_2', name: 'Zona 2 (Interior/Gipuzkoa)', cities: ['San Sebastián', 'Vitoria', 'Irún'] },
        ]
    },
    {
        id: 'AST', name: 'Principado de Asturias', zones: [
            { id: 'Z18', name: 'Zona 18 (Centro)', cities: ['Gijón', 'Oviedo', 'Avilés'] },
        ]
    },
    {
        id: 'CYL', name: 'Castilla y León', zones: [
            { id: 'Z_CYL_N', name: 'Zona Norte', cities: ['Burgos', 'Miranda de Ebro', 'Palencia'] },
            { id: 'Z_CYL_S', name: 'Zona Sur', cities: ['Ávila', 'Segovia', 'Arévalo'] },
            { id: 'Z_CYL_E', name: 'Zona Este', cities: ['Soria', 'Aranda de Duero'] },
            { id: 'Z_CYL_W', name: 'Zona Oeste', cities: ['León', 'Salamanca', 'Zamora', 'Valladolid'] },
        ]
    },
];

export const INTERNATIONAL_COUNTRIES = [
    { id: 'US', name: 'Estados Unidos' },
    { id: 'FR', name: 'Francia' },
    { id: 'RU', name: 'Rusia' },
    { id: 'PT', name: 'Portugal' },
    { id: 'GB', name: 'Reino Unido' },
    { id: 'DE', name: 'Alemania' },
    { id: 'IT', name: 'Italia' },
    { id: 'CN', name: 'China' },
    { id: 'AU', name: 'Australia' },
    { id: 'PL', name: 'Polonia' },
];

export const CONTINENTS: Record<string, string[]> = {
    'EUROPE': ['ES', 'FR', 'PT', 'GB', 'DE', 'IT', 'PL'],
    'ASIA': ['CN', 'RU'],
    'AMERICA_OCEANIA': ['US', 'AU']
};

export const INITIAL_CLUBS: Club[] = [];

export const DEFAULT_TIME = 3599.99; 

// Club Prestige Rewards (Top 3)
export const PRESTIGE_REWARDS: Record<CompetitionTier, [number, number, number]> = {
    [CompetitionTier.Triangular]: [0, 0, 0],
    [CompetitionTier.Provincial]: [11, 6, 2],
    [CompetitionTier.Regional]: [12, 7, 3],
    [CompetitionTier.National]: [15, 10, 5],
    [CompetitionTier.InternationalClub]: [20, 12, 6], 
    [CompetitionTier.European]: [25, 15, 10], 
    [CompetitionTier.World]: [50, 30, 15]
};

export const CASH_REWARDS: Record<CompetitionTier, [number, number, number, number]> = {
    // [1st, 2nd, 3rd, 4th-8th]
    [CompetitionTier.Triangular]: [50, 25, 10, 5],
    [CompetitionTier.Provincial]: [200, 100, 50, 20],
    [CompetitionTier.Regional]: [500, 250, 100, 50],
    [CompetitionTier.National]: [2000, 1000, 500, 100],
    [CompetitionTier.InternationalClub]: [5000, 2500, 1000, 200],
    [CompetitionTier.European]: [10000, 5000, 2000, 500],
    [CompetitionTier.World]: [50000, 25000, 10000, 2000],
};

export const STAT_DESCRIPTIONS: Record<Attribute, string> = {
    [Attribute.Strength]: "Fuerza explosiva. Clave para aceleración y 50m.",
    [Attribute.Technique]: "Eficiencia en el agua. Fundamental para 100m y 200m.",
    [Attribute.Stamina]: "Fondo físico. Vital para no 'morir' en el 200m.",
    [Attribute.Speed]: "Ritmo de brazada máximo. Esencial para 50m y 100m.",
    [Attribute.Mental]: "Control de nervios y regularidad en competición.",
    [Attribute.StartTurn]: "Salidas, virajes y subacuáticos. Mejora el tiempo total."
};

export const TRAINING_EXERCISES = [
    { id: 'weights', name: 'Pesas (Gimnasio)', stat: Attribute.Strength, minGain: 1, maxGain: 5, desc: 'Fuerza explosiva y potencia.' },
    { id: 'drills', name: 'Técnica', stat: Attribute.Technique, minGain: 1, maxGain: 5, desc: 'Ejercicios de estilo y eficiencia.' },
    { id: 'cardio', name: 'Series Aeróbicas', stat: Attribute.Stamina, minGain: 1, maxGain: 5, desc: 'Resistencia pura y capacidad pulmonar.' },
    { id: 'sprints', name: 'Sprints', stat: Attribute.Speed, minGain: 1, maxGain: 5, desc: 'Velocidad punta y ritmo de nado.' },
    { id: 'dive_turn', name: 'Saltos y Virajes', stat: Attribute.StartTurn, minGain: 1, maxGain: 5, desc: 'Reacción en poyete y vueltas rápidas.' },
    { id: 'meditation', name: 'Psicología', stat: Attribute.Mental, minGain: 1, maxGain: 5, desc: 'Visualización y control mental.' },
];

export const SHOP_ITEMS = [
    { id: 'protein_shake', name: 'Batido de Proteínas', price: 200, desc: 'Mejora ligeramente la Fuerza o Resistencia.', type: 'random', min: 1, max: 2, stats: [Attribute.Strength, Attribute.Stamina] },
    { id: 'tech_suit', name: 'Bañador de Competición', price: 1000, desc: 'Mejora Técnica y Velocidad.', type: 'fixed', min: 2, max: 4, stats: [Attribute.Technique, Attribute.Speed] },
    { id: 'goggles', name: 'Gafas Hidrodinámicas', price: 500, desc: 'Mejora Salidas/Virajes.', type: 'fixed', min: 2, max: 3, stats: [Attribute.StartTurn] },
    { id: 'fins', name: 'Aletas de Entrenamiento', price: 300, desc: 'Entrenamiento de Fuerza en piernas.', type: 'fixed', min: 1, max: 3, stats: [Attribute.Strength] },
    { id: 'private_coach', name: 'Sesión Privada', price: 2000, desc: 'Mejora significativa de una estadística aleatoria.', type: 'random', min: 3, max: 6 },
    { id: 'sports_psychologist', name: 'Psicólogo Deportivo', price: 1500, desc: 'Mejora tu Mentalidad.', type: 'fixed', min: 3, max: 5, stats: [Attribute.Mental] },
];

// Time in milliseconds
const HOUR = 3600000;
const MINUTE = 60000;

export const COMPETITION_CONFIG = [
    { id: CompetitionTier.Triangular, name: 'Triangular Amistoso', interval: 30 * MINUTE },
    { id: CompetitionTier.Provincial, name: 'Campeonato Provincial', interval: 4 * HOUR },
    { id: CompetitionTier.Regional, name: 'Campeonato Regional', interval: 10 * HOUR },
    { id: CompetitionTier.National, name: 'Campeonato Nacional', interval: 48 * HOUR },
    { id: CompetitionTier.InternationalClub, name: 'Copa Internacional de Clubes', interval: 12 * HOUR }, 
    { id: CompetitionTier.European, name: 'Campeonato Continental', interval: 144 * HOUR }, 
    { id: CompetitionTier.World, name: 'Campeonato del Mundo', interval: 336 * HOUR },
];

export const STROKES = [Stroke.Freestyle]; 
export const DISTANCES = [50, 100, 200];

export const MAX_ENERGY = 8; 
export const ENERGY_RECHARGE_MS = 30 * 60 * 1000; 

// Minimum qualifying times
export const MINIMUM_TIMES: Record<CompetitionTier, Record<number, number>> = {
    [CompetitionTier.Triangular]: { 50: 999, 100: 999, 200: 999 },
    [CompetitionTier.Provincial]: { 50: 999, 100: 999, 200: 999 },
    [CompetitionTier.Regional]: { 50: 35.42, 100: 80.76, 200: 167.38 }, // 2:47.38
    [CompetitionTier.National]: { 50: 29.88, 100: 70.44, 200: 145.44 }, // 2:25.44
    [CompetitionTier.InternationalClub]: { 50: 28.50, 100: 65.00, 200: 135.00 },
    [CompetitionTier.European]: { 50: 27.13, 100: 59.82, 200: 130.92 }, // 2:10.92
    [CompetitionTier.World]: { 50: 25.05, 100: 55.39, 200: 122.19 }, // 2:02.19
};