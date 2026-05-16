import { useState } from 'react';
import { api } from '../lib/api';

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface Props {
  menuId: number;
  ingredients: Ingredient[];
  editable?: boolean;
  isActual?: boolean;
  onUpdate: () => void;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function IngredientTable({ menuId, ingredients, editable = false, isActual = false, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', pricePerUnit: '' });

  const handleAdd = async () => {
    try {
      const addFn = isActual ? api.addActualIngredient : api.addIngredient;
      await addFn(menuId, {
        name: form.name,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        pricePerUnit: parseFloat(form.pricePerUnit),
      });
      setForm({ name: '', quantity: '', unit: '', pricePerUnit: '' });
      setAdding(false);
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteIngredient(id);
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const total = ingredients.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted border-b border-white/10">
              <th className="text-left py-2 px-3">Nama Bahan</th>
              <th className="text-right py-2 px-3">Jumlah</th>
              <th className="text-left py-2 px-3">Satuan</th>
              <th className="text-right py-2 px-3">Harga/Unit</th>
              <th className="text-right py-2 px-3">Total</th>
              {editable && <th className="py-2 px-3"></th>}
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2 px-3">{item.name}</td>
                <td className="text-right py-2 px-3">{item.quantity}</td>
                <td className="py-2 px-3">{item.unit}</td>
                <td className="text-right py-2 px-3">{formatRupiah(item.pricePerUnit)}</td>
                <td className="text-right py-2 px-3 font-medium text-primary">{formatRupiah(item.totalPrice)}</td>
                {editable && (
                  <td className="py-2 px-3">
                    <button onClick={() => handleDelete(item.id)} className="text-danger hover:text-red-400 text-xs">Hapus</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20">
              <td colSpan={4} className="py-2 px-3 font-heading font-bold text-right">Total</td>
              <td className="text-right py-2 px-3 font-heading font-bold text-primary">{formatRupiah(total)}</td>
              {editable && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {editable && (
        <div className="mt-3">
          {adding ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input className="input-field text-sm" placeholder="Nama bahan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input className="input-field text-sm" placeholder="Jumlah" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
              <input className="input-field text-sm" placeholder="Satuan" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
              <input className="input-field text-sm" placeholder="Harga/unit" type="number" value={form.pricePerUnit} onChange={e => setForm({...form, pricePerUnit: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="btn-primary text-sm !px-4 !py-2">Tambah</button>
                <button onClick={() => setAdding(false)} className="text-text-muted text-sm hover:text-white">Batal</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="text-primary hover:text-cyan-300 text-sm font-medium transition-colors">
              + Tambah Bahan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
