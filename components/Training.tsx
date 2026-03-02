import React, { useState, useEffect } from 'react';
import { TRAINING_EXERCISES, ENERGY_RECHARGE_MS, MAX_ENERGY, STAT_DESCRIPTIONS } from '../constants';
import { Attribute } from '../types';

interface TrainingProps {
    energy: number;
    lastEnergyUpdate: number;
    onTrain: (stat: Attribute, min: number, max: number) => void;
}

export const Training: React.FC<TrainingProps> = ({ energy, lastEnergyUpdate, onTrain }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (energy >= MAX_ENERGY) {
            setTimeLeft("Completo");
            return;
        }

        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastEnergyUpdate;
            const remaining = Math.max(0, ENERGY_RECHARGE_MS - elapsed);
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [energy, lastEnergyUpdate]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-800">Centro de Alto Rendimiento</h2>
                <div className="mt-4 flex flex-col items-center">
                    <p className="text-slate-600 mb-2">Sesiones Disponibles</p>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-5xl text-blue-600">{energy}</span>
                        <span className="text-2xl text-slate-300">/ {MAX_ENERGY}</span>
                    </div>
                    {energy < MAX_ENERGY && (
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-1 rounded-full">
                            <span className="text-xs font-bold text-slate-500 uppercase">Siguiente recarga en:</span>
                            <span className="font-mono font-bold text-blue-600">{timeLeft}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TRAINING_EXERCISES.map((ex) => (
                    <button
                        key={ex.id}
                        disabled={energy <= 0}
                        onClick={() => onTrain(ex.stat, ex.minGain, ex.maxGain)}
                        className={`
                            relative overflow-hidden group p-6 rounded-2xl text-left transition-all duration-300 border h-full flex flex-col
                            ${energy > 0 
                                ? 'bg-white hover:shadow-xl hover:scale-105 border-blue-100 hover:border-blue-400 cursor-pointer' 
                                : 'bg-gray-100 opacity-60 cursor-not-allowed border-gray-200'}
                        `}
                    >
                        <div className="relative z-10 flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-800">{ex.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    ex.stat === Attribute.Strength ? 'bg-red-100 text-red-600' :
                                    ex.stat === Attribute.Speed ? 'bg-yellow-100 text-yellow-600' :
                                    ex.stat === Attribute.Technique ? 'bg-purple-100 text-purple-600' :
                                    ex.stat === Attribute.Stamina ? 'bg-lime-100 text-lime-700' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {ex.stat}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">{ex.desc}</p>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                                <p className="text-xs text-slate-500 italic">"{STAT_DESCRIPTIONS[ex.stat]}"</p>
                            </div>
                        </div>
                        <div className="flex items-center text-blue-600 font-semibold text-sm mt-auto relative z-10">
                             <span>+{ex.minGain} - {ex.maxGain} Puntos</span>
                        </div>
                        
                        {/* Decorative background element */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors z-0"></div>
                    </button>
                ))}
            </div>
        </div>
    );
};