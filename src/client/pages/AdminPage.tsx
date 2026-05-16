import { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { api, AdminUser } from '../lib/api';
import { useAuth } from '../lib/auth';

function PasswordResultModal({
  isOpen,
  username,
  password,
  onClose,
}: {
  isOpen: boolean;
  username: string;
  password: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md border border-white/15 p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-2xl">🔑</div>
          <h3 className="font-heading text-xl font-bold">Password Baru Dibuat</h3>
          <p className="mt-2 text-sm text-text-muted">
            Simpan password sementara untuk <span className="text-primary">{username}</span> dan bagikan secara aman.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-bg-card/80 px-4 py-4 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">Password sementara</p>
          <p className="font-mono text-2xl font-bold text-primary">{password}</p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(password);
            }}
            className="btn-secondary flex-1"
          >
            Salin
          </button>
          <button onClick={onClose} className="btn-primary flex-1">Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AdminUser | null>(null);
  const [passwordResult, setPasswordResult] = useState<{ username: string; password: string } | null>(null);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const runAction = async (userId: number, action: () => Promise<void>) => {
    setError('');
    setBusyId(userId);
    try {
      await action();
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Aksi gagal dijalankan');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-primary">Admin Dashboard</p>
            <h1 className="font-heading font-extrabold text-3xl">Kelola Pengguna MBG</h1>
            <p className="mt-2 text-sm text-text-muted">
              Setujui akun baru, atur hak admin, dan reset password pengguna dari satu tempat.
            </p>
          </div>
          <button onClick={loadUsers} className="btn-secondary" disabled={loading || busyId !== null}>
            Muat Ulang
          </button>
        </div>
      </div>

      {error && <div className="glass-card border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="glass-card p-5 overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-text-muted">Memuat data pengguna...</div>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-text-muted">
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Password</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => {
                const isBusy = busyId === item.id;
                const isSelf = user?.id === item.id;
                return (
                  <tr key={item.id} className="border-b border-white/5 align-top">
                    <td className="px-3 py-4">
                      <div className="font-semibold text-text-main">
                        {item.displayName}
                        {isSelf ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Anda</span> : null}
                      </div>
                      <div className="text-xs text-text-muted">@{item.username}</div>
                      <div className="mt-1 text-xs text-text-muted">Bergabung {new Date(item.createdAt).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isApproved ? 'bg-success/15 text-success border border-success/25' : 'bg-secondary/15 text-secondary border border-secondary/25'}`}>
                          {item.isApproved ? 'Disetujui' : 'Menunggu'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isAdmin ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-white/10 text-text-muted border border-white/10'}`}>
                          {item.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {item.mustChangePassword ? (
                        <span className="rounded-full border border-accent/25 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                          Harus ganti password
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Normal</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!item.isApproved ? (
                          <>
                            <button
                              onClick={() => runAction(item.id, () => api.approveUser(item.id).then(() => undefined))}
                              disabled={isBusy}
                              className="btn-primary !px-3 !py-2 text-xs"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => setRejectTarget(item)}
                              disabled={isBusy || isSelf}
                              className="btn-secondary !px-3 !py-2 text-xs"
                            >
                              Tolak
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => runAction(item.id, async () => {
                            const res = await api.resetPassword(item.id);
                            setPasswordResult({ username: item.username, password: res.password });
                          })}
                          disabled={isBusy}
                          className="btn-accent !px-3 !py-2 text-xs"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => runAction(item.id, () => api.toggleAdmin(item.id).then(() => undefined))}
                          disabled={isBusy}
                          className="btn-secondary !px-3 !py-2 text-xs"
                        >
                          {item.isAdmin ? 'Cabut Admin' : 'Jadikan Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={!!rejectTarget}
        title="Tolak akun ini?"
        message={`User @${rejectTarget?.username ?? ''} akan dihapus karena belum disetujui.`}
        confirmText="Ya, Tolak"
        cancelText="Batal"
        danger
        requireType="TOLAK"
        onCancel={() => setRejectTarget(null)}
        onConfirm={async () => {
          if (!rejectTarget) return;
          await runAction(rejectTarget.id, () => api.rejectUser(rejectTarget.id).then(() => undefined));
          setRejectTarget(null);
        }}
      />

      <PasswordResultModal
        isOpen={!!passwordResult}
        username={passwordResult?.username ?? ''}
        password={passwordResult?.password ?? ''}
        onClose={() => setPasswordResult(null)}
      />
    </div>
  );
}
