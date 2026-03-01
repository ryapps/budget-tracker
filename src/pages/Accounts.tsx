import { useState } from 'react';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { db } from '../db/database';
import { addAccount, deleteAccount, useAccounts } from '../db/hooks';

const EMOJI_OPTIONS = ['💵', '🏦', '📱', '💳', '🪙', '💎', '🏧', '💸', '🤑', '🏪'];
const COLOR_OPTIONS = ['#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#14B8A6', '#6366F1', '#F97316', '#6B7280'];

export default function Accounts() {
  const accounts = useAccounts();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('💵');
  const [newColor, setNewColor] = useState('#22C55E');

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast('Masukkan nama akun', 'error');
      return;
    }
    await addAccount({
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
    });
    toast('Akun ditambahkan');
    setNewName('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const usages = await db.transactions.where('accountId').equals(id).count();
    if (usages > 0) {
      toast(`Akun "${name}" tidak bisa dihapus karena masih dipakai oleh ${usages} transaksi.`, 'error');
      return;
    }

    if (confirm(`Hapus akun "${name}"?`)) {
      await deleteAccount(id);
      toast('Akun dihapus');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Akun</h1>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--accent-green)',
            color: 'var(--text-inverse)',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
          }}
          onClick={() => setShowAdd(true)}
        >
          + Tambah
        </button>
      </div>

      {/* Account List */}
      <div className="entity-list">
        {accounts && accounts.length > 0 ? (
          accounts.map((a) => (
            <div className="entity-item" key={a.id}>
              <div
                className="entity-icon"
                style={{ background: `${a.color}20` }}
              >
                {a.icon}
              </div>
              <span className="entity-name">{a.name}</span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(a.id, a.name)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="icon">🏦</div>
            <p>Belum ada akun. Tambahkan akun pertama Anda.</p>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Akun">
        <div className="form-group">
          <label>Nama Akun</label>
          <input
            className="form-input"
            type="text"
            placeholder="Contoh: BCA, GoPay"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Ikon</label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
          }}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setNewIcon(emoji)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: newIcon === emoji ? 'var(--accent-green-dim)' : 'var(--bg-surface)',
                  border: newIcon === emoji ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Warna</label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
          }}>
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-pill)',
                  background: color,
                  border: newColor === color ? '3px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: newColor === color ? `0 0 10px ${color}80` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleAdd} style={{ marginTop: 'var(--spacing-lg)' }}>
          Tambah Akun
        </button>
      </Modal>
    </div>
  );
}
