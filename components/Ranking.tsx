
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Club, Swimmer, Stroke, RecordHolder } from '../types';
import { formatTime } from '../services/gameLogic';
import { DISTANCES, COUNTRY_FLAGS } from '../constants';

interface RankedPlayer {
    rank: number;
    swimmerName: string;
    clubName: string;
    clubCountry: string;
    time: number;
    swimmerId: string;
}

interface RankingProps {
    onViewPlayer?: (playerId: string) => void;
}

export const Ranking: React.FC<RankingProps> = ({ onViewPlayer }) => {
    const [viewScope, setViewScope] = useState<'ES' | 'GLOBAL'>('ES'); // 'ES' for Spain, 'GLOBAL' for All
    const [tab, setTab] = useState<'clubs' | 'records' | 'official_records'>('clubs');
    const [selectedDistance, setSelectedDistance] = useState<number>(50); 
    const [clubs, setClubs] = useState<Club[]>([]);
    const [rankings, setRankings] = useState<RankedPlayer[]>([]);
    const [records, setRecords] = useState<Record<string, RecordHolder>>({});

    useEffect(() => {
        // Load Clubs sorted by Prestige and Filter by Scope
        const allClubs = storageService.getClubs().sort((a, b) => b.prestige - a.prestige);
        
        if (viewScope === 'ES') {
            setClubs(allClubs.filter(c => c.location.countryId === 'ES'));
        } else {
            setClubs(allClubs);
        }
    }, [viewScope]);

    useEffect(() => {
        setRecords(storageService.getRecords());
    }, [tab]);

    useEffect(() => {
        if (tab === 'records') {
            const players = storageService.getAllPlayers();
            const loadedClubs = storageService.getClubs();
            
            const key = `${Stroke.Freestyle}-${selectedDistance}`;
            
            const ranked: RankedPlayer[] = players
                .map(p => {
                    const time = p.personalBests[key];
                    if (!time) return null; 
                    
                    const club = p.clubId ? loadedClubs.find(c => c.id === p.clubId) : null;
                    
                    // Filter based on viewScope
                    if (viewScope === 'ES') {
                        // If checking Spain records, player must be in a Spanish club
                        if (!club || club.location.countryId !== 'ES') return null;
                    }
                    
                    return {
                        swimmerName: p.name,
                        swimmerId: p.id,
                        clubName: club ? club.name : 'Sin Club',
                        clubCountry: club ? club.location.countryId : 'XX',
                        time: time,
                        rank: 0
                    };
                })
                .filter((p): p is RankedPlayer => p !== null)
                .sort((a, b) => a.time - b.time);

            ranked.forEach((p, i) => p.rank = i + 1);

            setRankings(ranked);
        }
    }, [tab, selectedDistance, viewScope]);

    const renderOfficialRecords = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 text-center uppercase tracking-wider">Récords Vigentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* World Records */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 overflow-hidden shadow-sm">
                    <div className="bg-yellow-400 px-4 py-2 text-yellow-900 font-bold text-center uppercase text-sm">Récords del Mundo (WR)</div>
                    <div className="divide-y divide-yellow-200/50">
                        {DISTANCES.map(dist => {
                            const rec = records[`WORLD-${dist}`];
                            return (
                                <div key={dist} className="p-4 flex justify-between items-center">
                                    <span className="font-bold text-slate-600 text-sm">{dist}m</span>
                                    {rec ? (
                                        <div className="text-right">
                                            <div className="font-mono font-black text-xl text-yellow-700">{formatTime(rec.time)}</div>
                                            <div className="text-xs text-slate-500 font-bold">{rec.holderName} ({rec.clubCountry})</div>
                                            <div className="text-[9px] text-slate-400">{new Date(rec.date).toLocaleDateString()}</div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">--:--.--</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* European Records */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 overflow-hidden shadow-sm">
                    <div className="bg-blue-400 px-4 py-2 text-white font-bold text-center uppercase text-sm">Récords Europa (ER)</div>
                    <div className="divide-y divide-blue-200/50">
                        {DISTANCES.map(dist => {
                            const rec = records[`EU-${dist}`];
                            return (
                                <div key={dist} className="p-4 flex justify-between items-center">
                                    <span className="font-bold text-slate-600 text-sm">{dist}m</span>
                                    {rec ? (
                                        <div className="text-right">
                                            <div className="font-mono font-black text-xl text-blue-700">{formatTime(rec.time)}</div>
                                            <div className="text-xs text-slate-500 font-bold">{rec.holderName} ({rec.clubCountry})</div>
                                            <div className="text-[9px] text-slate-400">{new Date(rec.date).toLocaleDateString()}</div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">--:--.--</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* National Records (Spain) */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 overflow-hidden shadow-sm">
                    <div className="bg-red-500 px-4 py-2 text-white font-bold text-center uppercase text-sm">Récords España (NR)</div>
                    <div className="divide-y divide-red-200/50">
                        {DISTANCES.map(dist => {
                            const rec = records[`ES-${dist}`];
                            return (
                                <div key={dist} className="p-4 flex justify-between items-center">
                                    <span className="font-bold text-slate-600 text-sm">{dist}m</span>
                                    {rec ? (
                                        <div className="text-right">
                                            <div className="font-mono font-black text-xl text-red-700">{formatTime(rec.time)}</div>
                                            <div className="text-xs text-slate-500 font-bold">{rec.holderName}</div>
                                            <div className="text-[9px] text-slate-400">{new Date(rec.date).toLocaleDateString()}</div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">--:--.--</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 rounded-3xl p-8 text-center text-white shadow-2xl relative overflow-hidden border-b-4 border-cyan-500">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
                <h2 className="text-4xl font-black sport-font mb-2 uppercase tracking-wide relative z-10">Salón de la Fama</h2>
                <p className="opacity-70 text-cyan-100 relative z-10">Los equipos más prestigiosos y las leyendas de la piscina.</p>
                
                {/* Scope Switcher */}
                <div className="flex justify-center gap-4 mt-6 relative z-10 mb-4">
                     <button
                        onClick={() => setViewScope('ES')}
                        className={`text-sm font-bold uppercase tracking-widest px-4 py-1 rounded-full transition-all ${viewScope === 'ES' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                     >
                        🇪🇸 España
                     </button>
                     <button
                        onClick={() => setViewScope('GLOBAL')}
                        className={`text-sm font-bold uppercase tracking-widest px-4 py-1 rounded-full transition-all ${viewScope === 'GLOBAL' ? 'bg-cyan-400 text-slate-900' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                     >
                        🌍 Global
                     </button>
                </div>

                <div className="flex justify-center gap-2 md:gap-4 relative z-10 flex-wrap">
                    <button 
                        onClick={() => setTab('clubs')}
                        className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all text-xs md:text-sm border ${tab === 'clubs' ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Clubes
                    </button>
                    <button 
                        onClick={() => setTab('records')}
                        className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all text-xs md:text-sm border ${tab === 'records' ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Ranking Tiempos
                    </button>
                    <button 
                        onClick={() => setTab('official_records')}
                        className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all text-xs md:text-sm border ${tab === 'official_records' ? 'bg-yellow-500 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Récords Oficiales
                    </button>
                </div>
            </div>

            {tab === 'official_records' && (
                <div className="glass-panel rounded-2xl p-6">
                    {renderOfficialRecords()}
                </div>
            )}

            {tab === 'clubs' && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-20 text-center">#</th>
                                    <th className="px-6 py-4">Club</th>
                                    <th className="px-6 py-4 text-right">Prestigio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {clubs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                            No hay clubes registrados en esta categoría.
                                        </td>
                                    </tr>
                                ) : (
                                    clubs.map((club, index) => (
                                        <tr key={club.id} className="hover:bg-cyan-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {index === 0 && <span className="text-2xl drop-shadow-sm">🥇</span>}
                                                {index === 1 && <span className="text-2xl drop-shadow-sm">🥈</span>}
                                                {index === 2 && <span className="text-2xl drop-shadow-sm">🥉</span>}
                                                {index > 2 && <span className="font-bold text-slate-400 font-mono">#{index + 1}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-md border-2 border-white text-xl ${club.logo.bgColor}`}>
                                                        <span className={club.logo.color}>{club.logo.icon}</span>
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-[10px] border border-slate-100">
                                                            {COUNTRY_FLAGS[club.location.countryId]}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-lg sport-font">{club.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium">
                                                            {club.location.cityName}
                                                            {club.location.countryId === 'ES' ? ` (${club.location.zoneId})` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-block bg-white border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm shadow-sm mono-font">
                                                    {club.prestige} pts
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'records' && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                     <div className="flex border-b border-slate-200/50 bg-white/40 overflow-x-auto">
                        {DISTANCES.map(dist => (
                            <button
                                key={dist}
                                onClick={() => setSelectedDistance(dist)}
                                className={`flex-1 py-4 px-4 text-sm font-bold transition-all whitespace-nowrap ${selectedDistance === dist ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-50/50'}`}
                            >
                                {dist}m Libres
                            </button>
                        ))}
                     </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-20 text-center">Pos</th>
                                    <th className="px-6 py-4">Nadador</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Club</th>
                                    <th className="px-6 py-4 text-right">Tiempo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {rankings.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            Nadie ha registrado tiempos en esta distancia aún.
                                        </td>
                                    </tr>
                                ) : (
                                    rankings.map((row) => (
                                        <tr key={row.swimmerId} className="hover:bg-cyan-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {row.rank === 1 && <span className="text-xl">🥇</span>}
                                                {row.rank === 2 && <span className="text-xl">🥈</span>}
                                                {row.rank === 3 && <span className="text-xl">🥉</span>}
                                                {row.rank > 3 && <span className="font-mono font-bold text-slate-400">#{row.rank}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => onViewPlayer && onViewPlayer(row.swimmerId)}
                                                    className="font-bold text-slate-800 hover:text-cyan-600 hover:underline text-left"
                                                >
                                                    {row.swimmerName}
                                                </button>
                                                <div className="text-xs text-slate-500 md:hidden flex items-center gap-1">
                                                    {COUNTRY_FLAGS[row.clubCountry]} {row.clubName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-slate-600 font-medium">
                                                 <div className="flex items-center gap-2">
                                                    <span className="text-lg">{COUNTRY_FLAGS[row.clubCountry]}</span>
                                                    {row.clubName}
                                                 </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-mono text-lg font-bold ${row.rank <= 3 ? 'text-cyan-600' : 'text-slate-700'}`}>
                                                    {formatTime(row.time)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
