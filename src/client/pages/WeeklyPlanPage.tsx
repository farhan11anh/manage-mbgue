import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, WeekSummary } from '../lib/api';
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

  if (!week) return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl">{week.label}</h1>
          <p className="text-sm text-text-muted">
            {new Date(week.startDate).toLocaleDateString('id-ID')} — {new Date(week.endDate).toLocaleDateString('id-ID')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/propose?weekId=${id}`} className="btn-primary text-sm">+ Usulkan Menu</Link>
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
              <h3 className="font-heading font-bold text-primary mb-3">{day}</h3>
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
    </div>
  );
}
