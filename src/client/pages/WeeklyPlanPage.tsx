import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import MenuCard from '../components/MenuCard';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MEAL_TYPES = ['Sarapan', 'Makan Siang', 'Makan Malam'];

export default function WeeklyPlanPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [week, setWeek] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [filterDay, setFilterDay] = useState('');
  const [filterMeal, setFilterMeal] = useState('');

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
    if (!confirm('⚠️ Yakin ingin menghapus menu "' + (menuItem?.menuName || '') + '"?\n\nSemua data terkait akan ikut terhapus.')) return;
    if (!confirm('🔴 Konfirmasi sekali lagi: Hapus menu ini?')) return;
    try {
      await api.deleteMenu(menuId);
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

  const handleExport = () => {
    api.exportWeek(parseInt(id!));
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
        <div className="flex gap-2">
          <Link to={`/propose?weekId=${id}`} className="btn-primary text-sm">+ Usulkan Menu</Link>
          <button onClick={handleExport} className="btn-secondary text-sm">📊 Export Excel</button>
        </div>
      </div>

      {/* Filters */}
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

      {/* Grid by day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.filter(d => !filterDay || d === filterDay).map(day => {
          const dayMenus = filteredMenus.filter(m => m.dayOfWeek === day);
          return (
            <div key={day} className="glass-card p-4">
              <h3 className="font-heading font-bold text-primary mb-3">{day}</h3>
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
          );
        })}
      </div>
    </div>
  );
}
