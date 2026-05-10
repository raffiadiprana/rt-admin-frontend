import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHouses, createHouse, updateHouse, deleteHouse } from '../api/client'
import Modal from '../components/Modal'

export default function Houses() {
  const [houses, setHouses]   = useState([])
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState({ house_number: '', address: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    getHouses().then((r) => setHouses(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ house_number: '', address: '', notes: '' })
    setModal(true)
  }

  const openEdit = (e, house) => {
    e.stopPropagation()
    setEditing(house)
    setForm({ house_number: house.house_number, address: house.address || '', notes: house.notes || '' })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await updateHouse(editing.id, form)
      else await createHouse(form)
      setModal(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (e, house) => {
    e.stopPropagation()
    if (!confirm(`Hapus rumah ${house.house_number}? Data tidak bisa dikembalikan.`)) return
    setDeleting(house.id)
    try {
      await deleteHouse(house.id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus rumah')
    } finally { setDeleting(null) }
  }

  const occupied = houses.filter((h) => h.is_occupied).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Rumah</h1>
          <p className="text-sm text-gray-500 mt-1">
            {occupied} dihuni · {houses.length - occupied} kosong · {houses.length} total
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Tambah Rumah</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {houses.map((house) => (
            <div
              key={house.id}
              onClick={() => navigate(`/houses/${house.id}`)}
              className="card cursor-pointer hover:shadow-md hover:border-blue-200 transition-all p-4 relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">🏠</div>
                <span className={house.is_occupied ? 'badge-occupied' : 'badge-empty'}>
                  {house.is_occupied ? 'Dihuni' : 'Kosong'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{house.house_number}</h3>
              {house.current_resident ? (
                <p className="text-xs text-gray-500 mt-1 truncate">{house.current_resident.name}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1 italic">Tidak ada penghuni</p>
              )}
              {house.current_resident && (
                <span className="text-xs text-blue-500 mt-1 block">
                  {house.current_resident.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}
                </span>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={(e) => openEdit(e, house)}
                  className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => handleDelete(e, house)}
                  disabled={deleting === house.id}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting === house.id ? '...' : '🗑️ Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Rumah' : 'Tambah Rumah'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nomor Rumah *</label>
            <input className="input" value={form.house_number} onChange={(e) => setForm({ ...form, house_number: e.target.value })} placeholder="Contoh: A-01" />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" />
          </div>
          <div>
            <label className="label">Catatan</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button onClick={save} disabled={saving || !form.house_number} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
