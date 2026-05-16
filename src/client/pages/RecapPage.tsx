import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import PriceRecap from '../components/PriceRecap';

export default function RecapPage() {
  const { weekId } = useParams();
  const [week, setWeek] = useState<any>(null);
  const [recapItems, setRecapItems] = useState<{ menuName: string; totalPrice: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [weekId]);

  const loadData = async () => {
    try {
      const res = await api.getWeek(parseInt(weekId!));
      setWeek(res.week);

      const items = [];
      for (const menu of res.menus) {
        const ingRes = await api.getIngredients(menu.id);
        const total = ingRes.ingredients.reduce((sum: number, i: any) => sum + (i.totalPrice || 0), 0);
        items.push({ menuName: menu.menuName, totalPrice: total });
      }
      setRecapItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    api.exportWeek(parseInt(weekId!));
  };

  if (loading) return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl">📊 Rekap Harga</h1>
          {week && <p className="text-sm text-text-muted mt-1">{week.label}</p>}
        </div>
        <button onClick={handleExport} className="btn-secondary">📥 Download Excel</button>
      </div>

      <PriceRecap items={recapItems} />
    </div>
  );
}
