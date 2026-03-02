import React, { useEffect, useState } from 'react';
import { Swimmer, Club } from '../types';
import { storageService } from '../services/storageService';
import { formatTime } from '../services/gameLogic';
import { Attribute } from '../types';

interface PlayerModalProps {
    playerId: string;
    onClose: () => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ playerId, onClose }) => {
    const [player, setPlayer] = useState<Swimmer | null>(null);
    const [club, setClub] = useState<Club | null>(null);
    const [sortedPBs, setSortedPBs] = useState<[string, number][]>([]);

    useEffect(() => {
        const p = storageService.getAllPlayers().find(p => p.id === playerId);
        if (p) {
            setPlayer(p);
            if (p.clubId) {
                setClub(storageService.getClub(p.clubId));
            }
            // Sort PBs
            const sorted = Object.entries(p.personalBests).sort((a, b) => {
                const distA = parseInt(a[0].split('-')[1]);
                const distB = parseInt(b[0].split('-')[1]);
                return distA - distB;
            });
            setSortedPBs(sorted);
        }
    }, [playerId]);

    if (!player) return null;

    // Helper for Stat Bars
    const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
        <div className="mb-2">
            <div className="flex justify-between text-xs uppercase font-bold text-slate-500 mb-1">
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color}`} 
                    style={{ width: `${Math.min(100, value)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-4 border-white relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Card Style */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white relative wet-shine">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm"
                    >
                        ✕
                    </button>
                    
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-black shadow-lg border-4 border-blue-200">
                            {player.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black sport-font leading-none">{player.name}</h2>
                            <p className="text-blue-100 font-bold opacity-90">{club ? club.name : 'Agente Libre'}</p>
                            <div className="mt-2 flex gap-2">
                                <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Nivel {player.level}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    
                    {/* Medals */}
                    <div className="flex justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-center flex-1 border-r border-slate-200 last:border-0">
                            <div className="text-2xl">🥇</div>
                            <div className="font-bold text-slate-800">{player.medals.gold}</div>
                        </div>
                        <div className="text-center flex-1 border-r border-slate-200 last:border-0">
                            <div className="text-2xl">🥈</div>
                            <div className="font-bold text-slate-800">{player.medals.silver}</div>
                        </div>
                        <div className="text-center flex-1">
                            <div className="text-2xl">🥉</div>
                            <div className="font-bold text-slate-800">{player.medals.bronze}</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 sport-font text-lg border-b pb-1">Atributos Físicos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <StatBar label="Fuerza" value={player.stats[Attribute.Strength]} color="bg-red-500" />
                                <StatBar label="Velocidad" value={player.stats[Attribute.Speed]} color="bg-yellow-500" />
                            </div>
                            <div>
                                <StatBar label="Técnica" value={player.stats[Attribute.Technique]} color="bg-purple-500" />
                                <StatBar label="Resistencia" value={player.stats[Attribute.Stamina]} color="bg-lime-500" />
                            </div>
                        </div>
                        <div className="mt-2">
                             <StatBar label="Mentalidad" value={player.stats[Attribute.Mental]} color="bg-blue-500" />
                        </div>
                    </div>

                    {/* Personal Bests */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 sport-font text-lg border-b pb-1">Mejores Marcas</h3>
                        <div className="space-y-2">
                            {sortedPBs.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Sin registros oficiales.</p>
                            ) : (
                                sortedPBs.map(([key, time]) => {
                                    const [stroke, dist] = key.split('-');
                                    return (
                                        <div key={key} className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-600 capitalize">{dist}m {stroke}</span>
                                            <span className="mono-font font-bold text-blue-600">{formatTime(time as number)}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Recent History */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 sport-font text-lg border-b pb-1">Última Carrera</h3>
                        {player.history.length > 0 ? (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-900 text-sm">{player.history[0].tier}</span>
                                    <span className="text-xs text-blue-400">{new Date(player.history[0].realTimeDate).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-1 flex justify-between items-end">
                                    <span className="text-xs text-blue-600 uppercase font-bold">{player.history[0].distance}m {player.history[0].stroke}</span>
                                    <span className="mono-font font-bold text-blue-800">{formatTime(player.history[0].time)}</span>
                                </div>
                                <div className="mt-1 text-xs text-center font-bold bg-white rounded py-1 text-slate-500 shadow-sm">
                                    Posición: {player.history[0].rank}º
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No ha competido aún.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};