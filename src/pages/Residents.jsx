import { useState, useEffect, useRef } from 'react'
import { getResidents, createResident, updateResident, deleteResident } from '../api/client'
import Modal from '../components/Modal'

export default function Residents() {
  const [residents, setResidents] = useState([])
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState({ name: '', resident_type: 'permanent', phone: '', is_married: false })
  const [photo, setPhoto]         = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(null)
  const fileRef = useRef()

  const load = () => {
    setLoading(true)
    getResidents().then((r) => setResidents(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', resident_type: 'permanent', phone: '', is_married: false })
    setPhoto(null)
    setPhotoPreview(null)
    setModal(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({ name: r.name, resident_type: r.resident_type, phone: r.phone || '', is_married: r.is_married })
    setPhoto(null)
    setPhotoPreview(r.ktp_photo_url || null)
    setModal(true)
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('name', form.name)
      fd.set('resident_type', form.resident_type)
      fd.set('phone', form.phone)
      fd.set('is_married', form.is_married ? '1' : '0')
      if (photo) fd.append('ktp_photo', photo)

      if (editing) await updateResident(editing.id, fd)
      else await createResident(fd)

      setModal(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (r) => {
    if (!confirm(`Hapus penghuni "${r.name}"? Data tidak bisa dikembalikan.`)) return
    setDeleting(r.id)
    try {
      await deleteResident(r.id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus penghuni')
    } finally { setDeleting(null) }
  }

  const filtered = residents.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Penghuni</h1>
          <p className="text-sm text-gray-500 mt-1">{residents.length} penghuni terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Tambah Penghuni</button>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Cari nama penghuni..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Memuat data...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Nama</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Telepon</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Menikah</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Hunian</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">KTP</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-6 py-3">
                    <span className={r.resident_type === 'permanent'
                      ? 'badge-occupied'
                      : 'text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700'}>
                      {r.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{r.phone || '-'}</td>
                  <td className="px-6 py-3 text-gray-600">{r.is_married ? 'Ya' : 'Belum'}</td>
                  <td className="px-6 py-3 text-gray-600">{r.current_house?.house_number || '-'}</td>
                  <td className="px-6 py-3">
                    {r.ktp_photo_url
                      ? <a href={r.ktp_photo_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">Lihat</a>
                      : <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deleting === r.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        {deleting === r.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Tidak ada penghuni</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Penghuni' : 'Tambah Penghuni'} size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Nama Lengkap *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap sesuai KTP" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status Penghuni *</label>
              <select className="input" value={form.resident_type} onChange={(e) => setForm({ ...form, resident_type: e.target.value })}>
                <option value="permanent">Tetap</option>
                <option value="contract">Kontrak</option>
              </select>
            </div>
            <div>
              <label className="label">Nomor Telepon</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx-xxxx-xxxx" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="married" checked={form.is_married} onChange={(e) => setForm({ ...form, is_married: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="married" className="text-sm text-gray-700">Sudah menikah</label>
          </div>
          <div>
            <label className="label">Foto KTP</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs">
                {photo ? 'Ganti Foto' : 'Upload Foto KTP'}
              </button>
              {photo && <span className="text-xs text-gray-500">{photo.name}</span>}
            </div>
            {photoPreview && (
              <img src={photoPreview} alt="Preview KTP" className="mt-2 rounded-lg border max-h-32 object-contain" />
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button onClick={save} disabled={saving || !form.name} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
