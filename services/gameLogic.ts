import { Stats, Attribute, Stroke, StartListEntry } from '../types';

// Helper to format time
export const formatTime = (seconds: number): string => {
    if (seconds >= 3599) return "59:59.99";

    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
    return `${min > 0 ? `${min}:` : ''}${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

// Physics Constants for simulation
const WORLD_RECORDS: Record<number, number> = { 50: 20.91, 100: 46.80, 200: 102.00 };
const BASE_TIMES: Record<number, number> = { 50: 45.0, 100: 105.0, 200: 240.0 }; // Times for a novice (stats ~10)

// Attribute Weights per Distance
// This defines the "DNA" of each race type
const DISTANCE_WEIGHTS: Record<number, Partial<Record<Attribute, number>>> = {
    50: {
        [Attribute.Strength]: 0.30,  // Explosive start & power
        [Attribute.Speed]: 0.30,     // Stroke rate
        [Attribute.Technique]: 0.15, // Efficiency
        [Attribute.StartTurn]: 0.20, // Huge impact on 50m (start is 20% of race)
        [Attribute.Stamina]: 0.05,   // Barely matters
    },
    100: {
        [Attribute.Strength]: 0.15,
        [Attribute.Speed]: 0.20,
        [Attribute.Technique]: 0.30, // Technique becomes vital
        [Attribute.StartTurn]: 0.15, // Still important (1 turn + start)
        [Attribute.Stamina]: 0.20,   // Endurance starts to matter
    },
    200: {
        [Attribute.Strength]: 0.05,  // Muscle bulk can be drag
        [Attribute.Speed]: 0.10,
        [Attribute.Technique]: 0.35, // Efficiency is king
        [Attribute.Stamina]: 0.40,   // Aerobic capacity is queen
        [Attribute.StartTurn]: 0.10, // 3 turns, but smaller % of total time
    }
};

export const calculateTime = (stats: Stats, distance: number, stroke: Stroke): number => {
    const weights = DISTANCE_WEIGHTS[distance] || DISTANCE_WEIGHTS[100];
    const baseTime = BASE_TIMES[distance] || 120;
    const minTime = WORLD_RECORDS[distance] || 50;

    // 1. Calculate Weighted Performance Score
    // We treat stats as if 100 is "Elite". The game allows going higher, which beats records.
    let performanceScore = 0;
    
    // Ensure StartTurn has a default if missing from legacy saves in logic
    const startTurnVal = stats[Attribute.StartTurn] || 10;
    const statsWithDefaults = { ...stats, [Attribute.StartTurn]: startTurnVal };

    performanceScore += (statsWithDefaults[Attribute.Strength] * (weights[Attribute.Strength] || 0));
    performanceScore += (statsWithDefaults[Attribute.Speed] * (weights[Attribute.Speed] || 0));
    performanceScore += (statsWithDefaults[Attribute.Technique] * (weights[Attribute.Technique] || 0));
    performanceScore += (statsWithDefaults[Attribute.Stamina] * (weights[Attribute.Stamina] || 0));
    performanceScore += (statsWithDefaults[Attribute.StartTurn] * (weights[Attribute.StartTurn] || 0));

    // 2. Mental Stat Logic (Variance)
    // High Mental = Consistent times close to your potential.
    // Low Mental = High volatility (could be great, usually bad).
    const mentalStat = statsWithDefaults[Attribute.Mental];
    const mentalFactor = Math.min(1, mentalStat / 100); // 0 to 1
    
    // Base variance is +/- 3% of the time for a novice, decreasing to +/- 0.5% for a pro
    const maxVariancePct = 0.05 - (mentalFactor * 0.04); 
    const randomVariance = (Math.random() * 2 - 1) * maxVariancePct; // -0.05 to +0.05

    // "In The Zone" Bonus: Very small chance to get a massive boost if Mental is high
    let zoneBonus = 0;
    if (Math.random() < (mentalStat / 500)) { // e.g. 50 Mental = 10% chance
        zoneBonus = 0.02; // 2% faster
    }

    // 3. Map Score to Time
    // We use a logarithmic decay curve. Gaining stats at low level helps A LOT.
    // Gaining stats at high level helps a little.
    
    // Normalize score roughly relative to 100.
    // If score is 10, improvement is small. If score is 100, improvement is huge.
    // Formula: Time = Base - (Diff * (1 - 1/(1 + k*Score)))
    // Where Diff = Base - Min
    const maxImprovement = baseTime - minTime;
    
    // Curve factor 'k'. 
    // If Score = 10, we want time to be approx Base.
    // If Score = 100, we want time to be approx Min.
    const k = 0.025; 
    const improvementRatio = 1 - (1 / (1 + (k * performanceScore)));
    
    let calculatedTime = baseTime - (maxImprovement * improvementRatio);

    // Apply Variance & Bonus
    calculatedTime = calculatedTime * (1 + randomVariance - zoneBonus);

    // Hard floor just in case (World Record - 10%)
    const hardFloor = minTime * 0.9;
    if (calculatedTime < hardFloor) calculatedTime = hardFloor + Math.random();

    return calculatedTime;
};

// Generate Heat Sheets with Spearhead seeding (Center lanes are fastest)
export const organizeHeats = (entries: StartListEntry[]): { heat: number, lane: number, entry: StartListEntry }[] => {
    // 1. Sort by entry time (Fastest to Slowest)
    const sorted = [...entries].sort((a, b) => a.entryTime - b.entryTime);
    
    // 2. Chunk into heats of 8
    const heats: StartListEntry[][] = [];
    for (let i = 0; i < sorted.length; i += 8) {
        heats.push(sorted.slice(i, i + 8));
    }

    // 3. Reverse heats so fastest heat is last
    heats.reverse();

    const result: { heat: number, lane: number, entry: StartListEntry }[] = [];
    const laneOrder = [4, 5, 3, 6, 2, 7, 1, 8]; // 1-based index

    heats.forEach((heatEntries, heatIndex) => {
        // heatEntries are sorted fast -> slow.
        // Assign to laneOrder.
        heatEntries.forEach((entry, idx) => {
            result.push({
                heat: heatIndex + 1,
                lane: laneOrder[idx],
                entry
            });
        });
    });

    return result;
};