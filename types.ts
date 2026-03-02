
export enum Attribute {
    Strength = 'Fuerza',
    Technique = 'Técnica',
    Stamina = 'Resistencia',
    Mental = 'Mentalidad',
    Speed = 'Velocidad',
    StartTurn = 'Salidas/Virajes' // New Attribute
}

export enum CompetitionTier {
    Triangular = 'Triangular',
    Provincial = 'Provincial',
    Regional = 'Regional',
    National = 'Nacional',
    InternationalClub = 'Copa Internacional', 
    European = 'Europeo',
    World = 'Mundial'
}

export enum Stroke {
    Freestyle = 'Crol'
}

export interface Stats {
    [Attribute.Strength]: number;
    [Attribute.Technique]: number;
    [Attribute.Stamina]: number;
    [Attribute.Mental]: number;
    [Attribute.Speed]: number;
    [Attribute.StartTurn]: number; // New Attribute
}

export interface ClubLogo {
    icon: string;
    color: string;
    bgColor: string;
}

export interface ClubLocation {
    countryId: string; 
    regionId?: string; 
    zoneId?: string;   
    cityName: string;
}

export interface Club {
    id: string;
    name: string;
    prestige: number;
    description: string;
    logo: ClubLogo;
    location: ClubLocation; 
    ownerId: string; 
}

export interface RaceResult {
    rank: number;
    swimmerName: string;
    club: string;
    time: number;
    isPlayer: boolean;
    playerId?: string;
    lane?: number;
    heat?: number;
    entryTime?: number;
    recordBroken?: 'National' | 'European' | 'World'; // Track record breaking
}

export interface StartListEntry {
    playerId: string;
    name: string;
    club: string;
    entryTime: number;
    isPlayer: boolean;
}

export interface PastRace {
    id: string;
    tier: CompetitionTier;
    stroke: Stroke;
    distance: number;
    time: number;
    rank: number;
    date: number; 
    realTimeDate: number; 
    zoneName?: string; 
}

export interface Medals {
    gold: number;
    silver: number;
    bronze: number;
}

export interface Swimmer {
    id: string;
    name: string;
    clubId: string | null; 
    stats: Stats;
    level: number;
    xp: number;
    money: number;
    personalBests: Record<string, number>; 
    history: PastRace[];
    medals: Medals;
    energy: number;
    lastEnergyUpdate: number;
}

export interface GameState {
    day: number;
    swimmer: Swimmer | null;
    selectedTab: 'dashboard' | 'training' | 'competition' | 'profile' | 'club' | 'ranking';
    clubs: Club[]; 
}

export interface RecordHolder {
    time: number;
    holderName: string;
    holderId: string;
    clubName: string;
    clubCountry: string;
    date: number;
}