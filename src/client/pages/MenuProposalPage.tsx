import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MEAL_TYPES = ['Sarapan', 'Makan Siang', 'Makan Malam'];

export default function MenuProposalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [weeks, setWeeks] = useState<any[]>([]);
  const [weekId, setWeekId] = useState(searchParams.get('weekId') || '');
  const [dayOfWeek, setDayOfWeek] = useState('Senin');
  const [mealType, setMealType] = useState('Makan Siang');
  const [menuName, setMenuName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getWeeks().then(res => setWeeks(res.weeks)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekId) { setError('Pilih minggu terlebih dahulu'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.createMenu(parseInt(weekId), { dayOfWeek, mealType, menuName, description }) as { menu: any };
      navigate(`/menus/${res.menu.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading font-extrabold text-2xl mb-6">🍳 Usulkan Menu Baru</h1>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="text-sm text-text-muted mb-1 block">Minggu</label>
          <select className="input-field" value={weekId} onChange={e => setWeekId(e.target.value)} required>
            <option value="">Pilih minggu...</option>
            {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Hari</label>
            <select className="input-field" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Jenis Makan</label>
            <select className="input-field" value={mealType} onChange={e => setMealType(e.target.value)}>
              {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-1 block">Nama Menu</label>
          <input className="input-field" value={menuName} onChange={e => setMenuName(e.target.value)} placeholder="Contoh: Nasi Goreng Spesial" required />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-1 block">Deskripsi (opsional)</label>
          <textarea className="input-field resize-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi singkat tentang menu ini..." />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Menyimpan...' : '💾 Simpan & Tambah Bahan'}
        </button>
      </form>
    </div>
  );
}
