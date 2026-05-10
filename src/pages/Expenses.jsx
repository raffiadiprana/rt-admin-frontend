import { useState, useEffect } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/client'
import Modal from '../components/Modal'

const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const CATEGORIES = ['Gaji Satpam', 'Token Listrik Pos', 'Perbaikan Jalan', 'Perbaikan Selokan', 'Kebersihan', 'Operasional', 'Lainnya']

export default function Expenses() {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState('')
  const [expenses, setExpenses] = useState([])
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    category: 'Gaji Satpam', description: '', amount: '',
    expense_date: new Date().toISOString().split('T')[0],
  })

  const load = () => {
    setLoading(true)
    getExpenses(year, month || undefined).then((r) => setExpenses(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [year, month])

  const openAdd = () => {
    setEditing(null)
    setForm({ category: 'Gaji Satpam', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] })
    setModal(true)
  }

  const openEdit = (e) => {
    setEditing(e)
    setForm({ category: e.category, description: e.description, amount: e.amount, expense_date: e.expense_date })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await updateExpense(editing.id, form)
      else await createExpense(form)
      setModal(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengeluaran ini?')) return
    try { await deleteExpense(id); load() } catch { alert('Gagal menghapus') }
  }

  const total = expenses.reduce((s, e) => s + +e.amount, 0)

  // Group by category untuk summary
  const byCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + +e.amount
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {rupiah(total)}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-36" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Semua Bulan</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-24" value={year} onChange={(e) => setYear(+e.target.value)}>
            {[2023,2024,2025,2026].map((y) => <option key={y}>{y}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary">+ Tambah Pengeluaran</button>
        </div>
      </div>

      {/* Category summary */}
      {Object.keys(byCat).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(byCat).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
            <div key={cat} className="card py-3 px-4">
              <p className="text-xs text-gray-500 truncate">{cat}</p>
              <p className="text-base font-bold text-gray-800 mt-0.5">{rupiah(amt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Detail Pengeluaran</h2>
          <span className="text-xs text-gray-400">{expenses.length} item</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Tanggal</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Kategori</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Keterangan</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Jumlah</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(e.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">{e.category}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{e.description}</td>
                  <td className="px-6 py-3 text-right font-semibold text-red-600">{rupiah(e.amount)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(e)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:text-red-600">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Belum ada pengeluaran</td></tr>
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-red-600">{rupiah(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}>
        <div className="space-y-4">
          <div>
            <label className="label">Kategori *</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Keterangan *</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi pengeluaran" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Jumlah (Rp) *</label>
              <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="label">Tanggal *</label>
              <input type="date" className="input" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button onClick={save} disabled={saving || !form.description || !form.amount} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
