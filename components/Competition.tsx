import React, { useState, useEffect } from 'react';
import { COMPETITION_CONFIG, DISTANCES, MINIMUM_TIMES, DEFAULT_TIME, CONTINENTS } from '../constants';
import { CompetitionTier, Stroke, RaceResult, PastRace, Swimmer, StartListEntry } from '../types';
import { formatTime, organizeHeats } from '../services/gameLogic';
import { storageService } from '../services/storageService';

interface CompetitionProps {
    swimmer: Swimmer;
    day: number;
    onRaceComplete: (result: PastRace) => void;
    onUpdateSwimmer: () => void;
    onViewPlayer?: (playerId: string) => void;
}

export const Competition: React.FC<CompetitionProps> = ({ swimmer, day, onRaceComplete, onUpdateSwimmer, onViewPlayer }) => {
    const [selectedTier, setSelectedTier] = useState<CompetitionTier | null>(null);
    const [selectedDist, setSelectedDist] = useState<number>(100);
    const selectedStroke = Stroke.Freestyle;
    
    const [viewMode, setViewMode] = useState<'menu' | 'startList' | 'racing' | 'officialDocs'>('menu');
    const [raceResults, setRaceResults] = useState<RaceResult[] | null>(null);
    const [officialDocs, setOfficialDocs] = useState<{ distance: number, results: RaceResult[] }[]>([]);
    
    const [now, setNow] = useState(Date.now());
    const [entries, setEntries] = useState<StartListEntry[]>([]);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getNextRaceTime = (tierId: CompetitionTier, interval: number) => {
        return Math.ceil(now / interval) * interval;
    };

    const getPrevRaceTime = (tierId: CompetitionTier, interval: number) => {
        return Math.floor(now / interval) * interval;
    };

    const getTimeUntil = (targetTime: number) => {
        const diff = targetTime - now;
        if (diff < 0) return "En curso";
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const hasQualifyingTime = (tier: CompetitionTier, dist: number): boolean => {
        const tierMins = MINIMUM_TIMES[tier];
        if (tierMins[dist] === 999) return true;
        const pb = swimmer.personalBests[`${Stroke.Freestyle}-${dist}`] || DEFAULT_TIME;
        return pb <= tierMins[dist];
    };

    // Logic to determine if user can see/enter this competition based on geography
    const canEnterTier = (tier: CompetitionTier) => {
        if (tier === CompetitionTier.Triangular) return true;
        if (tier === CompetitionTier.World) return true;
        if (tier === CompetitionTier.European) return true; // Everyone can enter their continent's cup

        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        if (!myClub) return false; // Must be in a club for official leagues

        if (tier === CompetitionTier.InternationalClub) {
            return myClub.location.countryId !== 'ES';
        }

        // For Provincial, Regional, National, you must be in Spain (as per current logic structure)
        // If club is Spanish, they can do these.
        if (myClub.location.countryId === 'ES') {
            return true;
        }

        // Non-Spanish clubs skip Provincial/Regional/National and do International Cup instead
        return false;
    };

    const getDisplayTitle = (tier: CompetitionTier) => {
        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        if (!myClub) return tier; // Fallback

        if (tier === CompetitionTier.Provincial) return `${tier} (${myClub.location.zoneId || 'General'})`;
        if (tier === CompetitionTier.Regional) return `${tier} (${myClub.location.regionId || 'General'})`;
        if (tier === CompetitionTier.National) return `${tier} (${myClub.location.countryId})`;
        if (tier === CompetitionTier.European) {
             const cid = myClub.location.countryId;
             if (CONTINENTS.ASIA.includes(cid)) return "Copa Asiática";
             if (CONTINENTS.AMERICA_OCEANIA.includes(cid)) return "Copa Pacífico-América";
             return "Campeonato de Europa"; // Default for Europe or others
        }
        
        return tier;
    };

    const getRegistrationStatus = (tier: CompetitionTier, dist: number) => {
        const nextStart = getNextRaceTime(tier, COMPETITION_CONFIG.find(c => c.id === tier)!.interval);
        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);
        
        const raceEntries = storageService.getRaceEntries(tier, dist, nextStart, myClub);
        return raceEntries.some(e => e.playerId === swimmer.id);
    };

    const getRegisteredCount = (tier: CompetitionTier) => {
        const nextStart = getNextRaceTime(tier, COMPETITION_CONFIG.find(c => c.id === tier)!.interval);
        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        let count = 0;
        DISTANCES.forEach(dist => {
            const raceEntries = storageService.getRaceEntries(tier, dist, nextStart, myClub);
            if (raceEntries.some(e => e.playerId === swimmer.id)) {
                count++;
            }
        });
        return count;
    };

    const handleRegister = (tier: CompetitionTier, dist: number, interval: number) => {
        const currentCount = getRegisteredCount(tier);
        if (currentCount >= 2) {
            alert("Solo puedes inscribirte en un máximo de 2 pruebas por competición.");
            return;
        }

        const myEntryTime = swimmer.personalBests[`${selectedStroke}-${dist}`] || DEFAULT_TIME;
        const nextStart = getNextRaceTime(tier, interval);
        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        const myEntry: StartListEntry = {
            playerId: swimmer.id,
            name: swimmer.name,
            club: myClub ? myClub.name : "Sin Club",
            entryTime: myEntryTime, 
            isPlayer: true
        };

        storageService.registerForRace(tier, dist, nextStart, myEntry);
        onUpdateSwimmer();
    };

    const handleUnregister = (tier: CompetitionTier, dist: number, interval: number) => {
        const nextStart = getNextRaceTime(tier, interval);
        storageService.unregisterFromRace(tier, dist, nextStart, swimmer.id);
        onUpdateSwimmer();
    };

    const openStartList = (tier: CompetitionTier, dist: number) => {
        setSelectedTier(tier);
        setSelectedDist(dist);
        const nextStart = getNextRaceTime(tier, COMPETITION_CONFIG.find(c => c.id === tier)!.interval);
        
        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        const raceEntries = storageService.getRaceEntries(tier, dist, nextStart, myClub);
        setEntries(raceEntries);
        setViewMode('startList');
    };

    const handleProcessRace = () => {
        if (!selectedTier) return;
        
        const interval = COMPETITION_CONFIG.find(c => c.id === selectedTier)!.interval;
        const raceTime = getNextRaceTime(selectedTier, interval);
        
        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        // Pass myClub context so backend knows which zone to process
        const results = storageService.processRaceResults(selectedTier, selectedDist, raceTime, selectedStroke, myClub);
        
        setRaceResults(results);
        setViewMode('racing');

        const myResult = results.find(r => r.playerId === swimmer.id);
        if (myResult) {
            onRaceComplete({
                id: Date.now().toString(),
                tier: selectedTier,
                stroke: selectedStroke,
                distance: selectedDist,
                time: myResult.time,
                rank: myResult.rank,
                date: day,
                realTimeDate: Date.now(),
                zoneName: myResult.club // Simplified
            });
        }
    };

    const handleViewOfficialDocs = (tier: CompetitionTier) => {
        const interval = COMPETITION_CONFIG.find(c => c.id === tier)!.interval;
        let targetTime = getNextRaceTime(tier, interval);
        
        if (targetTime - now > 5 * 60 * 1000) {
            targetTime = getPrevRaceTime(tier, interval);
        }

        const clubs = storageService.getClubs();
        const myClub = clubs.find(c => c.id === swimmer.clubId);

        // Process all distances for the specific zone of the user
        [50, 100, 200].forEach(d => storageService.processRaceResults(tier, d, targetTime, Stroke.Freestyle, myClub));

        const docs = storageService.getOfficialResults(tier, targetTime, myClub);
        setOfficialDocs(docs);
        setSelectedTier(tier);
        setViewMode('officialDocs');
    };

    const renderOfficialDocs = () => {
        if (!selectedTier) return null;

        return (
            <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-w-5xl mx-auto border border-white/40">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center print:hidden relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-cyan-900 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <div className="uppercase tracking-widest text-xs font-bold text-cyan-400 mb-2">Federación de Natación</div>
                        <h2 className="text-4xl font-black sport-font uppercase">Acta Oficial</h2>
                        <p className="opacity-70 mt-1 font-mono text-sm">{getDisplayTitle(selectedTier)} • {new Date().toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setViewMode('menu')} className="bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-lg font-bold hover:bg-white/20 border border-white/20">Cerrar</button>
                </div>

                <div className="p-8 bg-white/90 min-h-[600px] overflow-y-auto">
                    {officialDocs.length === 0 ? (
                        <div className="text-center text-slate-500 py-12">
                            Aún no hay resultados oficiales procesados para este ciclo en tu zona.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {officialDocs.map(doc => (
                                <div key={doc.distance} className="border border-slate-200 rounded-xl p-6 shadow-sm bg-white overflow-hidden">
                                    <h3 className="text-xl font-bold border-b pb-4 mb-4 flex justify-between">
                                        <span className="sport-font text-slate-800">{doc.distance}m Libres</span>
                                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{doc.results.length} Participantes</span>
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-400 text-left text-[10px] uppercase font-bold tracking-wider">
                                                    <th className="pb-2 w-10">Pos</th>
                                                    <th className="pb-2">Nadador</th>
                                                    <th className="pb-2 text-right">Tiempo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {doc.results.map((r) => (
                                                    <tr key={r.rank} className={`border-b last:border-0 ${r.playerId === swimmer.id ? 'bg-cyan-50' : ''}`}>
                                                        <td className="py-2 font-mono font-bold text-slate-400">{r.rank}</td>
                                                        <td className="py-2">
                                                            <button 
                                                                onClick={() => r.playerId && onViewPlayer && onViewPlayer(r.playerId)}
                                                                className="font-bold text-slate-700 hover:text-cyan-600 text-left"
                                                            >
                                                                {r.swimmerName}
                                                            </button>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase">{r.club}</div>
                                                        </td>
                                                        <td className="py-2 text-right font-mono font-bold text-slate-800">{formatTime(r.time)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const renderStartList = () => {
        if (!selectedTier) return null;
        const tierConfig = COMPETITION_CONFIG.find(c => c.id === selectedTier)!;
        const nextStart = getNextRaceTime(selectedTier, tierConfig.interval);

        const seededEntries = organizeHeats(entries);
        const heats: Record<number, typeof seededEntries> = {};
        seededEntries.forEach(e => {
            if (!heats[e.heat]) heats[e.heat] = [];
            heats[e.heat].push(e);
        });

        const raceHasStarted = now >= nextStart;

        return (
            <div className="glass-panel rounded-2xl shadow-xl overflow-hidden animate-fade-in max-w-4xl mx-auto border border-white/50">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black sport-font uppercase">Listas de Salida</h2>
                        <p className="opacity-80 font-mono text-sm text-cyan-300">{selectedDist}m {selectedStroke} • {getDisplayTitle(selectedTier)}</p>
                    </div>
                    <button onClick={() => setViewMode('menu')} className="text-sm bg-white/10 px-4 py-2 rounded hover:bg-white/20 backdrop-blur-md relative z-10">Cerrar</button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[600px] space-y-8 bg-slate-50/50">
                    {Object.keys(heats).length === 0 && (
                        <div className="text-center text-slate-500 py-8 font-medium">
                            No hay nadadores registrados aún.
                        </div>
                    )}
                    {Object.keys(heats).map(heatNum => {
                        const hEntries = heats[parseInt(heatNum)].sort((a,b) => a.lane - b.lane);
                        return (
                            <div key={heatNum} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-600 border-b text-xs uppercase tracking-widest flex justify-between">
                                    <span>Serie {heatNum}</span>
                                    <span>{hEntries.length} Nadadores</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                                                <th className="px-4 py-2 w-16 text-center">Calle</th>
                                                <th className="px-4 py-2">Nadador</th>
                                                <th className="px-4 py-2 hidden sm:table-cell">Club</th>
                                                <th className="px-4 py-2 text-right">Marca</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hEntries.map((row) => (
                                                <tr key={row.lane} className={`border-b last:border-0 ${row.entry.isPlayer ? 'bg-cyan-50' : ''}`}>
                                                    <td className="px-4 py-3 font-mono font-bold text-center bg-slate-50/50 border-r text-slate-600">{row.lane}</td>
                                                    <td className="px-4 py-3">
                                                        <button 
                                                            onClick={() => row.entry.playerId && onViewPlayer && onViewPlayer(row.entry.playerId)}
                                                            className={`font-bold hover:underline text-left ${row.entry.isPlayer ? 'text-cyan-700' : 'text-slate-700 hover:text-cyan-600'}`}
                                                        >
                                                            {row.entry.name}
                                                        </button>
                                                        <div className="sm:hidden text-xs text-slate-500">{row.entry.club}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs uppercase font-bold hidden sm:table-cell">{row.entry.club}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatTime(row.entry.entryTime)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-white border-t flex justify-center">
                    {raceHasStarted ? (
                        <button 
                            onClick={handleProcessRace}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-lg shadow-lg animate-pulse uppercase tracking-widest text-sm"
                        >
                            ¡Al Agua! 🔫
                        </button>
                    ) : (
                         <div className="flex flex-col items-center">
                             <div className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest">Cámara de Llamadas abre en</div>
                             <div className="mono-font text-3xl font-bold text-blue-600">
                                {getTimeUntil(nextStart)}
                             </div>
                         </div>
                    )}
                </div>
            </div>
        );
    };

    if (viewMode === 'officialDocs') return renderOfficialDocs();
    if (viewMode === 'startList') return renderStartList();

    if (viewMode === 'racing' && raceResults) {
        return (
             <div className="max-w-3xl mx-auto glass-panel rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-white/50">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white text-center shadow-lg relative">
                    <h2 className="text-4xl font-black sport-font mb-2 uppercase italic">Resultados</h2>
                    <p className="opacity-90 font-mono text-cyan-100">{selectedDist}m {selectedStroke} • {getDisplayTitle(selectedTier)}</p>
                </div>
                <div className="p-6 bg-white/80">
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr className="text-xs text-slate-500 border-b uppercase font-bold tracking-wider">
                                    <th className="py-3 pl-4">Pos</th>
                                    <th className="py-3">Nadador</th>
                                    <th className="py-3 text-right pr-4">Tiempo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {raceResults.map((result) => (
                                    <tr key={result.rank} className={`border-b last:border-0 ${result.isPlayer ? 'bg-cyan-50' : ''}`}>
                                        <td className="py-3 pl-4">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold shadow-sm ${result.rank === 1 ? 'bg-yellow-400 text-yellow-900' : result.rank === 2 ? 'bg-slate-300 text-slate-800' : result.rank === 3 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-500'}`}>
                                                {result.rank}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <button
                                                onClick={() => result.playerId && onViewPlayer && onViewPlayer(result.playerId)} 
                                                className={`font-bold hover:underline text-left block ${result.isPlayer ? 'text-cyan-800' : 'text-slate-700 hover:text-cyan-600'}`}
                                            >
                                                {result.swimmerName}
                                            </button>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{result.club}</span>
                                        </td>
                                        <td className="py-3 text-right font-mono font-bold text-slate-800 pr-4 text-lg">{formatTime(result.time)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={() => { setRaceResults(null); setViewMode('menu'); setSelectedTier(null); }} className="w-full mt-6 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors uppercase tracking-widest text-xs">Volver al menú</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="max-w-4xl mx-auto space-y-4">
                {COMPETITION_CONFIG.map((tier) => {
                    const nextRaceStart = getNextRaceTime(tier.id, tier.interval);
                    const registeredCount = getRegisteredCount(tier.id);
                    const isAccessible = canEnterTier(tier.id);
                    const displayTitle = getDisplayTitle(tier.id);
                    
                    if (!isAccessible) return null; // Hide unavailable tiers

                    return (
                        <div key={tier.id} className="w-full text-left p-6 rounded-2xl border relative overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow border-slate-100">
                            {/* Decorative accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-500 to-cyan-400"></div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4 pl-4">
                                <div>
                                    <h4 className="font-black sport-font text-2xl text-slate-800 uppercase italic">{displayTitle}</h4>
                                    <div className="text-sm text-slate-500 flex flex-col md:flex-row gap-2 md:gap-4 mt-1">
                                        <span className="font-mono text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded">Próxima: {getTimeUntil(nextRaceStart)}</span>
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Slots: <span className={registeredCount >= 2 ? 'text-red-500' : 'text-slate-600'}>{registeredCount}/2</span>
                                    </div>
                                    <div className="mt-2">
                                        <button 
                                            onClick={() => handleViewOfficialDocs(tier.id)}
                                            className="text-xs font-bold text-slate-400 hover:text-cyan-600 underline"
                                        >
                                            📄 Ver Resultados Anteriores
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {DISTANCES.map(dist => {
                                        const isUnlocked = hasQualifyingTime(tier.id, dist);
                                        const isRegistered = getRegistrationStatus(tier.id, dist);
                                        const raceHasStarted = isRegistered && now >= nextRaceStart;
                                        
                                        return (
                                            <div key={dist} className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-slate-400 mb-1">{dist}m</span>
                                                {isUnlocked ? (
                                                     raceHasStarted ? (
                                                        <button onClick={() => openStartList(tier.id, dist)} className="bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-xs animate-pulse shadow-lg hover:bg-green-600 uppercase tracking-wide">
                                                            COMPETIR
                                                        </button>
                                                    ) : isRegistered ? (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => openStartList(tier.id, dist)} className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-2 rounded-lg font-bold text-xs hover:bg-cyan-100 transition-colors">
                                                                Listas
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUnregister(tier.id, dist, tier.interval)}
                                                                className="bg-red-50 text-red-500 border border-red-100 px-2 py-2 rounded-lg font-bold text-xs hover:bg-red-100"
                                                                title="Cancelar Inscripción"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleRegister(tier.id, dist, tier.interval)} 
                                                            className={`px-4 py-2 rounded-lg font-bold text-xs text-white uppercase tracking-wide shadow-sm transition-all ${registeredCount >= 2 ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 hover:scale-105'}`}
                                                            disabled={registeredCount >= 2}
                                                        >
                                                            Inscribirse
                                                        </button>
                                                    )
                                                ) : (
                                                    <div className="bg-gray-50 text-gray-300 px-4 py-2 rounded-lg font-bold text-[10px] border border-gray-100 text-center w-[100px] select-none">
                                                        🔒 BLOQUEADO<br/>
                                                        <span className="opacity-75 mono-font">{formatTime(MINIMUM_TIMES[tier.id][dist])}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};