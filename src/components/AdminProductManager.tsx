import React, { useState } from 'react';
import { InvestmentProduct } from '../types';
import { Plus, Edit2, Trash2, Power, X, Sparkles } from 'lucide-react';

interface AdminProductManagerProps {
  products: InvestmentProduct[];
  onAddOrUpdateProduct: (product: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean; image?: string; description?: string; order?: number }) => void;
  onDeleteProduct: (productId: string) => void;
}

export const AdminProductManager: React.FC<AdminProductManagerProps> = ({
  products,
  onAddOrUpdateProduct,
  onDeleteProduct
}) => {
  const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(3000);
  const [formDailyGain, setFormDailyGain] = useState<number>(600);
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formTotalGain, setFormTotalGain] = useState<number>(18000);
  const [formBadge, setFormBadge] = useState('🔥 HOT');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);

  // Auto calculate total gain
  const handleCalculateTotal = () => {
    setFormTotalGain(formDailyGain * formDuration);
  };

  const openNewForm = () => {
    setEditingProduct(null);
    setFormId(`vip-${products.length + 1}`);
    setFormName(`VIP ${products.length + 1} - Produit Santé`);
    setFormImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80');
    setFormDescription('Pack de nutrition et compléments de bien-être bio.');
    setFormPrice(10000);
    setFormDailyGain(2200);
    setFormDuration(30);
    setFormTotalGain(66000);
    setFormBadge('Nouveau');
    setFormOrder(products.length + 1);
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  const openEditForm = (prod: InvestmentProduct) => {
    setEditingProduct(prod);
    setFormId(prod.id);
    setFormName(prod.name);
    setFormImage(prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80');
    setFormDescription(prod.description || '');
    setFormPrice(prod.price);
    setFormDailyGain(prod.dailyGain);
    setFormDuration(prod.duration);
    setFormTotalGain(prod.totalGain);
    setFormBadge(prod.badge || 'VIP');
    setFormOrder(prod.order || 1);
    setFormIsActive(prod.isActive !== false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onAddOrUpdateProduct({
      id: formId,
      name: formName,
      price: Number(formPrice),
      dailyGain: Number(formDailyGain),
      duration: Number(formDuration),
      totalGain: Number(formTotalGain),
      isActive: formIsActive,
      image: formImage.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      description: formDescription.trim(),
      order: Number(formOrder),
      badge: formBadge.trim()
    });

    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleToggleActive = (prod: InvestmentProduct) => {
    onAddOrUpdateProduct({
      ...prod,
      isActive: !prod.isActive
    });
  };

  // Sort products by order for table display
  const sortedProducts = [...products].sort((a, b) => (a.order || 99) - (b.order || 99));

  return (
    <div className="bg-white rounded-3xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-800">
            GESTION DU CATALOGUE (ACCÈS ADMIN)
          </div>
          <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Gestion des Produits de Bien-être</span>
          </h3>
        </div>

        <button
          onClick={openNewForm}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {/* Add / Edit Form Modal or Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-50/80 rounded-2xl p-5 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2">
            <h4 className="text-sm font-extrabold text-amber-800 font-mono">
              {editingProduct ? `Modifier "${editingProduct.name}"` : "Créer un nouveau produit de bien-être"}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Nom du Produit</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: VIP 1 - Nutrien Bio"
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-slate-900 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Badge (ex: 🔥 HOT, RECOMMANDÉ)</label>
              <input
                type="text"
                value={formBadge}
                onChange={(e) => setFormBadge(e.target.value)}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-amber-800 font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">URL de l'image du produit</label>
              <input
                type="url"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-slate-700 font-mono text-[11px]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Description / Bienfaits</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Pack de nutrition bio riche en fibres et vitamines..."
                rows={2}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Prix d'Investissement (FCFA)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-slate-900 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Revenu Quotidien (FCFA)</label>
              <input
                type="number"
                value={formDailyGain}
                onChange={(e) => setFormDailyGain(Number(e.target.value))}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-emerald-600 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Cycle d'investissement (Jours)</label>
              <input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-slate-900 font-mono font-bold"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-500 uppercase text-[10px] font-bold">Revenu Total (FCFA)</label>
                <button
                  type="button"
                  onClick={handleCalculateTotal}
                  className="text-[9px] text-amber-700 hover:underline font-bold cursor-pointer"
                >
                  Calculer (Gain x Jours)
                </button>
              </div>
              <input
                type="number"
                value={formTotalGain}
                onChange={(e) => setFormTotalGain(Number(e.target.value))}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-amber-700 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Ordre d'affichage</label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                className="w-full bg-white outline-none rounded-xl py-2 px-3 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Statut du produit</label>
              <button
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  formIsActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{formIsActive ? 'Statut : Actif (Visible)' : 'Statut : Inactif (Masqué)'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Enregistrer le produit
            </button>
          </div>
        </form>
      )}

      {/* List / Table of Products */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase text-slate-500">
          Liste des {sortedProducts.length} produits du catalogue :
        </h4>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {sortedProducts.map((prod) => (
            <div
              key={prod.id}
              className={`p-3 sm:p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                prod.isActive !== false
                  ? 'bg-slate-50/70'
                  : 'bg-slate-100/50 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'}
                  alt={prod.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{prod.name}</span>
                    <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      Ordre #{prod.order || 1}
                    </span>
                    {prod.badge && (
                      <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        {prod.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Prix : <span className="text-amber-700 font-bold">{prod.price.toLocaleString()} FCFA</span> | Gain/j : <span className="text-emerald-700 font-bold">+{prod.dailyGain.toLocaleString()} FCFA</span> | Cycle : <span className="text-slate-800 font-bold">{prod.duration}j</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                {/* Active Toggle */}
                <button
                  onClick={() => handleToggleActive(prod)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition-all flex items-center space-x-1 cursor-pointer ${
                    prod.isActive !== false
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                  title="Activer/Désactiver"
                >
                  <Power className="w-3 h-3" />
                  <span>{prod.isActive !== false ? 'Actif' : 'Inactif'}</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditForm(prod)}
                  className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-slate-100 transition-all cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteProduct(prod.id)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
