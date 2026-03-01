import { useState } from 'react';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { db } from '../db/database';
import { addCategory, deleteCategory, useCategories } from '../db/hooks';

const EMOJI_OPTIONS = ['🍔', '🚗', '🛍️', '🎬', '📄', '💊', '📚', '📦', '💰', '💻', '📈', '🎁', '✨', '🏠', '👕', '🎮', '☕', '🎵', '💅', '🐕'];
const COLOR_OPTIONS = ['#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#10B981', '#6366F1', '#6B7280', '#22C55E', '#14B8A6', '#F97316', '#A855F7'];

export default function Categories() {
  const categories = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newIcon, setNewIcon] = useState('📦');
  const [newColor, setNewColor] = useState('#3B82F6');

  const filteredCategories = categories?.filter((c) => c.type === tab || c.type === 'both') || [];

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast('Masukkan nama kategori', 'error');
      return;
    }
    await addCategory({
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      type: newType,
    });
    toast('Kategori ditambahkan');
    setNewName('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const usages = await db.transactions.where('categoryId').equals(id).count();
    if (usages > 0) {
      toast(`Kategori "${name}" tidak bisa dihapus karena masih dipakai oleh ${usages} transaksi.`, 'error');
      return;
    }

    if (confirm(`Hapus kategori "${name}"?`)) {
      await deleteCategory(id);
      toast('Kategori dihapus');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Kategori</h1>
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

      {/* Tabs */}
      <div className="tab-group">
        <button
          className={`tab-btn ${tab === 'expense' ? 'active' : ''}`}
          onClick={() => setTab('expense')}
        >
          Pengeluaran
        </button>
        <button
          className={`tab-btn ${tab === 'income' ? 'active' : ''}`}
          onClick={() => setTab('income')}
        >
          Pemasukan
        </button>
      </div>

      {/* Category List */}
      <div className="entity-list">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((c) => (
            <div className="entity-item" key={c.id}>
              <div
                className="entity-icon"
                style={{ background: `${c.color}20` }}
              >
                {c.icon}
              </div>
              <span className="entity-name">{c.name}</span>
              <span className="entity-type">{c.type === 'both' ? 'Semua' : c.type === 'income' ? 'Masuk' : 'Keluar'}</span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(c.id, c.name)}
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
            <div className="icon">📂</div>
            <p>Tidak ada kategori {tab === 'income' ? 'pemasukan' : 'pengeluaran'}.</p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kategori">
        <div className="form-group">
          <label>Nama Kategori</label>
          <input
            className="form-input"
            type="text"
            placeholder="Contoh: Makanan"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Tipe</label>
          <div className="type-toggle">
            <button
              className={newType === 'expense' ? 'active-expense' : ''}
              onClick={() => setNewType('expense')}
            >
              Pengeluaran
            </button>
            <button
              className={newType === 'income' ? 'active-income' : ''}
              onClick={() => setNewType('income')}
            >
              Pemasukan
            </button>
          </div>
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
          Tambah Kategori
        </button>
      </Modal>
    </div>
  );
}
