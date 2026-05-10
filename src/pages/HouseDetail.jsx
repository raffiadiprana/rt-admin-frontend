import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getHouse, getHouseHistory, getHousePayments,
  getResidents, assignResident, removeResident, updatePayment,
} from '../api/client'
import Modal from '../components/Modal'

const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

export default function HouseDetail() {
  const { id } = useParams()
  const [house, setHouse]       = useState(null)
  const [history, setHistory]   = useState([])
  const [payments, setPayments] = useState([])
  const [residents, setResidents] = useState([])
  const [tab, setTab]           = useState('info')
  const [assignModal, setAssignModal] = useState(false)
  const [assignForm, setAssignForm]   = useState({ resident_id: '', start_date: new Date().toISOString().split('T')[0] })
  const [year, setYear]   = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadHouse = () => getHouse(id).then((r) => setHouse(r.data.data))
  const loadHistory = () => getHouseHistory(id).then((r) => setHistory(r.data.data))
  const loadPayments = () => getHousePayments(id, year, month).then((r) => setPayments(r.data.data))

  useEffect(() => {
    setLoading(true)
    Promise.all([loadHouse(), loadHistory(), getResidents().then((r) => setResidents(r.data.data))])
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadPayments() }, [id, year, month])

  const handleAssign = async () => {
    setSaving(true)
    try {
      await assignResident(id, assignForm)
      setAssignModal(false)
      loadHouse()
      loadHistory()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menetapkan penghuni')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Yakin mengeluarkan penghuni ini?')) return
    try {
      await removeResident(id)
      loadHouse()
      loadHistory()
    } catch (err) {
      alert('Gagal mengeluarkan penghuni')
    }
  }

  const togglePaid = async (payment) => {
    try {
      await updatePayment(payment.id, { is_paid: !payment.is_paid })
      loadPayments()
    } catch { alert('Gagal memperbarui status') }
  }

  if (loading || !house) return <div className="flex items-center justify-center h-64 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/houses" className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rumah {house.house_number}</h1>
          <p className="text-sm text-gray-500">{house.address}</p>
        </div>
        <span className={house.is_occupied ? 'badge-occupied ml-auto' : 'badge-empty ml-auto'}>
          {house.is_occupied ? 'Dihuni' : 'Tidak Dihuni'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['info','Info & Penghuni'], ['history','Riwayat Penghuni'], ['payments','Riwayat Pembayaran']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800">Informasi Rumah</h2>
            <div className="text-sm space-y-1">
              <div className="flex gap-2"><span className="text-gray-400 w-24">No. Rumah</span><span className="font-medium">{house.house_number}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24">Alamat</span><span>{house.address || '-'}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24">Catatan</span><span>{house.notes || '-'}</span></div>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Penghuni Saat Ini</h2>
              <div className="flex gap-2">
                <button onClick={() => setAssignModal(true)} className="btn-primary text-xs px-3 py-1.5">
                  {house.is_occupied ? 'Ganti' : 'Tetapkan'}
                </button>
                {house.is_occupied && (
                  <button onClick={handleRemove} className="btn-danger text-xs px-3 py-1.5">Keluarkan</button>
                )}
              </div>
            </div>

            {house.current_resident ? (
              <div className="text-sm space-y-1">
                <div className="flex gap-2"><span className="text-gray-400 w-24">Nama</span><span className="font-medium">{house.current_resident.name}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-24">Status</span>
                  <span className={house.current_resident.resident_type === 'permanent' ? 'text-blue-600' : 'text-orange-500'}>
                    {house.current_resident.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}
                  </span>
                </div>
                <div className="flex gap-2"><span className="text-gray-400 w-24">Telepon</span><span>{house.current_resident.phone || '-'}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-24">Menikah</span><span>{house.current_resident.is_married ? 'Ya' : 'Belum'}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-24">Mulai</span><span>{house.current_resident.start_date}</span></div>
                {house.current_resident.ktp_photo_url && (
                  <div className="mt-2">
                    <span className="text-gray-400">Foto KTP</span>
                    <img src={house.current_resident.ktp_photo_url} alt="KTP" className="mt-1 rounded-lg border max-w-full h-32 object-cover" />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Tidak ada penghuni aktif</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Riwayat Penghuni</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada riwayat penghuni</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Nama</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Tipe</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Masuk</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Keluar</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium">{h.resident_name}</td>
                    <td className="py-2 text-gray-600">{h.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'}</td>
                    <td className="py-2 text-gray-600">{h.start_date}</td>
                    <td className="py-2 text-gray-600">{h.end_date || '—'}</td>
                    <td className="py-2">
                      <span className={h.is_active ? 'badge-occupied' : 'badge-empty'}>
                        {h.is_active ? 'Aktif' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Payments */}
      {tab === 'payments' && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-800">Riwayat Pembayaran</h2>
            <div className="flex gap-2 ml-auto">
              <select className="input w-28" value={month} onChange={(e) => setMonth(+e.target.value)}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="input w-24" value={year} onChange={(e) => setYear(+e.target.value)}>
                {[2023,2024,2025,2026].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada tagihan untuk periode ini</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Jenis Iuran</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Penghuni</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Jumlah</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Dibayar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium">{p.fee_category?.name}</td>
                    <td className="py-2 text-gray-600">{p.resident?.name || '-'}</td>
                    <td className="py-2 text-right">{rupiah(p.amount)}</td>
                    <td className="py-2">
                      <span className={p.is_paid ? 'badge-paid' : 'badge-unpaid'}>
                        {p.is_paid ? 'Lunas' : 'Belum'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="py-2">
                      <button onClick={() => togglePaid(p)}
                        className={`text-xs px-2 py-1 rounded ${p.is_paid ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {p.is_paid ? 'Tandai Belum' : 'Tandai Lunas'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Assign Resident */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Tetapkan Penghuni">
        <div className="space-y-4">
          <div>
            <label className="label">Pilih Penghuni *</label>
            <select className="input" value={assignForm.resident_id} onChange={(e) => setAssignForm({ ...assignForm, resident_id: e.target.value })}>
              <option value="">-- Pilih Penghuni --</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.resident_type === 'permanent' ? 'Tetap' : 'Kontrak'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tanggal Mulai *</label>
            <input type="date" className="input" value={assignForm.start_date} onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Batal</button>
            <button onClick={handleAssign} disabled={saving || !assignForm.resident_id} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Tetapkan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
