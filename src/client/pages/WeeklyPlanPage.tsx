import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, WeekSummary, CatalogMenu } from '../lib/api';
import MenuCard from '../components/MenuCard';
import ConfirmModal from '../components/ConfirmModal';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MEAL_TYPES = ['Sarapan', 'Makan Siang', 'Makan Malam'];

const formatRupiah = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
const formatQty = (value: number) => Number.isInteger(value)
  ? value.toString()
  : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value);

function buildWhatsappMessage(summary: WeekSummary) {
  const menuLookup = new Map(
    summary.menus.map((menu) => [
      `${menu.day}::${menu.meal}`,
      menu.actualMenuName && menu.actualMenuName !== menu.menuName
        ? `${menu.menuName} → ${menu.actualMenuName}`
        : (menu.actualMenuName || menu.menuName),
    ])
  );

  const menuSection = DAYS.map((day) => {
    const mealLines = MEAL_TYPES.map((meal) => `- ${meal}: ${menuLookup.get(`${day}::${meal}`) || '-'}`);
    return `${day}:\n${mealLines.join('\n')}`;
  }).join('\n\n');

  const ingredientSection = summary.ingredients.length
    ? summary.ingredients.map((item, index) => (
        `${index + 1}. ${item.name} - ${formatQty(item.totalQty)} ${item.unit} (${formatRupiah(item.totalPrice)})`
      )).join('\n')
    : '1. Belum ada bahan yang tercatat';

  return `*🥗 MBG - Rekap Minggu ${summary.weekLabel}*\n\n*📋 Menu:*\n${menuSection}\n\n*🛒 Bahan yang dibutuhkan:*\n${ingredientSection}\n\n*💰 Total: ${formatRupiah(summary.grandTotal)}*`;
}

function WhatsAppModal({
  isOpen,
  phone,
  error,
  loading,
  onPhoneChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  phone: string;
  error: string;
  loading: boolean;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md border border-white/15 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/15 text-2xl">📲</div>
          <h3 className="font-heading text-xl font-bold">Kirim Rekap ke WhatsApp</h3>
          <p className="mt-2 text-sm text-text-muted">Masukkan nomor tujuan dengan format Indonesia. Prefix +62 sudah disiapkan.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-muted">Nomor WhatsApp</label>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5">
              <span className="text-sm font-semibold text-primary">+62</span>
              <input
                className="w-full bg-transparent text-sm outline-none"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
                placeholder="81234567890"
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Batal</button>
            <button onClick={onSubmit} className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Menyiapkan...' : 'Buka WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignMenuModal({
  isOpen,
  day,
  onClose,
  onAssign,
}: {
  isOpen: boolean;
  day: string;
  onClose: () => void;
  onAssign: (catalogMenuId: number, mealType: string, note?: string) => void;
}) {
  const [catalogMenus, setCatalogMenus] = useState<CatalogMenu[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mealType, setMealType] = useState('Makan Siang');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getCatalogMenus().then(res => setCatalogMenus(res.menus)).catch(console.error);
      setSelectedId(null);
      setMealType('Makan Siang');
      setNote('');
      setSearch('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = catalogMenus.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedId) {
      setError('Pilih menu terlebih dahulu');
      return;
    }

    setError('');
    setLoading(true);
    onAssign(selectedId, mealType, note || undefined);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-lg border border-white/15 p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-2xl">🍽️</div>
          <h3 className="font-heading text-xl font-bold">Tambah Menu - {day}</h3>
          <p className="mt-1 text-sm text-text-muted">Pilih menu dari katalog</p>
        </div>

        <div className="mb-3">
          <select className="input-field !py-2 text-sm" value={mealType} onChange={e => setMealType(e.target.value)}>
            {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <input
          className="input-field !py-2 text-sm mb-3"
          placeholder="🔍 Cari menu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto space-y-1.5 mb-3 min-h-0 max-h-[30vh]">
          {filtered.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              {catalogMenus.length === 0 ? (
                <>Belum ada menu di katalog. <a href="/catalog" className="text-primary">Tambahkan dulu →</a></>
              ) : 'Tidak ada menu yang cocok'}
            </p>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedId(m.id); setError(''); }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedId === m.id
                    ? 'border-primary bg-primary/10'
                    : 'border-white/5 hover:border-white/15 bg-white/5'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{m.name}</span>
                  <span className="text-xs text-accent">{formatRupiah(m.estimatedPrice || 0)}</span>
                </div>
                {m.description && <p className="text-xs text-text-muted mt-1 line-clamp-1">{m.description}</p>}
                <span className="text-xs text-text-muted">{m.ingredientCount || 0} bahan</span>
              </button>
            ))
          )}
        </div>

        <textarea
          className="input-field resize-none text-sm mb-3"
          rows={2}
          placeholder="Catatan (opsional, misal: tanpa pedas)"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? '...' : 'Tambahkan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPlanPage() {
  const { id } = useParams();
  const [week, setWeek] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [filterDay, setFilterDay] = useState('');
  const [filterMeal, setFilterMeal] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsAppError, setWhatsAppError] = useState('');
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [assignDay, setAssignDay] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await api.getWeek(parseInt(id!));
      setWeek(res.week);
      setMenus(res.menus);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (menuId: number) => {
    const menuItem = menus.find(m => m.id === menuId);
    setDeleteTarget({ id: menuId, name: menuItem?.menuName || '' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteMenu(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus');
    }
  };

  const filteredMenus = menus.filter(m => {
    if (filterDay && m.dayOfWeek !== filterDay) return false;
    if (filterMeal && m.mealType !== filterMeal) return false;
    return true;
  });

  const handleExport = async () => {
    try {
      await api.exportWeek(parseInt(id!));
    } catch (e: any) {
      alert(e.message || 'Gagal export');
    }
  };

  const handleOpenWhatsApp = () => {
    setWhatsAppError('');
    setWhatsAppOpen(true);
  };

  const handleSendWhatsApp = async () => {
    const normalizedPhone = phoneNumber.replace(/\D/g, '').replace(/^62/, '').replace(/^0+/, '');
    if (!normalizedPhone) {
      setWhatsAppError('Nomor WhatsApp wajib diisi');
      return;
    }

    setWhatsAppError('');
    setWhatsAppLoading(true);
    try {
      const summary = await api.getWeekSummary(parseInt(id!));
      const message = buildWhatsappMessage(summary);
      const targetUrl = `https://wa.me/62${normalizedPhone}?text=${encodeURIComponent(message)}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setWhatsAppOpen(false);
    } catch (e: any) {
      setWhatsAppError(e.message || 'Gagal menyiapkan pesan WhatsApp');
    } finally {
      setWhatsAppLoading(false);
    }
  };

  const handleAssignMenu = async (catalogMenuId: number, mealType: string, note?: string) => {
    if (!assignDay) return;
    try {
      await api.createMenu(parseInt(id!), { catalogMenuId, dayOfWeek: assignDay, mealType, note });
      setAssignDay(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Gagal menambahkan menu');
    }
  };

  if (!week) return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4"
      >
        ← Kembali ke Dashboard
      </Link>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl">{week.label}</h1>
          <p className="text-sm text-text-muted">
            {new Date(week.startDate).toLocaleDateString('id-ID')} — {new Date(week.endDate).toLocaleDateString('id-ID')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/catalog" className="btn-primary text-sm">📖 Katalog Menu</Link>
          <button onClick={handleExport} className="btn-secondary text-sm">📊 Export Excel</button>
          <button onClick={handleOpenWhatsApp} className="btn-accent text-sm">📲 Kirim ke WhatsApp</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select className="input-field w-auto !py-2 text-sm" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
          <option value="">Semua Hari</option>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input-field w-auto !py-2 text-sm" value={filterMeal} onChange={e => setFilterMeal(e.target.value)}>
          <option value="">Semua Jenis</option>
          {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
        {DAYS.filter(d => !filterDay || d === filterDay).map(day => {
          const dayMenus = filteredMenus.filter(m => m.dayOfWeek === day);
          return (
            <div key={day} className="glass-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-primary">{day}</h3>
                <button
                  onClick={() => setAssignDay(day)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold"
                  title="Tambah menu dari katalog"
                >
                  +
                </button>
              </div>
              <div className="flex-1">
                {dayMenus.length === 0 ? (
                  <p className="text-sm text-text-muted">Belum ada menu</p>
                ) : (
                  <div className="space-y-3">
                    {dayMenus.map(menu => (
                      <MenuCard
                        key={menu.id}
                        menu={menu}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Menu?"
        message={`Menu "${deleteTarget?.name || ''}" beserta semua bahan, vote, dan komentar akan dihapus permanen.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger
        requireType="HAPUS"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <WhatsAppModal
        isOpen={whatsAppOpen}
        phone={phoneNumber}
        error={whatsAppError}
        loading={whatsAppLoading}
        onPhoneChange={setPhoneNumber}
        onClose={() => setWhatsAppOpen(false)}
        onSubmit={handleSendWhatsApp}
      />

      <AssignMenuModal
        isOpen={!!assignDay}
        day={assignDay || ''}
        onClose={() => setAssignDay(null)}
        onAssign={handleAssignMenu}
      />
    </div>
  );
}
