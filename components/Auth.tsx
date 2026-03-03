
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Swimmer, Club } from '../types';
import { COUNTRY_FLAGS } from '../constants';

interface AuthProps {
    onAuth: (name: string, isRegistering: boolean) => void;
    error: string | null;
    onClearError: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuth, error, onClearError }) => {
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(true); // Default to register if opening form
    const [showForm, setShowForm] = useState(false);
    const [existingPlayers, setExistingPlayers] = useState<Swimmer[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [expandedClubId, setExpandedClubId] = useState<string | null>(null);

    useEffect(() => {
        setExistingPlayers(storageService.getAllPlayers());
        setClubs(storageService.getClubs());
    }, []);

    const formatName = (input: string) => {
        const cleaned = input.replace(/\s+/g, ' ');
        return cleaned.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(formatName(e.target.value));
        if (error) onClearError();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length > 0) {
            onAuth(name.trim(), isRegistering);
        }
    };

    const toggleClub = (clubId: string) => {
        if (expandedClubId === clubId) {
            setExpandedClubId(null);
        } else {
            setExpandedClubId(clubId);
        }
    };

    // Grouping Logic
    const playersByClub: Record<string, Swimmer[]> = {};
    const freeAgents: Swimmer[] = [];

    existingPlayers.forEach(p => {
        if (p.clubId) {
            if (!playersByClub[p.clubId]) playersByClub[p.clubId] = [];
            playersByClub[p.clubId].push(p);
        } else {
            freeAgents.push(p);
        }
    });

    const sortedClubsWithPlayers = clubs
        .filter(c => playersByClub[c.id] && playersByClub[c.id].length > 0)
        .sort((a, b) => b.prestige - a.prestige);

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-x-hidden">
            {/* Left Sidebar - Branding & Actions */}
            <div className="w-full md:w-[400px] md:h-screen bg-slate-900 text-white flex flex-col justify-between p-8 md:p-12 shadow-2xl relative z-10 border-b md:border-b-0 md:border-r border-slate-700 shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                
                <div className="mb-8 md:mb-0">
                    <div className="inline-block bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-4 md:p-6 rounded-2xl font-black text-4xl md:text-5xl mb-6 md:mb-8 shadow-[0_0_20px_rgba(6,182,212,0.5)] transform -rotate-3">NP</div>
                    <h1 className="text-4xl md:text-5xl font-black sport-font mb-2 tracking-wide">Nadar<span className="text-cyan-400">Pro</span></h1>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed">
                        Gestiona tu carrera profesional. Compite en ligas nacionales e internacionales. Rompe los récords.
                    </p>
                </div>

                <div className="space-y-6">
                    {showForm ? (
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4 text-cyan-400">
                                {isRegistering ? 'Nueva Carrera' : 'Recuperar Sesión'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500 font-bold"
                                        placeholder="Nombre del Nadador"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20"
                                >
                                    {isRegistering ? 'Comenzar Aventura' : 'Cargar Perfil'}
                                </button>
                                <div className="flex justify-between text-xs font-bold text-slate-500 pt-2">
                                    <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="hover:text-white transition-colors">
                                        {isRegistering ? '¿Ya tienes cuenta?' : '¿Crear nuevo?'}
                                    </button>
                                    <button type="button" onClick={() => { setShowForm(false); setName(''); }} className="hover:text-red-400 transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                            {error && (
                                <p className="mt-4 text-sm text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50 font-bold text-center">
                                    ⚠️ {error}
                                </p>
                            )}
                        </div>
                    ) : (
                        <button 
                            onClick={() => { setShowForm(true); setIsRegistering(true); }}
                            className="w-full group relative overflow-hidden bg-white text-slate-900 font-black py-5 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <span className="relative z-10 flex items-center justify-between">
                                <span>+ NUEVA CARRERA</span>
                                <span className="text-2xl group-hover:translate-x-1 transition-transform">🏊</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        </button>
                    )}
                </div>
            </div>

            {/* Right Panel - Profile Selector */}
            <div className="flex-1 bg-slate-50 p-6 md:p-12 overflow-y-auto custom-scrollbar w-full">
                <div className="max-w-4xl mx-auto pb-20 md:pb-0">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 md:mb-8 uppercase tracking-widest flex items-center gap-4 border-b border-slate-200 pb-4">
                        <span className="text-3xl md:text-4xl">📂</span> Cargar Partida
                    </h2>

                    {existingPlayers.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <div className="text-6xl mb-4 opacity-30">🏊</div>
                            <p className="text-xl font-medium">No hay perfiles guardados.</p>
                            <p className="mt-2">Crea una nueva carrera en el menú lateral.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Clubs List (Accordion) */}
                            {sortedClubsWithPlayers.map(club => (
                                <div key={club.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <button 
                                        onClick={() => toggleClub(club.id)}
                                        className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${expandedClubId === club.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-md ${club.logo.bgColor}`}>
                                                <span className={club.logo.color}>{club.logo.icon}</span>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-xl text-slate-800 sport-font tracking-wide">{club.name}</div>
                                                <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                                    <span>{COUNTRY_FLAGS[club.location.countryId]}</span>
                                                    <span>{club.location.cityName}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{playersByClub[club.id].length} Jugadores</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-slate-400 text-2xl transition-transform duration-300 ${expandedClubId === club.id ? 'rotate-180' : ''}`}>
                                            ▼
                                        </div>
                                    </button>

                                    {expandedClubId === club.id && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                            {playersByClub[club.id].map(player => (
                                                <button
                                                    key={player.id}
                                                    onClick={() => onAuth(player.name, false)}
                                                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100 transition-all group text-left"
                                                >
                                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-lg text-slate-600 group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-white transition-all">
                                                        {player.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg text-slate-700 group-hover:text-cyan-700">{player.name}</div>
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nivel {player.level}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Free Agents Accordion */}
                            {freeAgents.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <button 
                                        onClick={() => toggleClub('free_agents')}
                                        className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${expandedClubId === 'free_agents' ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-slate-200 text-slate-500 border-2 border-white shadow-sm">
                                                🏚️
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-xl text-slate-600 sport-font tracking-wide">Agentes Libres</div>
                                                <div className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                                    <span>Sin Equipo</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{freeAgents.length} Jugadores</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-slate-400 text-2xl transition-transform duration-300 ${expandedClubId === 'free_agents' ? 'rotate-180' : ''}`}>
                                            ▼
                                        </div>
                                    </button>

                                    {expandedClubId === 'free_agents' && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                            {freeAgents.map(player => (
                                                <button
                                                    key={player.id}
                                                    onClick={() => onAuth(player.name, false)}
                                                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100 transition-all group text-left"
                                                >
                                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-lg text-slate-600 group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-white transition-all">
                                                        {player.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg text-slate-700 group-hover:text-cyan-700">{player.name}</div>
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nivel {player.level}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
