import { Club, Swimmer, CompetitionTier, StartListEntry, RaceResult, Stroke } from '../types';
import { calculateTime } from './gameLogic';
import { PRESTIGE_REWARDS, DEFAULT_TIME, CASH_REWARDS, CONTINENTS } from '../constants';

const DB_KEY = 'NADARPRO_DB_V2';

interface Database {
    players: Record<string, Swimmer>;
    clubs: Record<string, Club>;
    raceEntries: Record<string, StartListEntry[]>; 
    raceResults: Record<string, RaceResult[]>;
}

const getDB = (): Database => {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        return { players: {}, clubs: {}, raceEntries: {}, raceResults: {} };
    }
    const db = JSON.parse(raw);
    if (!db.raceResults) db.raceResults = {};
    return db;
};

const saveDB = (db: Database) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Helper to determine continent key
const getContinentKey = (countryId: string): string => {
    if (CONTINENTS.EUROPE.includes(countryId)) return 'EU';
    if (CONTINENTS.ASIA.includes(countryId)) return 'AS';
    if (CONTINENTS.AMERICA_OCEANIA.includes(countryId)) return 'AO';
    return 'OTHER';
};

export const storageService = {
    // Player Methods
    getPlayer: (name: string): Swimmer | null => {
        const db = getDB();
        const player = Object.values(db.players).find(p => p.name.toLowerCase() === name.toLowerCase());
        return player || null;
    },

    getAllPlayers: (): Swimmer[] => {
        const db = getDB();
        return Object.values(db.players);
    },

    savePlayer: (swimmer: Swimmer) => {
        const db = getDB();
        db.players[swimmer.id] = swimmer;
        saveDB(db);
    },

    updatePlayerFields: (id: string, fields: Partial<Swimmer>) => {
        const db = getDB();
        if (db.players[id]) {
            db.players[id] = { ...db.players[id], ...fields };
            saveDB(db);
        }
    },

    // Club Methods
    getClubs: (): Club[] => {
        const db = getDB();
        return Object.values(db.clubs);
    },

    getClub: (id: string): Club | null => {
        const db = getDB();
        return db.clubs[id] || null;
    },

    saveClub: (club: Club) => {
        const db = getDB();
        db.clubs[club.id] = club;
        saveDB(db);
    },

    deleteClub: (clubId: string) => {
        const db = getDB();
        if (db.clubs[clubId]) {
            delete db.clubs[clubId];
            saveDB(db);
        }
    },

    getClubMemberCount: (clubId: string): number => {
        const db = getDB();
        return Object.values(db.players).filter(p => p.clubId === clubId).length;
    },

    getClubMembers: (clubId: string): Swimmer[] => {
        const db = getDB();
        return Object.values(db.players).filter(p => p.clubId === clubId);
    },

    // Helper to generate geographic keys
    getRaceKey: (tier: CompetitionTier, distance: number, startTime: number, club?: Club | null): string => {
        let suffix = '';

        if (club) {
            if (tier === CompetitionTier.Provincial) {
                // Key: Provincial-Z1-50-123456
                suffix = club.location.countryId === 'ES' && club.location.zoneId ? `-${club.location.zoneId}` : '-GEN'; 
            } else if (tier === CompetitionTier.Regional) {
                // Key: Regional-CLM-50-123456
                suffix = club.location.countryId === 'ES' && club.location.regionId ? `-${club.location.regionId}` : '-GEN';
            } else if (tier === CompetitionTier.National) {
                // Key: National-ES-50-123456
                suffix = `-${club.location.countryId}`;
            } else if (tier === CompetitionTier.European) {
                // Logic: Continental Split
                const cont = getContinentKey(club.location.countryId);
                suffix = `-${cont}`;
            }
        } else {
             // Fallback for players without club
             if ([CompetitionTier.Provincial, CompetitionTier.Regional, CompetitionTier.National, CompetitionTier.European].includes(tier)) {
                 suffix = '-OPEN';
             }
        }

        // International Club Cup and others are global
        return `${tier}${suffix}-${distance}-${startTime}`;
    },

    // Competition Methods
    registerForRace: (tier: CompetitionTier, distance: number, startTime: number, entry: StartListEntry) => {
        const db = getDB();
        
        // Find player club to determine location key
        const player = db.players[entry.playerId];
        const club = player && player.clubId ? db.clubs[player.clubId] : null;
        
        const raceKey = storageService.getRaceKey(tier, distance, startTime, club);
        
        if (!db.raceEntries[raceKey]) {
            db.raceEntries[raceKey] = [];
        }

        db.raceEntries[raceKey] = db.raceEntries[raceKey].filter(e => e.playerId !== entry.playerId);
        db.raceEntries[raceKey].push(entry);
        
        saveDB(db);
    },

    unregisterFromRace: (tier: CompetitionTier, distance: number, startTime: number, playerId: string) => {
        const db = getDB();
        
        // We need to reconstruct the key. Assuming the player is still in the same club.
        const player = db.players[playerId];
        const club = player && player.clubId ? db.clubs[player.clubId] : null;
        const raceKey = storageService.getRaceKey(tier, distance, startTime, club);

        if (db.raceEntries[raceKey]) {
            db.raceEntries[raceKey] = db.raceEntries[raceKey].filter(e => e.playerId !== playerId);
            saveDB(db);
        }
    },

    getRaceEntries: (tier: CompetitionTier, distance: number, startTime: number, contextClub?: Club | null): StartListEntry[] => {
        const db = getDB();
        // The UI passes the current user's club as context so we know which list to fetch
        const raceKey = storageService.getRaceKey(tier, distance, startTime, contextClub);
        const rawEntries = db.raceEntries[raceKey] || [];

        return rawEntries.map(entry => {
            if (entry.isPlayer && entry.playerId && db.players[entry.playerId]) {
                const player = db.players[entry.playerId];
                const club = player.clubId ? db.clubs[player.clubId] : null;
                const pbKey = `${Stroke.Freestyle}-${distance}`;
                const currentPB = player.personalBests[pbKey] || DEFAULT_TIME;

                return {
                    ...entry,
                    name: player.name,
                    club: club ? club.name : "Sin Club",
                    entryTime: currentPB
                };
            }
            return entry;
        });
    },

    processRaceResults: (tier: CompetitionTier, distance: number, startTime: number, stroke: Stroke, contextClub?: Club | null): RaceResult[] => {
        const db = getDB();
        const raceKey = storageService.getRaceKey(tier, distance, startTime, contextClub);

        if (db.raceResults[raceKey]) {
            return db.raceResults[raceKey];
        }

        const entries = db.raceEntries[raceKey] || [];
        if (entries.length === 0) return [];

        const results: RaceResult[] = entries.map(entry => {
            let raceTime = entry.entryTime;
            let clubName = entry.club;
            const player = db.players[entry.playerId];

            if (player) {
                raceTime = calculateTime(player.stats, distance, stroke);
                if (player.clubId && db.clubs[player.clubId]) {
                    clubName = db.clubs[player.clubId].name;
                } else {
                    clubName = "Sin Club";
                }
            } else {
                if (Math.abs(raceTime - DEFAULT_TIME) < 1) {
                    raceTime = (distance === 50 ? 30 : 65) + (Math.random() * 10 - 5);
                } else {
                    raceTime = entry.entryTime + (Math.random() * 1.5 - 0.75);
                }
            }

            return {
                rank: 0,
                swimmerName: entry.name,
                club: clubName,
                time: raceTime,
                isPlayer: !!player,
                playerId: entry.playerId
            };
        });

        results.sort((a, b) => a.time - b.time);
        results.forEach((r, i) => r.rank = i + 1);

        results.forEach(result => {
            if (result.playerId && db.players[result.playerId]) {
                const p = db.players[result.playerId];
                const pbKey = `${stroke}-${distance}`;
                const currentPB = p.personalBests[pbKey] || DEFAULT_TIME;
                
                if (result.time < currentPB) {
                    p.personalBests[pbKey] = result.time;
                }

                if (tier !== CompetitionTier.Triangular) {
                    const xpGain = Math.max(10, 110 - (result.rank * 10)) * (
                        tier === CompetitionTier.World ? 5 :
                        tier === CompetitionTier.European ? 3 : 
                        1
                    );

                    p.xp += xpGain;
                    p.level = Math.floor(p.xp / 100) + 1;

                    const rewards = CASH_REWARDS[tier] || [0, 0, 0, 0];
                    let prizeMoney = 0;
                    if (result.rank === 1) prizeMoney = rewards[0];
                    else if (result.rank === 2) prizeMoney = rewards[1];
                    else if (result.rank === 3) prizeMoney = rewards[2];
                    else if (result.rank <= 8) prizeMoney = rewards[3];

                    if (p.money === undefined) p.money = 0;
                    p.money += prizeMoney;

                    // Generate a zone name for history
                    let zoneLabel = "";
                    if (contextClub && tier === CompetitionTier.Provincial) zoneLabel = contextClub.location.zoneId || "";
                    if (contextClub && tier === CompetitionTier.Regional) zoneLabel = contextClub.location.regionId || "";
                    if (contextClub && tier === CompetitionTier.National) zoneLabel = contextClub.location.countryId || "";
                    if (contextClub && tier === CompetitionTier.European) zoneLabel = getContinentKey(contextClub.location.countryId);

                    p.history.unshift({
                        id: raceKey,
                        tier,
                        stroke,
                        distance,
                        time: result.time,
                        rank: result.rank,
                        date: 1, 
                        realTimeDate: Date.now(),
                        zoneName: zoneLabel
                    });

                    if (result.rank === 1) p.medals.gold++;
                    if (result.rank === 2) p.medals.silver++;
                    if (result.rank === 3) p.medals.bronze++;

                    if (result.rank <= 3 && p.clubId && db.clubs[p.clubId]) {
                        const prestigeRewards = PRESTIGE_REWARDS[tier];
                        if (prestigeRewards) {
                            db.clubs[p.clubId].prestige += prestigeRewards[result.rank - 1];
                        }
                    }
                }
            }
        });

        db.raceResults[raceKey] = results;
        saveDB(db);

        return results;
    },

    getOfficialResults: (tier: CompetitionTier, startTime: number, contextClub?: Club | null): { distance: number, results: RaceResult[] }[] => {
        const db = getDB();
        const distances = [50, 100, 200];
        const output: { distance: number, results: RaceResult[] }[] = [];

        distances.forEach(dist => {
            const raceKey = storageService.getRaceKey(tier, dist, startTime, contextClub);
            if (db.raceResults[raceKey]) {
                output.push({ distance: dist, results: db.raceResults[raceKey] });
            }
        });

        return output;
    }
};