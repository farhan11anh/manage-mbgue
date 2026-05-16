import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createWeekError, setCreateWeekError] = useState('');

  useEffect(() => {
    loadWeeks();
  }, []);

  const loadWeeks = async () => {
    try {
      const res = await api.getWeeks();
      setWeeks(res.weeks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWeek = async () => {
    if (!startDate || !endDate) {
      setCreateWeekError('Tanggal mulai dan akhir wajib diisi');
      return;
    }

    if (endDate <= startDate) {
      setCreateWeekError('Tanggal akhir harus setelah tanggal mulai');
      return;
    }

    setCreateWeekError('');
    try {
      await api.createWeek({ startDate, endDate });
      setCreating(false);
      setStartDate('');
      setEndDate('');
      loadWeeks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl mb-2">
          Halo, {user?.displayName}! 👋
        </h1>
        <p className="text-text-muted">Selamat datang di MBG — platform rencana makan mingguan.</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button onClick={() => navigate('/catalog')} className="btn-primary">📖 Katalog Menu</button>
        <button onClick={() => { setCreating(!creating); setCreateWeekError(''); }} className="btn-accent">📅 Buat Minggu Baru</button>
      </div>

      {creating && (
        <div className="glass-card p-6 mb-8">
          <h3 className="font-heading font-bold text-lg mb-4">Buat Rencana Minggu Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-text-muted mb-1 block">Tanggal Mulai</label>
              <input type="date" className="input-field" value={startDate} onChange={e => { setStartDate(e.target.value); setCreateWeekError(''); }} />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1 block">Tanggal Akhir</label>
              <input type="date" className="input-field" value={endDate} onChange={e => { setEndDate(e.target.value); setCreateWeekError(''); }} />
            </div>
            <div className="flex items-end">
              <button onClick={handleCreateWeek} className="btn-primary">Simpan</button>
            </div>
          </div>
          {createWeekError && <p className="text-danger text-sm mt-2">{createWeekError}</p>}
        </div>
      )}

      {/* Weeks list */}
      <h2 className="font-heading font-bold text-xl mb-4">📋 Daftar Minggu</h2>
      {weeks.length === 0 ? (
        <div className="glass-card p-8 text-center text-text-muted">
          <p>Belum ada rencana minggu. Buat yang pertama!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {weeks.map(week => (
            <Link key={week.id} to={`/week/${week.id}`} className="glass-card p-5 hover:border-primary/30 hover:shadow-neon/20 transition-all duration-300 hover:-translate-y-1 block">
              <h3 className="font-heading font-bold text-lg text-primary">{week.label}</h3>
              <p className="text-sm text-text-muted mt-1">
                {new Date(week.startDate).toLocaleDateString('id-ID')} — {new Date(week.endDate).toLocaleDateString('id-ID')}
              </p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Lihat Rencana</span>
                <Link to={`/recap/${week.id}`} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full" onClick={e => e.stopPropagation()}>Rekap Harga</Link>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
