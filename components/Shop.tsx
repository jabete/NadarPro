import React, { useState } from 'react';
import { Swimmer, Attribute } from '../types';
import { SHOP_ITEMS } from '../constants';
import { storageService } from '../services/storageService';

interface ShopProps {
    swimmer: Swimmer;
    onPurchase: (swimmer: Swimmer) => void;
}

export const Shop: React.FC<ShopProps> = ({ swimmer, onPurchase }) => {
    const [selectedItem, setSelectedItem] = useState<typeof SHOP_ITEMS[0] | null>(null);

    const handleBuy = () => {
        if (!selectedItem) return;
        if (swimmer.money < selectedItem.price) return;

        // Clone swimmer stats
        const newStats = { ...swimmer.stats };
        let statsToImprove: Attribute[] = [];

        if (selectedItem.type === 'fixed' && selectedItem.stats) {
            statsToImprove = selectedItem.stats;
        } else if (selectedItem.type === 'random') {
             // Pick one random attribute
             const attributes = Object.values(Attribute);
             const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
             statsToImprove = [randomAttr];
        }

        // Apply Improvements
        statsToImprove.forEach(stat => {
            const gain = Math.floor(Math.random() * (selectedItem.max - selectedItem.min + 1)) + selectedItem.min;
            newStats[stat] += gain;
        });

        // Update Swimmer
        const updatedSwimmer: Swimmer = {
            ...swimmer,
            stats: newStats,
            money: swimmer.money - selectedItem.price
        };

        // Save and Notify
        storageService.savePlayer(updatedSwimmer);
        onPurchase(updatedSwimmer);
        
        // Reset Logic
        setSelectedItem(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-2xl p-8 text-white shadow-lg text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold font-serif mb-2">Tienda de Rendimiento</h2>
                    <p className="opacity-90 mb-4">Invierte en tu cuerpo. Gana medallas.</p>
                    <div className="inline-block bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm border border-white/20">
                        <span className="text-2xl font-bold">💰 {swimmer.money}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SHOP_ITEMS.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                                {item.price} 💰
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 flex-1">{item.desc}</p>
                        
                        <button
                            onClick={() => setSelectedItem(item)}
                            disabled={swimmer.money < item.price}
                            className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
                                swimmer.money >= item.price 
                                ? 'bg-slate-900 text-white hover:bg-slate-700' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {swimmer.money >= item.price ? 'Comprar' : 'Dinero Insuficiente'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal for Confirmation */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedItem.name}</h3>
                        <p className="text-slate-500 mb-6">{selectedItem.desc}</p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleBuy}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                            >
                                Confirmar Compra (-{selectedItem.price})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};