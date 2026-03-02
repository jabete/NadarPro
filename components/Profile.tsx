import React from 'react';
import { CompetitionTier, Swimmer } from '../types';
import { formatTime } from '../services/gameLogic';
import { storageService } from '../services/storageService';

interface ProfileProps {
    swimmer: Swimmer;
    onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ swimmer, onLogout }) => {
    // Fetch club name freshly
    const club = swimmer.clubId ? storageService.getClub(swimmer.clubId) : null;

    // Filter for medals - Exclude Triangulars
    const medalHistory = swimmer.history.filter(race => race.rank <= 3 && race.tier !== CompetitionTier.Triangular);

    // Sort Personal Bests by distance (extracted from key "Stroke-Distance")
    const sortedPBs = Object.entries(swimmer.personalBests).sort((a, b) => {
        const distA = parseInt(a[0].split('-')[1]);
        const distB = parseInt(b[0].split('-')[1]);
        return distA - distB;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {swimmer.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{swimmer.name}</h2>
                        <p className="text-slate-500">{club ? club.name : 'Agente Libre'}</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-red-500 hover:text-red-700 font-bold text-sm">
                    Cerrar Sesión
                </button>
            </div>

            {/* Stats Summary Row: Medals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 flex items-center gap-4">
                    <div className="text-4xl">🥇</div>
                    <div>
                        <div className="text-3xl font-black text-yellow-700">{swimmer.medals.gold}</div>
                        <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Oros</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <div className="text-4xl">🥈</div>
                    <div>
                        <div className="text-3xl font-black text-slate-600">{swimmer.medals.silver}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platas</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 flex items-center gap-4">
                    <div className="text-4xl">🥉</div>
                    <div>
                        <div className="text-3xl font-black text-orange-700">{swimmer.medals.bronze}</div>
                        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Bronces</div>
                    </div>
                </div>
            </div>

            {/* Detailed Medal List */}
            {medalHistory.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-2xl font-bold mb-6 text-slate-800">Vitrina de Trofeos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                        {medalHistory.map((race) => (
                            <div key={race.id} className={`p-4 rounded-xl border flex items-center gap-4 ${
                                race.rank === 1 ? 'bg-yellow-50 border-yellow-200' :
                                race.rank === 2 ? 'bg-slate-50 border-slate-200' :
                                'bg-orange-50 border-orange-200'
                            }`}>
                                <div className="text-3xl filter drop-shadow-sm">
                                    {race.rank === 1 ? '🥇' : race.rank === 2 ? '🥈' : '🥉'}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 leading-tight">{race.tier}</div>
                                    <div className="text-sm font-semibold text-slate-600">
                                        {race.distance}m {race.stroke}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                        <span>📅 {new Date(race.realTimeDate).toLocaleDateString()}</span>
                                        <span className="font-mono font-bold text-blue-600">⏱ {formatTime(race.time)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Mejores Marcas Personales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedPBs.length === 0 && (
                        <p className="text-slate-400">Sin tiempos registrados.</p>
                    )}
                    {sortedPBs.map(([key, time]) => {
                        const [stroke, dist] = key.split('-');
                        return (
                            <div key={key} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-700 capitalize">{dist}m {stroke}</span>
                                <span className="font-mono text-blue-600 font-bold">{formatTime(time as number)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Historial Reciente</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {swimmer.history.map((race) => (
                        <div key={race.id} className="border-l-4 border-blue-500 bg-slate-50 pl-4 py-3 rounded-r-lg">
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-800">{race.tier}</span>
                                <span className="text-sm text-slate-500">{new Date(race.realTimeDate).toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                                {race.distance}m {race.stroke} | <span className="font-mono font-bold">{formatTime(race.time)}</span> | Posición: {race.rank}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};