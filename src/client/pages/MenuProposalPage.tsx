import { useState, useEffect } from 'react';
import { api, CatalogMenu, CatalogIngredient } from '../lib/api';
import ConfirmModal from '../components/ConfirmModal';

const formatRupiah = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(v)}`;

function IngredientForm({ catalogMenuId, onAdded }: { catalogMenuId: number; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !unit) return;
    setLoading(true);
    try {
      await api.addCatalogIngredient(catalogMenuId, {
        name, quantity: parseFloat(quantity), unit, pricePerUnit: parseFloat(pricePerUnit) || 0,
      });
      setName(''); setQuantity(''); setUnit(''); setPricePerUnit('');
      onAdded();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mt-3">
      <input className="input-field flex-1 min-w-[120px] !py-1.5 text-sm" placeholder="Nama bahan" value={name} onChange={e => setName(e.target.value)} required />
      <input className="input-field w-20 !py-1.5 text-sm" placeholder="Qty" type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required />
      <input className="input-field w-20 !py-1.5 text-sm" placeholder="Satuan" value={unit} onChange={e => setUnit(e.target.value)} required />
      <input className="input-field w-28 !py-1.5 text-sm" placeholder="Harga/unit" type="number" step="any" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} />
      <button type="submit" disabled={loading} className="btn-primary text-xs !px-3 !py-1.5">+ Tambah</button>
    </form>
  );
}

function CatalogIngredientRow({ ing, onUpdate, onDelete }: { ing: CatalogIngredient; onUpdate: () => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ing.name);
  const [quantity, setQuantity] = useState(ing.quantity.toString());
  const [unit, setUnit] = useState(ing.unit);
  const [pricePerUnit, setPricePerUnit] = useState(ing.pricePerUnit.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCatalogIngredient(ing.id, {
        name, quantity: parseFloat(quantity), unit, pricePerUnit: parseFloat(pricePerUnit),
      });
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <tr className="border-t border-white/5">
        <td className="py-2 pr-2"><input className="input-field !py-1 text-sm w-full" value={name} onChange={e => setName(e.target.value)} /></td>
        <td className="py-2 pr-2"><input className="input-field !py-1 text-sm w-16" type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} /></td>
        <td className="py-2 pr-2"><input className="input-field !py-1 text-sm w-16" value={unit} onChange={e => setUnit(e.target.value)} /></td>
        <td className="py-2 pr-2"><input className="input-field !py-1 text-sm w-24" type="number" step="any" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} /></td>
        <td className="py-2 text-right">{formatRupiah(parseFloat(quantity || '0') * parseFloat(pricePerUnit || '0'))}</td>
        <td className="py-2 pl-2 text-right">
          <button onClick={handleSave} disabled={saving} className="text-xs text-success mr-2">✓</button>
          <button onClick={() => setEditing(false)} className="text-xs text-text-muted">✗</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-white/5 group">
      <td className="py-2 pr-2 text-sm">{ing.name}</td>
      <td className="py-2 pr-2 text-sm text-right">{ing.quantity}</td>
      <td className="py-2 pr-2 text-sm">{ing.unit}</td>
      <td className="py-2 pr-2 text-sm text-right">{formatRupiah(ing.pricePerUnit)}</td>
      <td className="py-2 text-sm text-right font-semibold">{formatRupiah(ing.totalPrice)}</td>
      <td className="py-2 pl-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="text-xs text-primary mr-2">✏️</button>
        <button onClick={onDelete} className="text-xs text-danger">🗑️</button>
      </td>
    </tr>
  );
}

function CatalogMenuCard({ menu, onUpdate, autoExpand }: { menu: CatalogMenu; onUpdate: () => void; autoExpand?: boolean }) {
  const [expanded, setExpanded] = useState(!!autoExpand);
  const [detail, setDetail] = useState<CatalogMenu | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description || '');
  const [recipe, setRecipe] = useState(menu.recipe || '');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);

  const loadDetail = async () => {
    try {
      const res = await api.getCatalogMenu(menu.id);
      setDetail(res.menu);
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-expand: load detail on mount if autoExpand
  useEffect(() => {
    if (autoExpand) loadDetail();
  }, [autoExpand]);

  const handleExpand = () => {
    if (!expanded) loadDetail();
    setExpanded(!expanded);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCatalogMenu(menu.id, { name, description, recipe });
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteCatalogMenu(menu.id);
      setDeleteTarget(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteIngredient = async (ingId: number) => {
    try {
      await api.deleteCatalogIngredient(ingId);
      loadDetail();
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIngredientChange = () => {
    loadDetail();
    onUpdate();
  };

  // Use detail price when available (live), fallback to list price
  const displayPrice = detail?.estimatedPrice ?? menu.estimatedPrice ?? 0;
  const displayIngCount = detail?.ingredients?.length ?? menu.ingredientCount ?? 0;

  return (
    <>
      <div className="glass-card p-4 border border-white/5 hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <button onClick={handleExpand} className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg">{menu.name}</h3>
              <span className="text-xs text-text-muted">({displayIngCount} bahan)</span>
            </div>
            {menu.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{menu.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-accent font-semibold">{formatRupiah(displayPrice)}</span>
              <span className="text-xs text-text-muted">oleh {menu.creatorName}</span>
            </div>
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setEditing(true); setExpanded(true); if (!detail) loadDetail(); }} className="p-1.5 rounded-lg hover:bg-white/5 text-xs text-primary">✏️</button>
            <button onClick={() => setDeleteTarget(true)} className="p-1.5 rounded-lg hover:bg-white/5 text-xs text-danger">🗑️</button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {editing ? (
              <div className="space-y-3 mb-4">
                <input className="input-field text-sm" placeholder="Nama menu" value={name} onChange={e => setName(e.target.value)} />
                <textarea className="input-field text-sm resize-none" rows={2} placeholder="Deskripsi..." value={description} onChange={e => setDescription(e.target.value)} />
                <textarea className="input-field text-sm resize-none" rows={3} placeholder="Resep / cara masak..." value={recipe} onChange={e => setRecipe(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-xs !py-1.5">
                    {saving ? '...' : 'Simpan'}
                  </button>
                  <button onClick={() => { setEditing(false); setName(menu.name); setDescription(menu.description || ''); setRecipe(menu.recipe || ''); }} className="text-xs text-text-muted">Batal</button>
                </div>
              </div>
            ) : detail?.recipe ? (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-text-muted mb-1">📝 Resep</h4>
                <p className="text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-3">{detail.recipe}</p>
              </div>
            ) : null}

            <h4 className="text-xs font-semibold text-text-muted mb-2">🥬 Bahan-bahan</h4>
            {detail?.ingredients && detail.ingredients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-text-muted">
                      <th className="pb-2 pr-2">Bahan</th>
                      <th className="pb-2 pr-2 text-right">Qty</th>
                      <th className="pb-2 pr-2">Satuan</th>
                      <th className="pb-2 pr-2 text-right">Harga/Unit</th>
                      <th className="pb-2 text-right">Total</th>
                      <th className="pb-2 pl-2 text-right w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.ingredients.map(ing => (
                      <CatalogIngredientRow key={ing.id} ing={ing} onUpdate={handleIngredientChange} onDelete={() => handleDeleteIngredient(ing.id)} />
                    ))}
                    <tr className="border-t border-white/10">
                      <td colSpan={4} className="py-2 text-sm font-semibold text-right">Total Estimasi</td>
                      <td className="py-2 text-sm font-bold text-accent text-right">{formatRupiah(detail.estimatedPrice || 0)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Belum ada bahan</p>
            )}

            <IngredientForm catalogMenuId={menu.id} onAdded={handleIngredientChange} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTarget}
        title="Hapus Menu Katalog?"
        message={`Menu "${menu.name}" beserta semua bahan akan dihapus dari katalog. Menu yang sudah di-assign ke minggu tidak akan terpengaruh.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger
        requireType="HAPUS"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(false)}
      />
    </>
  );
}

export default function MenuCatalogPage() {
  const [menus, setMenus] = useState<CatalogMenu[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRecipe, setNewRecipe] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [newlyCreatedId, setNewlyCreatedId] = useState<number | null>(null);

  const loadMenus = async () => {
    try {
      const res = await api.getCatalogMenus();
      setMenus(res.menus);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadMenus(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await api.createCatalogMenu({ name: newName.trim(), description: newDesc || undefined, recipe: newRecipe || undefined });
      setNewName(''); setNewDesc(''); setNewRecipe('');
      setShowForm(false);
      setNewlyCreatedId(res.menu.id);
      loadMenus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = menus.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl">📖 Katalog Menu</h1>
          <p className="text-sm text-text-muted mt-1">Kelola daftar menu dengan bahan dan resep</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? '✕ Tutup' : '+ Tambah Menu'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-5 mb-6 space-y-3 border border-primary/20">
          <h3 className="font-heading font-bold">Menu Baru</h3>
          <input className="input-field" placeholder="Nama menu (contoh: Nasi Goreng Spesial)" value={newName} onChange={e => setNewName(e.target.value)} required />
          <textarea className="input-field resize-none" rows={2} placeholder="Deskripsi singkat (opsional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <textarea className="input-field resize-none" rows={3} placeholder="Resep / cara masak (opsional)" value={newRecipe} onChange={e => setNewRecipe(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={creating} className="btn-primary w-full">
            {creating ? 'Menyimpan...' : '💾 Simpan Menu'}
          </button>
        </form>
      )}

      <div className="mb-4">
        <input
          className="input-field"
          placeholder="🔍 Cari menu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-text-muted">
            {search ? 'Tidak ada menu yang cocok' : 'Belum ada menu di katalog. Tambahkan menu pertama!'}
          </div>
        ) : (
          filtered.map(m => (
            <CatalogMenuCard
              key={m.id}
              menu={m}
              onUpdate={loadMenus}
              autoExpand={m.id === newlyCreatedId}
            />
          ))
        )}
      </div>
    </div>
  );
}
