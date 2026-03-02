
import React, { useState, useEffect } from 'react';
import { Attribute, Club, Swimmer } from '../types';
import { CLUB_COLORS, CLUB_ICONS, SPANISH_GEOGRAPHY, INTERNATIONAL_COUNTRIES, COUNTRY_FLAGS } from '../constants';
import { storageService } from '../services/storageService';

interface ClubManagerProps {
    swimmer: Swimmer;
    availableClubs: Club[];
    onUpdateSwimmer: (swimmer: Swimmer) => void;
    onViewPlayer?: (playerId: string) => void;
}

export const ClubManager: React.FC<ClubManagerProps> = ({ swimmer, availableClubs, onUpdateSwimmer, onViewPlayer }) => {
    const [view, setView] = useState<'current' | 'list' | 'create' | 'edit'>('current');
    const [members, setMembers] = useState<Swimmer[]>([]);
    
    // Form State
    const [formName, setFormName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(CLUB_ICONS[0]);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    
    // Geography Form State
    const [selectedCountry, setSelectedCountry] = useState('ES');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const currentClub = availableClubs.find(c => c.id === swimmer.clubId);

    // Initialize edit form
    useEffect(() => {
        if (view === 'edit' && currentClub) {
            setFormName(currentClub.name);
            setSelectedIcon(currentClub.logo.icon);
            const colorIdx = CLUB_COLORS.findIndex(c => c.bg === currentClub.logo.bgColor);
            setSelectedColorIndex(colorIdx >= 0 ? colorIdx : 0);
            
            // Geography init
            setSelectedCountry(currentClub.location.countryId);
            setSelectedRegion(currentClub.location.regionId || '');
            setSelectedZone(currentClub.location.zoneId || '');
            setSelectedCity(currentClub.location.cityName);
        } else if (view === 'create') {
            // Reset defaults
            setFormName('');
            setSelectedCountry('ES');
            setSelectedRegion('');
            setSelectedZone('');
            setSelectedCity('');
        }
    }, [view, currentClub]);

    // Load members
    useEffect(() => {
        if (view === 'current' && currentClub) {
            setMembers(storageService.getClubMembers(currentClub.id));
        }
    }, [view, currentClub]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation for Spain
        if (selectedCountry === 'ES' && (!selectedRegion || !selectedZone || !selectedCity)) {
            alert("Debes seleccionar Comunidad, Zona y Ciudad para un club español.");
            return;
        }
        if (selectedCountry !== 'ES' && !selectedCity) {
            alert("Debes escribir una ciudad.");
            return;
        }

        const colorData = CLUB_COLORS[selectedColorIndex];
        const newClub: Club = {
            id: Date.now().toString(),
            name: formName,
            description: `Club fundado por ${swimmer.name}`,
            prestige: 0,
            logo: {
                icon: selectedIcon,
                color: colorData.hex,
                bgColor: colorData.bg
            },
            location: {
                countryId: selectedCountry,
                regionId: selectedRegion || undefined,
                zoneId: selectedZone || undefined,
                cityName: selectedCity
            },
            ownerId: swimmer.id
        };
        
        storageService.saveClub(newClub);
        
        const updatedSwimmer = { ...swimmer, clubId: newClub.id };
        storageService.savePlayer(updatedSwimmer);
        onUpdateSwimmer(updatedSwimmer);
        
        setView('current');
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentClub) return;

        const colorData = CLUB_COLORS[selectedColorIndex];
        const updatedClub: Club = {
            ...currentClub,
            name: formName,
            logo: {
                icon: selectedIcon,
                color: colorData.hex,
                bgColor: colorData.bg
            }
            // Cannot edit location after creation (simpler logic to avoid zone hopping exploits)
        };

        storageService.saveClub(updatedClub);
        onUpdateSwimmer(swimmer); 
        setView('current');
    };

    const handleJoin = (club: Club) => {
        const updatedSwimmer = { ...swimmer, clubId: club.id };
        storageService.savePlayer(updatedSwimmer);
        onUpdateSwimmer(updatedSwimmer);
        setView('current');
    };

    const handleLeave = () => {
        if (!currentClub) return;
        const oldClubId = currentClub.id;

        const updatedSwimmer = { ...swimmer, clubId: null };
        storageService.savePlayer(updatedSwimmer);
        
        const remainingMembers = storageService.getClubMemberCount(oldClubId);
        if (remainingMembers === 0) {
            storageService.deleteClub(oldClubId);
        }

        onUpdateSwimmer(updatedSwimmer);
        setView('list'); 
    };

    // Helper to get zones based on region
    const getAvailableZones = () => {
        const region = SPANISH_GEOGRAPHY.find(r => r.id === selectedRegion);
        return region ? region.zones : [];
    };

    // Helper to get cities based on zone
    const getAvailableCities = () => {
        const region = SPANISH_GEOGRAPHY.find(r => r.id === selectedRegion);
        if (!region) return [];
        const zone = region.zones.find(z => z.id === selectedZone);
        return zone ? zone.cities : [];
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black sport-font text-slate-800 uppercase italic">Sede del Club</h2>
                <p className="text-sm text-slate-600 font-medium">Únete a otros jugadores reales o crea tu legado.</p>
            </div>

            <div className="flex justify-center gap-4 mb-6">
                <button 
                    onClick={() => setView('current')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${view === 'current' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    Mi Club
                </button>
                <button 
                    onClick={() => setView('list')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${view === 'list' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    Buscar Club
                </button>
                {!swimmer.clubId && (
                    <button 
                        onClick={() => { setFormName(''); setView('create'); }}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${view === 'create' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        Fundar Club
                    </button>
                )}
            </div>

            {view === 'current' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl shadow-lg border border-white/50 text-center max-w-lg mx-auto relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"></div>
                        {currentClub ? (
                            <>
                                <div className={`relative w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-6 text-5xl shadow-2xl border-4 border-white ${currentClub.logo.bgColor}`}>
                                    <span className={currentClub.logo.color}>{currentClub.logo.icon}</span>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-100 text-xl" title="País">
                                        {COUNTRY_FLAGS[currentClub.location.countryId] || '🏳️'}
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black sport-font text-slate-800 mb-2 leading-none">{currentClub.name}</h3>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                                    {currentClub.location.cityName} 
                                    {currentClub.location.countryId === 'ES' && ` • ${currentClub.location.regionId}`}
                                </div>
                                
                                <div className="flex justify-center mb-8">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[150px]">
                                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Prestigio</div>
                                        <div className="text-4xl font-black text-slate-800 mono-font">{currentClub.prestige}</div>
                                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Puntos de Club</div>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    {swimmer.id === currentClub.ownerId && (
                                        <button 
                                            onClick={() => setView('edit')}
                                            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
                                        >
                                            Editar Logo
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleLeave}
                                        className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 border border-red-100"
                                    >
                                        Abandonar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="py-12">
                                <p className="text-slate-500 mb-4 font-bold text-lg">No perteneces a ningún club.</p>
                                <button onClick={() => setView('list')} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg">Buscar uno</button>
                            </div>
                        )}
                    </div>

                    {currentClub && members.length > 0 && (
                        <div className="glass-panel rounded-2xl shadow-sm overflow-hidden max-w-2xl mx-auto">
                            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Plantilla del Equipo ({members.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {members.map((member) => (
                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => onViewPlayer && onViewPlayer(member.id)}
                                                className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:scale-105 transition-transform border-2 border-white"
                                            >
                                                {member.name.charAt(0)}
                                            </button>
                                            <div>
                                                <button 
                                                    onClick={() => onViewPlayer && onViewPlayer(member.id)}
                                                    className="font-bold text-slate-800 flex items-center gap-2 hover:text-blue-600 text-left"
                                                >
                                                    {member.name}
                                                    {member.id === currentClub.ownerId && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Presidente</span>}
                                                    {member.id === swimmer.id && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wider font-bold">TÚ</span>}
                                                </button>
                                                <div className="text-xs text-slate-500 font-medium">Nivel {member.level}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex gap-3">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medallas</div>
                                                <div className="flex gap-2 text-sm bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    <span title="Oros">🥇 {member.medals.gold}</span>
                                                    <span title="Platas">🥈 {member.medals.silver}</span>
                                                    <span title="Bronces">🥉 {member.medals.bronze}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(view === 'create' || view === 'edit') && (
                <form onSubmit={view === 'create' ? handleCreate : handleEdit} className="glass-panel p-8 rounded-3xl shadow-lg max-w-2xl mx-auto">
                    <h3 className="text-2xl font-black sport-font mb-6 text-slate-800">{view === 'create' ? 'Fundar Nuevo Equipo' : 'Editar Equipo'}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Club</label>
                                <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" placeholder="Ej. Delfines del Sur" />
                            </div>

                            {/* Geography Section - Only editable on Create */}
                            {view === 'create' && (
                                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">País</label>
                                        <select 
                                            value={selectedCountry} 
                                            onChange={e => {
                                                setSelectedCountry(e.target.value);
                                                setSelectedRegion('');
                                                setSelectedZone('');
                                                setSelectedCity('');
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700"
                                        >
                                            <option value="ES">España 🇪🇸</option>
                                            {INTERNATIONAL_COUNTRIES.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} {COUNTRY_FLAGS[c.id]}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedCountry === 'ES' ? (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Comunidad Autónoma</label>
                                                <select 
                                                    value={selectedRegion} 
                                                    onChange={e => {
                                                        setSelectedRegion(e.target.value);
                                                        setSelectedZone('');
                                                        setSelectedCity('');
                                                    }}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    disabled={!selectedCountry}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {SPANISH_GEOGRAPHY.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zona Provincial</label>
                                                <select 
                                                    value={selectedZone} 
                                                    onChange={e => {
                                                        setSelectedZone(e.target.value);
                                                        setSelectedCity('');
                                                    }}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    disabled={!selectedRegion}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {getAvailableZones().map(z => (
                                                        <option key={z.id} value={z.id}>{z.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciudad Sede</label>
                                                <select 
                                                    value={selectedCity} 
                                                    onChange={e => setSelectedCity(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    disabled={!selectedZone}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {getAvailableCities().map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciudad</label>
                                            <input 
                                                value={selectedCity} 
                                                onChange={e => setSelectedCity(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Ej. París, Londres..."
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Diseño del Logo</label>
                             <div className="flex justify-center mb-2">
                                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 border-white transition-all ${CLUB_COLORS[selectedColorIndex].bg}`}>
                                    <span className={CLUB_COLORS[selectedColorIndex].hex}>{selectedIcon}</span>
                                    {/* Preview Flag */}
                                    {view === 'create' && selectedCountry && (
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 text-lg">
                                            {COUNTRY_FLAGS[selectedCountry]}
                                        </div>
                                    )}
                                </div>
                             </div>
                             
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase">Icono</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {CLUB_ICONS.map(icon => (
                                        <button key={icon} type="button" onClick={() => setSelectedIcon(icon)} className={`p-2 rounded-lg hover:bg-slate-100 text-xl transition-all ${selectedIcon === icon ? 'bg-blue-100 ring-2 ring-blue-500 shadow-sm' : ''}`}>{icon}</button>
                                    ))}
                                </div>
                             </div>

                             <div>
                                <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase">Color</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {CLUB_COLORS.map((c, i) => (
                                        <button key={c.name} type="button" onClick={() => setSelectedColorIndex(i)} className={`w-8 h-8 rounded-full border-2 transition-all ${c.bg} ${selectedColorIndex === i ? 'border-slate-800 scale-110 shadow-md ring-2 ring-offset-2 ring-slate-300' : 'border-transparent'}`} title={c.name}></button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mt-10">
                        <button type="button" onClick={() => setView('current')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all shadow-blue-200">
                            {view === 'create' ? 'Crear Club' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            )}

            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableClubs.length === 0 && (
                         <div className="col-span-2 text-center py-12 bg-white/80 rounded-xl text-slate-500 font-medium">
                            No hay clubes creados. ¡Sé el primero en fundar uno!
                         </div>
                    )}
                    {availableClubs.map(club => (
                        <div key={club.id} className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-blue-400 transition-all hover:shadow-md cursor-pointer group">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-md border-2 border-white group-hover:scale-110 transition-transform ${club.logo.bgColor}`}>
                                <span className={club.logo.color}>{club.logo.icon}</span>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-xs border border-slate-100">
                                    {COUNTRY_FLAGS[club.location.countryId]}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-700">{club.name}</h4>
                                <div className="text-xs text-slate-500 mb-1">
                                    {club.location.cityName} {club.location.countryId === 'ES' ? `(${club.location.zoneId})` : ''}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider">Prestigio: {club.prestige}</span>
                                </div>
                            </div>
                            {swimmer.clubId !== club.id ? (
                                <button onClick={() => handleJoin(club)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700">Unirse</button>
                            ) : (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Tu Club</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
