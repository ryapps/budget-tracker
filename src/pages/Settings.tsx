import { useRef, useState } from 'react';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';
import { exportData, importData, resetAllData } from '../db/backup';
import { db } from '../db/database';
import { useAccounts, useMeta } from '../db/hooks';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const accounts = useAccounts();
  const defaultAccountMeta = useMeta('defaultAccountId');
  const lastBackupTimeMeta = useMeta('lastBackupTime');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const daysSinceBackup = lastBackupTimeMeta?.value 
    ? Math.floor((Date.now() - Number(lastBackupTimeMeta.value)) / (1000 * 60 * 60 * 24)) 
    : -1;

  const handleExport = async () => {
    try {
      await exportData();
      toast('Backup berhasil didownload');
    } catch (err) {
      console.error(err);
      toast('Gagal melakukan backup', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Ini akan mengganti semua data yang ada. Lanjutkan?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImporting(true);
    const result = await importData(file);
    setImporting(false);

    if (result.success) {
      toast(result.message);
    } else {
      toast(result.message, 'error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDefaultAccount = async (accountId: string) => {
    await db.meta.put({ key: 'defaultAccountId', value: accountId });
    toast('Akun default berhasil diubah');
  };

  const handleResetData = async () => {
    if (resetInput !== 'HAPUS') {
      toast('Kata sandi tidak cocok', 'error');
      return;
    }
    
    try {
      await resetAllData();
      toast('Semua data berhasil direset');
      setShowResetModal(false);
      setResetInput('');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast('Gagal mereset data', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pengaturan</h1>
      </div>

      {/* Default Account */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div className="section-header">
          <h2>Preferensi</h2>
        </div>
        <div className="settings-list">
          {/* Theme Toggle */}
          <div className="settings-item" onClick={toggleTheme}>
            <div className="settings-icon" style={{ background: 'var(--accent-amber-dim)' }}>
              {theme === 'light' ? '☀️' : '🌙'}
            </div>
            <div className="settings-info">
              <div className="title">Tema Tampilan</div>
              <div className="desc">{theme === 'light' ? 'Mode Terang' : 'Mode Gelap'}</div>
            </div>
            <div className="arrow" style={{ transform: 'none', background: 'var(--bg-card)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
              Ubah
            </div>
          </div>

          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon" style={{ background: 'var(--accent-blue-dim)' }}>
              🏦
            </div>
            <div className="settings-info" style={{ flex: 1 }}>
              <div className="title">Akun Default</div>
              <div className="desc">Digunakan saat menambah transaksi baru</div>
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '120px', padding: '8px 32px 8px 12px', fontSize: 'var(--font-sm)' }}
              value={(defaultAccountMeta?.value as string) || ''}
              onChange={(e) => handleDefaultAccount(e.target.value)}
            >
              <option value="">Tidak ada</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div className="section-header">
          <h2>Backup & Restore</h2>
        </div>
        <div className="settings-list">
          <div className="settings-item" onClick={handleExport}>
            <div className="settings-icon" style={{ background: 'var(--accent-green-dim)' }}>
              📤
            </div>
            <div className="settings-info">
              <div className="title">
                Export Backup
                {daysSinceBackup > 30 && (
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--accent-red)',
                    background: 'var(--accent-red-dim)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                  }}>
                    Terakhir backup {daysSinceBackup} hari lalu
                  </span>
                )}
              </div>
              <div className="desc">Download data sebagai file JSON</div>
            </div>
            <div className="arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div className="settings-item" onClick={() => fileInputRef.current?.click()}>
            <div className="settings-icon" style={{ background: 'var(--accent-amber-dim)' }}>
              📥
            </div>
            <div className="settings-info">
              <div className="title">{importing ? 'Mengimport...' : 'Import Backup'}</div>
              <div className="desc">Pulihkan data dari file JSON</div>
            </div>
            <div className="arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {/* Danger Zone */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div className="section-header">
          <h2 style={{ color: 'var(--accent-red)' }}>Danger Zone</h2>
        </div>
        <div className="settings-list">
          <div className="settings-item" onClick={() => setShowResetModal(true)}>
            <div className="settings-icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>
              ⚠️
            </div>
            <div className="settings-info">
              <div className="title" style={{ color: 'var(--accent-red)' }}>Hapus Semua Data (Reset)</div>
              <div className="desc">Tindakan ini tidak dapat dibatalkan</div>
            </div>
            <div className="arrow" style={{ color: 'var(--accent-red)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div>
        <div className="section-header">
          <h2>Tentang</h2>
        </div>
        <div className="settings-list">
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon" style={{ background: 'var(--accent-purple-dim)' }}>
              💰
            </div>
            <div className="settings-info">
              <div className="title">Budget Tracker</div>
              <div className="desc">v1.0.0 — Offline-first PWA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Data Modal */}
      <Modal isOpen={showResetModal} onClose={() => {
        setShowResetModal(false);
        setResetInput('');
      }} title="Hapus Semua Data">
        <div style={{ padding: 'var(--spacing-md) 0' }}>
          <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
            Perhatian! Ini akan menghapus <strong>seluruh</strong> transaksi, kategori, dan akun Anda. Data yang sudah dihapus tidak dapat dikembalikan kecuali Anda memiliki file backup.
          </p>
          <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label>Ketik <strong style={{ color: 'var(--accent-red)' }}>HAPUS</strong> untuk mengonfirmasi:</label>
            <input
              className="form-input"
              type="text"
              placeholder="HAPUS"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              style={{ borderColor: resetInput === 'HAPUS' ? 'var(--accent-red)' : '' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button 
              style={{ 
                flex: 1, 
                padding: 'var(--spacing-md)', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                cursor: 'pointer'
              }} 
              onClick={() => {
                setShowResetModal(false);
                setResetInput('');
              }}
            >
              Batal
            </button>
            <button 
              style={{ 
                flex: 1, 
                padding: 'var(--spacing-md)', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--accent-red)', 
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                opacity: resetInput === 'HAPUS' ? 1 : 0.5,
                cursor: resetInput === 'HAPUS' ? 'pointer' : 'not-allowed'
              }} 
              disabled={resetInput !== 'HAPUS'}
              onClick={handleResetData}
            >
              Reset Data Final
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
