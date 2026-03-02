import React, { useState, useEffect } from 'react';
import { Attribute, Club, GameState, Stats, PastRace, Swimmer, CompetitionTier } from './types';
import { MAX_ENERGY, ENERGY_RECHARGE_MS, DEFAULT_TIME, PRESTIGE_REWARDS } from './constants';
import { Training } from './components/Training';
import { Competition } from './components/Competition';
import { formatTime } from './services/gameLogic';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { ClubManager } from './components/ClubManager';
import { Ranking } from './components/Ranking';
import { PlayerModal } from './components/PlayerModal';
import { storageService } from './services/storageService';

const INITIAL_STATS: Stats = {
    [Attribute.Strength]: 10,
    [Attribute.Technique]: 10,
    [Attribute.Stamina]: 10,
    [Attribute.Mental]: 10,
    [Attribute.Speed]: 10,
    [Attribute.StartTurn]: 10 // New Stat
};

const createNewSwimmer = (name: string): Swimmer => ({
    id: Date.now().toString(),
    name,
    clubId: null,
    stats: INITIAL_STATS,
    level: 1,
    xp: 0,
    money: 100,
    personalBests: {}, // Empty means DEFAULT_TIME
    history: [],
    medals: { gold: 0, silver: 0, bronze: 0 },
    energy: MAX_ENERGY,
    lastEnergyUpdate: Date.now()
});

const INITIAL_STATE: GameState = {
    day: 1,
    selectedTab: 'dashboard',
    swimmer: null,
    clubs: []
};

export default function App() {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to force updates when cloud data changes
    const [authError, setAuthError] = useState<string | null>(null);
    const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        const clubs = storageService.getClubs();
        setGameState(prev => ({ ...prev, clubs }));
    }, [refreshTrigger]);

    // Poll for club/player updates (Simulate real-time cloud)
    useEffect(() => {
        const interval = setInterval(() => {
             const clubs = storageService.getClubs();
             // Only update non-swimmer specific data to avoid overwriting local energy state being tracked
             setGameState(prev => ({ ...prev, clubs }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Energy Recharge System (Active)
    useEffect(() => {
        if (!gameState.swimmer) return;

        const timer = setInterval(() => {
            setGameState(prev => {
                if (!prev.swimmer) return prev;
                
                const swimmer = prev.swimmer;
                
                // If full, just update timestamp
                if (swimmer.energy >= MAX_ENERGY) {
                     return { 
                        ...prev, 
                        swimmer: { ...swimmer, lastEnergyUpdate: Date.now() } 
                    };
                }
                
                const now = Date.now();
                const elapsed = now - swimmer.lastEnergyUpdate;
                
                // Full Recharge Logic: If 30 mins passed, fill ALL bars
                if (elapsed >= ENERGY_RECHARGE_MS) {
                    
                    // SAFE UPDATE: Use partial update to avoid overwriting PBs/History 
                    // if a race finished in the background or during this tick.
                    storageService.updatePlayerFields(swimmer.id, {
                        energy: MAX_ENERGY,
                        lastEnergyUpdate: now
                    });
                    
                    return {
                        ...prev,
                        swimmer: {
                            ...swimmer,
                            energy: MAX_ENERGY,
                            lastEnergyUpdate: now
                        }
                    };
                }
                return prev;
            });
        }, 1000); 

        return () => clearInterval(timer);
    }, [gameState.swimmer?.name]); // Re-bind if user changes

    const handleAuth = (name: string, isRegistering: boolean) => {
        setAuthError(null);
        let swimmer = storageService.getPlayer(name);

        if (isRegistering) {
            // Register flow
            if (swimmer) {
                setAuthError("El nombre de usuario ya existe. Por favor, inicia sesión.");
                return;
            }
            // Create new
            swimmer = createNewSwimmer(name);
            storageService.savePlayer(swimmer);
        } else {
            // Login flow
            if (!swimmer) {
                setAuthError("Usuario no encontrado. Verifica el nombre o regístrate.");
                return;
            }

            // Ensure Migration for StartTurn
            if (swimmer.stats[Attribute.StartTurn] === undefined) {
                swimmer.stats[Attribute.StartTurn] = 10;
            }

            // OFFLINE ENERGY REGEN
            if (swimmer.energy < MAX_ENERGY) {
                // Handle legacy data (if energy is missing)
                const lastUpdate = swimmer.lastEnergyUpdate || Date.now();
                
                const now = Date.now();
                const elapsed = now - lastUpdate;
                
                // If enough time passed since last update, Full Recharge
                if (elapsed >= ENERGY_RECHARGE_MS) {
                    swimmer.energy = MAX_ENERGY;
                    swimmer.lastEnergyUpdate = now;
                    storageService.savePlayer(swimmer);
                }
            } else {
                // Ensure legacy swimmers get defaults
                if (swimmer.energy === undefined) swimmer.energy = MAX_ENERGY;
                if (!swimmer.lastEnergyUpdate) swimmer.lastEnergyUpdate = Date.now();
            }
        }

        setGameState(prev => ({
            ...prev,
            swimmer,
            selectedTab: 'dashboard'
        }));
    };

    const handleLogout = () => {
        // Save state one last time
        if (gameState.swimmer) {
            storageService.savePlayer(gameState.swimmer);
        }
        setGameState(prev => ({ ...prev, swimmer: null }));
        setAuthError(null);
    };

    const handleTrain = (stat: Attribute, min: number, max: number) => {
        if (!gameState.swimmer || gameState.swimmer.energy <= 0) return;
        
        let baseGain = Math.floor(Math.random() * (max - min + 1)) + min;

        // Use updatePlayerFields here as well for safety, though manual triggers are safer.
        // However, we need to update state immediately for UI.
        
        const updatedSwimmer: Swimmer = {
            ...gameState.swimmer,
            stats: {
                ...gameState.swimmer.stats,
                [stat]: gameState.swimmer.stats[stat] + baseGain
            },
            xp: gameState.swimmer.xp + 10,
            level: Math.floor((gameState.swimmer.xp + 10) / 100) + 1,
            energy: gameState.swimmer.energy - 1,
            // If we use energy, reset the timer for the recharge cycle
            lastEnergyUpdate: Date.now()
        };
        
        // Safe update
        storageService.updatePlayerFields(updatedSwimmer.id, {
            stats: updatedSwimmer.stats,
            xp: updatedSwimmer.xp,
            level: updatedSwimmer.level,
            energy: updatedSwimmer.energy,
            lastEnergyUpdate: updatedSwimmer.lastEnergyUpdate
        });

        setGameState(prev => ({
            ...prev,
            swimmer: updatedSwimmer
        }));
    };

    const handleRaceComplete = (result: PastRace) => {
        if (!gameState.swimmer) return;

        // Note: storageService.processRaceResults has already updated the database 
        // with the new time, XP, medals, history, etc.
        
        // We just need to reload the fresh player object from storage to reflect these changes in UI immediately.
        const updatedSwimmer = storageService.getPlayer(gameState.swimmer.name);
        
        if (updatedSwimmer) {
            setGameState(prev => {
                const clubs = storageService.getClubs(); // Refresh clubs too (prestige changes)
                return { ...prev, swimmer: updatedSwimmer, clubs };
            });
        }
    };

    const handleUpdateSwimmer = (updated: Swimmer) => {
        setGameState(prev => ({ ...prev, swimmer: updated }));
        setRefreshTrigger(t => t + 1); // Trigger club reload
    };

    if (!gameState.swimmer) {
        return <Auth onAuth={handleAuth} error={authError} onClearError={() => setAuthError(null)} />;
    }

    const { swimmer, day, selectedTab, clubs } = gameState;
    const currentClub = clubs.find(c => c.id === swimmer.clubId);

    return (
        <div className="min-h-screen pb-20">
            {viewedPlayerId && (
                <PlayerModal playerId={viewedPlayerId} onClose={() => setViewedPlayerId(null)} />
            )}

            <header className="glass-panel sticky top-0 z-40 border-b border-white/40 px-6 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-500 text-white p-2 rounded-lg font-black text-xl italic shadow-md transform skew-x-[-10deg]">
                        <span className="block transform skew-x-[10deg]">NP</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 leading-none text-2xl sport-font tracking-wide">Nadar<span className="text-cyan-600">Pro</span></h1>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-full">Temporada {day}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Energía</span>
                        <div className="flex gap-1">
                            {Array.from({length: MAX_ENERGY}, (_, i) => i + 1).map(i => (
                                <div 
                                    key={i} 
                                    className={`w-2.5 h-6 rounded-sm skew-x-[-10deg] transition-all duration-300 border border-white/50 ${i <= swimmer.energy ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-200/50'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-8 max-w-5xl">
                {/* Stats Summary - Scoreboard Style */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-0.5 mb-8 bg-slate-900 p-2 rounded-xl shadow-2xl border-b-4 border-slate-700 overflow-hidden">
                    <div className="col-span-2 md:col-span-1 bg-slate-800 p-3 flex flex-col justify-center items-center relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                        <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest mb-1">NIVEL</div>
                        <div className="text-4xl font-black text-white mono-font leading-none">{swimmer.level}</div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 border border-slate-700">
                            <div className="bg-cyan-500 h-full rounded-full shadow-[0_0_10px_#06b6d4]" style={{ width: `${(swimmer.xp % 100)}%` }}></div>
                        </div>
                    </div>
                    {Object.entries(swimmer.stats).map(([key, val], i) => (
                        <div key={key} className={`bg-slate-800/90 p-3 flex flex-col justify-center items-center border-l border-slate-700`}>
                            <div className="text-[9px] md:text-[8px] lg:text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 truncate w-full text-center">{key}</div>
                            <div className={`text-2xl font-bold mono-font ${(val as number) > 20 ? 'text-yellow-400' : 'text-white'}`}>{val as number}</div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mb-8 overflow-x-auto pb-2">
                    <nav className="glass-panel p-1.5 rounded-full flex gap-1 shadow-lg whitespace-nowrap">
                        {[
                            { id: 'dashboard', label: 'Inicio', icon: '🏠' },
                            { id: 'training', label: 'Entreno', icon: '🏋️' },
                            { id: 'competition', label: 'Competición', icon: '🏊' },
                            { id: 'club', label: 'Club', icon: '🛡️' },
                            { id: 'ranking', label: 'Ranking', icon: '🏆' },
                            { id: 'profile', label: 'Perfil', icon: '👤' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setGameState(prev => ({ ...prev, selectedTab: tab.id as any }))}
                                className={`
                                    px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2
                                    ${selectedTab === tab.id 
                                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md transform scale-105' 
                                        : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'}
                                `}
                            >
                                <span className="text-base">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="min-h-[400px]">
                    {selectedTab === 'dashboard' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-gradient-to-r from-cyan-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl wet-shine">
                                <h3 className="text-4xl font-black sport-font mb-2 italic">Hola, {swimmer.name}</h3>
                                <p className="opacity-90 font-medium max-w-lg">El agua no sabe tu edad, ni tu historia. El agua solo sabe lo rápido que nadas.</p>
                                <div className="absolute right-0 bottom-0 opacity-10 text-9xl transform translate-x-1/4 translate-y-1/4">🏊</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer" onClick={() => setGameState(prev => ({...prev, selectedTab: 'club'}))}>
                                     {currentClub ? (
                                         <>
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-inner border-4 border-white ${currentClub.logo.bgColor}`}>
                                                <span className={currentClub.logo.color}>{currentClub.logo.icon}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 uppercase tracking-wide opacity-60">Tu Equipo</h3>
                                                <div className="text-2xl font-black text-cyan-700 sport-font leading-none">{currentClub.name}</div>
                                                <div className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wider bg-slate-100 inline-block px-2 py-1 rounded">Prestigio: {currentClub.prestige}</div>
                                            </div>
                                         </>
                                     ) : (
                                         <div className="text-slate-500 p-2 flex items-center gap-4">
                                             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl">🏚️</div>
                                             <div>
                                                 <h3 className="font-bold text-xl text-slate-800">Agente Libre</h3>
                                                 <p className="text-sm">Únete a un club para competir en ligas.</p>
                                             </div>
                                         </div>
                                     )}
                                </div>

                                <div className="glass-panel p-6 rounded-2xl hover:shadow-lg transition-all">
                                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-3">Último Resultado</h3>
                                    {swimmer.history.length > 0 ? (
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-16 h-16 flex items-center justify-center rounded-2xl font-black text-2xl text-white shadow-md
                                                ${swimmer.history[0].rank === 1 ? 'bg-yellow-400' : 
                                                  swimmer.history[0].rank === 2 ? 'bg-slate-300' : 
                                                  swimmer.history[0].rank === 3 ? 'bg-orange-400' : 'bg-slate-800'}
                                            `}>
                                                {swimmer.history[0].rank}º
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-slate-800">{swimmer.history[0].tier}</div>
                                                <div className="text-sm text-slate-600 font-medium">
                                                    {swimmer.history[0].distance}m {swimmer.history[0].stroke}
                                                </div>
                                                <div className="text-xl font-bold text-blue-600 mono-font mt-1">
                                                    {formatTime(swimmer.history[0].time)}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm py-4">Aún no has competido. ¡Ve a la piscina!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'training' && (
                        <Training 
                            energy={swimmer.energy} 
                            onTrain={handleTrain} 
                            lastEnergyUpdate={swimmer.lastEnergyUpdate} 
                        />
                    )}

                    {selectedTab === 'club' && (
                        <ClubManager 
                            swimmer={swimmer} 
                            availableClubs={gameState.clubs}
                            onUpdateSwimmer={handleUpdateSwimmer}
                            onViewPlayer={setViewedPlayerId}
                        />
                    )}

                    {selectedTab === 'competition' && (
                        <Competition 
                            swimmer={swimmer}
                            day={day} 
                            onRaceComplete={handleRaceComplete} 
                            onUpdateSwimmer={() => setRefreshTrigger(t => t+1)}
                            onViewPlayer={setViewedPlayerId}
                        />
                    )}

                    {selectedTab === 'ranking' && (
                        <Ranking onViewPlayer={setViewedPlayerId} />
                    )}

                    {selectedTab === 'profile' && (
                        <Profile swimmer={swimmer} onLogout={handleLogout} />
                    )}
                </div>
            </main>
        </div>
    );
}