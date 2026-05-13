'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'

type UserRole =
  | 'CLIENT'
  | 'AGENT'
  | 'AGENCY_STAFF'
  | 'SUPER_AGENT'
  | 'PARTNER_ADMIN'
  | 'ADMINISTRATOR'
  | 'ACCOUNTANT'
  | 'SUPERVISOR'
  | 'LOGISTICS'

type UserRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  isActive: boolean
  referralCount: number
  referralCredits: number
  loyaltyPoints: number
  loyaltyTier: string
  gender: string | null
  birthDate: string | null
  passportOrIdNumber: string | null
  passportPhotoUrl: string | null
  city: string | null
  partnerCompanyId?: string | null
  partnerCompany?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  _count?: { bookings: number; freightOrders: number }
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'AGENCY_STAFF', label: 'Staff agence' },
  { value: 'SUPER_AGENT', label: 'Super Agent' },
  { value: 'PARTNER_ADMIN', label: 'Admin partenaire' },
  { value: 'LOGISTICS', label: 'Logistique' },
  { value: 'ACCOUNTANT', label: 'Comptable' },
  { value: 'SUPERVISOR', label: 'Superviseur' },
  { value: 'ADMINISTRATOR', label: 'Administrateur' },
]

function roleLabel(role: string): string {
  const r = role.toUpperCase()
  return ROLES.find((x) => x.value === (r as UserRole))?.label || r
}

function makeTempPassword(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `AR-${rand}-1234`
}

export function UsersManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [role, setRole] = useState<string>('ALL')
  const [active, setActive] = useState<string>('ALL') // ALL | true | false

  const [users, setUsers] = useState<UserRow[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const roleParam = params.get('role')
      if (roleParam) setRole(roleParam)
    }
  }, [])

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'CLIENT' as UserRole,
    password: '',
    gender: 'HOMME',
    birthDate: '',
    passportOrIdNumber: '',
    passportPhotoUrl: '',
    city: '',
    partnerCompanyId: '',
  })

  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'CLIENT' as UserRole,
    isActive: true,
    gender: '' as string | null,
    birthDate: '' as string | null,
    passportOrIdNumber: '' as string | null,
    passportPhotoUrl: '' as string | null,
    city: '' as string | null,
    partnerCompanyId: '' as string | null,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/companies', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && Array.isArray(data.companies)) {
          setCompanies(data.companies)
        }
      } catch {
        // On garde une liste vide si indisponible.
      }
    })()
  }, [])

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (role !== 'ALL') sp.set('role', role)
    if (active !== 'ALL') sp.set('active', active)
    sp.set('limit', '200')
    return sp.toString()
  }, [q, role, active])

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users?${queryString}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Erreur API (${res.status})`)
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (e: any) {
      setError(`Erreur chargement: ${e?.message || 'Erreur technique'}`)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [queryString])

  async function createUser() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de créer le compte')
      await fetchUsers()
      setCreateOpen(false)
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'CLIENT',
        password: '',
        gender: 'HOMME',
        birthDate: '',
        passportOrIdNumber: '',
        passportPhotoUrl: '',
        city: '',
        partnerCompanyId: '',
      })
    } catch (e: any) {
      setError(`Erreur création: ${e?.message || 'Erreur technique'}`)
    } finally {
      setLoading(false)
    }
  }

  async function saveUser() {
    if (!editUser) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Impossible de sauvegarder (Status: ${res.status})`)
      setEditOpen(false)
      setEditUser(null)
      await fetchUsers()
    } catch (e: any) {
      setError(`Erreur sauvegarde: ${e?.message || 'Erreur technique'}`)
    } finally {
      setLoading(false)
    }
  }

  async function deactivateUser(userId: string) {
    if (!confirm('Désactiver cet utilisateur ?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Impossible de désactiver (Status: ${res.status})`)
      await fetchUsers()
    } catch (e: any) {
      setError(`Erreur désactivation: ${e?.message || 'Erreur technique'}`)
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(userId: string) {
    const temp = makeTempPassword()
    if (!confirm(`Réinitialiser le mot de passe ?\nNouveau mot de passe: ${temp}\n\n(Confirmez pour appliquer)`)) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: temp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de réinitialiser le mot de passe')
      await navigator.clipboard.writeText(temp).catch(() => { })
      alert('Mot de passe réinitialisé. (Copié dans le presse-papier si autorisé)')
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(file: File, formType: 'create' | 'edit') {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload échoué')

      if (formType === 'create') {
        setCreateForm({ ...createForm, passportPhotoUrl: data.url })
      } else {
        setEditForm({ ...editForm, passportPhotoUrl: data.url })
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Utilisateurs', {
        views: [{ state: 'frozen', ySplit: 1 }],
      })

      worksheet.columns = [
        { header: 'Nom', key: 'lastName', width: 18 },
        { header: 'Prenom', key: 'firstName', width: 18 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Telephone', key: 'phone', width: 18 },
        { header: 'Role', key: 'role', width: 20 },
        { header: 'Statut', key: 'status', width: 12 },
        { header: 'Ville', key: 'city', width: 18 },
        { header: 'Date creation', key: 'createdAt', width: 18 },
        { header: 'Billets', key: 'bookings', width: 10 },
        { header: 'Colis', key: 'freight', width: 10 },
      ]

      users.forEach((u) => {
        worksheet.addRow({
          lastName: u.lastName,
          firstName: u.firstName,
          email: u.email,
          phone: u.phone || '-',
          role: roleLabel(u.role),
          status: u.isActive ? 'Actif' : 'Inactif',
          city: u.city || '-',
          createdAt: format(new Date(u.createdAt), 'dd/MM/yyyy'),
          bookings: u._count?.bookings || 0,
          freight: u._count?.freightOrders || 0,
        })
      })

      const headerRow = worksheet.getRow(1)
      headerRow.height = 24
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E40AF' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF1E3A8A' } },
          left: { style: 'thin', color: { argb: 'FF1E3A8A' } },
          bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
          right: { style: 'thin', color: { argb: 'FF1E3A8A' } },
        }
      })

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length },
      }

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i)
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          }
        })

        if (i % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            }
          })
        }

        const statusCell = row.getCell(6)
        if (statusCell.value === 'Actif') {
          statusCell.font = { bold: true, color: { argb: 'FF166534' } }
        } else {
          statusCell.font = { bold: true, color: { argb: 'FF9A3412' } }
        }

        row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' }
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `utilisateurs_admin_${format(new Date(), 'yyyyMMdd')}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (e: any) {
      setError(`Erreur export Excel: ${e?.message || 'Erreur technique'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="ar-card ar-card-body">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="ar-label">Recherche</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, email, téléphone…"
              className="ar-input"
            />
          </div>
          <div className="w-full lg:w-64">
            <label className="ar-label">Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="ar-input bg-white">
              <option value="ALL">Tous</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full lg:w-56">
            <label className="ar-label">Statut</label>
            <select value={active} onChange={(e) => setActive(e.target.value)} className="ar-input bg-white">
              <option value="ALL">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="ar-btn ar-btn-md ar-btn-primary disabled:opacity-50"
            disabled={loading}
          >
            + Nouvel utilisateur
          </button>
          <button
            onClick={handleExportExcel}
            className="ar-btn ar-btn-md border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Excel
          </button>
        </div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <div className="mt-6 ar-table-wrap">
          <table className="ar-table min-w-full">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Activité</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-600">
                    Chargement…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-600">
                    Aucun utilisateur.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium text-slate-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{roleLabel(u.role)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="text-slate-600">
                      {u._count ? `${u._count.bookings} billets • ${u._count.freightOrders} colis` : '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditUser(u)
                            setEditForm({
                              firstName: u.firstName,
                              lastName: u.lastName,
                              email: u.email,
                              phone: u.phone || '',
                              role: (u.role.toUpperCase() as UserRole) || 'CLIENT',
                              isActive: u.isActive,
                              gender: u.gender,
                              birthDate: u.birthDate ? format(new Date(u.birthDate), 'yyyy-MM-dd') : '',
                              passportOrIdNumber: u.passportOrIdNumber,
                              passportPhotoUrl: u.passportPhotoUrl,
                              city: u.city,
                              partnerCompanyId: u.partnerCompanyId || '',
                            })
                            setEditOpen(true)
                          }}
                          className="ar-btn ar-btn-sm ar-btn-secondary"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => resetPassword(u.id)}
                          className="ar-btn ar-btn-sm border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                        >
                          Reset MDP
                        </button>
                        <button
                          onClick={() => deactivateUser(u.id)}
                          className="ar-btn ar-btn-sm ar-btn-danger"
                        >
                          Désactiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-gray-900">Créer un utilisateur</div>
                <div className="text-sm text-gray-600">Un mot de passe est requis (min 6).</div>
              </div>
              <button onClick={() => setCreateOpen(false)} className="text-gray-600 hover:text-gray-900 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="ar-label">Prénom</label>
                <input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Nom</label>
                <input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Email</label>
                <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Téléphone</label>
                <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Rôle</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })} className="ar-input bg-white">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ar-label">Compagnie partenaire (optionnel)</label>
                <select
                  value={createForm.partnerCompanyId}
                  onChange={(e) => setCreateForm({ ...createForm, partnerCompanyId: e.target.value })}
                  className="ar-input bg-white"
                >
                  <option value="">Aucune</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ar-label">Mot de passe</label>
                <div className="flex gap-2">
                  <input
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="ar-input"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, password: makeTempPassword() })}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
                  >
                    Générer
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 grid md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="ar-label">Sexe</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className="ar-input bg-white"
                  >
                    <option value="HOMME">Homme</option>
                    <option value="FEMME">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="ar-label">Date de naissance</label>
                  <input
                    type="date"
                    value={createForm.birthDate}
                    onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })}
                    className="ar-input"
                  />
                </div>
                <div>
                  <label className="ar-label">N° Passeport/ID</label>
                  <input
                    value={createForm.passportOrIdNumber}
                    onChange={(e) => setCreateForm({ ...createForm, passportOrIdNumber: e.target.value })}
                    className="ar-input"
                  />
                </div>
                <div>
                  <label className="ar-label">Ville</label>
                  <input
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="ar-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="ar-label">Photo Passeport/ID</label>
                  <div className="flex items-center gap-4">
                    {createForm.passportPhotoUrl && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                        <img src={createForm.passportPhotoUrl} alt="Passport" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'create')}
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="ar-btn ar-btn-md ar-btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={createUser}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && editUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-gray-900">Modifier</div>
                <div className="text-sm text-gray-600">
                  {editUser.firstName} {editUser.lastName} • {editUser.email}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditOpen(false)
                  setEditUser(null)
                }}
                className="text-gray-600 hover:text-gray-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="ar-label">Prénom</label>
                <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Nom</label>
                <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Email</label>
                <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Téléphone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="ar-input" />
              </div>
              <div>
                <label className="ar-label">Rôle</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })} className="ar-input bg-white">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ar-label">Compagnie partenaire (optionnel)</label>
                <select
                  value={editForm.partnerCompanyId || ''}
                  onChange={(e) => setEditForm({ ...editForm, partnerCompanyId: e.target.value })}
                  className="ar-input bg-white"
                >
                  <option value="">Aucune</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 grid md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="ar-label">Sexe</label>
                  <select
                    value={editForm.gender || 'HOMME'}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="ar-input bg-white"
                  >
                    <option value="HOMME">Homme</option>
                    <option value="FEMME">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="ar-label">Date de naissance</label>
                  <input
                    type="date"
                    value={editForm.birthDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="ar-input"
                  />
                </div>
                <div>
                  <label className="ar-label">N° Passeport/ID</label>
                  <input
                    value={editForm.passportOrIdNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, passportOrIdNumber: e.target.value })}
                    className="ar-input"
                  />
                </div>
                <div>
                  <label className="ar-label">Ville</label>
                  <input
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="ar-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="ar-label">Photo Passeport/ID</label>
                  <div className="flex items-center gap-4">
                    {editForm.passportPhotoUrl && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                        <img src={editForm.passportPhotoUrl} alt="Passport" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'edit')}
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                  Compte actif
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditOpen(false)
                  setEditUser(null)
                }}
                className="ar-btn ar-btn-md ar-btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={saveUser}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

