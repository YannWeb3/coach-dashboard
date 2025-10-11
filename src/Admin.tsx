import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Shield, 
  Users, 
  TrendingUp,
  DollarSign,
  X,
  Check,
  AlertCircle
} from 'lucide-react'

interface Coach {
  id: string
  name: string
  email: string
  specialty: string
  created_at: string
  total_leads?: number
  leads_won?: number
  total_revenue?: number
}

export default function Admin() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    password: ''
  })
  
  const [globalStats, setGlobalStats] = useState({
    totalCoaches: 0,
    totalLeads: 0,
    totalRevenue: 0,
    avgLeadsPerCoach: 0
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Erreur auth:', userError)
        window.location.href = '/dashboard'
        return
      }

      console.log('User ID:', user.id)

      // ✅ FIX : Vérification manuelle sans .maybeSingle()
      const { data: adminData, error } = await supabase
        .from('admin')
        .select('id')
        .eq('id', user.id)

      console.log('Admin data:', adminData)
      console.log('Admin error:', error)

      if (error) {
        console.error('Erreur requête admin:', error)
        window.location.href = '/dashboard'
        return
      }

      // Vérifier si le tableau est vide ou non
      if (!adminData || adminData.length === 0) {
        console.warn('User pas dans la table admin')
        window.location.href = '/dashboard'
        return
      }
      
      console.log('✅ Admin autorisé')
      setIsAuthorized(true)
    } catch (error) {
      console.error('Exception checkAdminAccess:', error)
      window.location.href = '/dashboard'
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      console.log('🚀 isAuthorized = true, on charge les coachs...')
      fetchCoaches()
      fetchGlobalStats()
    }
  }, [isAuthorized])

  useEffect(() => {
    if (searchTerm) {
      const filtered = coaches.filter(coach => 
        coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCoaches(filtered)
    } else {
      setFilteredCoaches(coaches)
    }
  }, [searchTerm, coaches])

  const fetchCoaches = async () => {
    console.log('📥 Début fetch coachs...')
    setLoading(true)
    
    try {
      // Test simple sans KPIs d'abord
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')

      console.log('👥 Data:', data)
      console.log('❌ Error:', error)

      if (error) {
        console.error('Erreur Supabase:', error)
        showMessage('error', `Erreur: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Aucun coach trouvé')
        setCoaches([])
        setFilteredCoaches([])
        setLoading(false)
        return
      }

      console.log(`✅ ${data.length} coach(s) trouvé(s)`)
      
      // Ajouter les KPIs après
      const { data: kpisData } = await supabase
        .from('coach_dashboard_kpis')
        .select('coach_id, total_leads, leads_won, total_revenue')

      const enriched = data.map(coach => ({
        ...coach,
        total_leads: kpisData?.find(k => k.coach_id === coach.id)?.total_leads || 0,
        leads_won: kpisData?.find(k => k.coach_id === coach.id)?.leads_won || 0,
        total_revenue: kpisData?.find(k => k.coach_id === coach.id)?.total_revenue || 0
      }))

      setCoaches(enriched)
      setFilteredCoaches(enriched)
      console.log('✅ Coachs chargés:', enriched)

    } catch (err: any) {
      console.error('💥 Exception:', err)
      showMessage('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalStats = async () => {
    try {
      const { data: kpisData } = await supabase
        .from('coach_dashboard_kpis')
        .select('total_leads, total_revenue')

      if (kpisData) {
        const totalLeads = kpisData.reduce((sum, k) => sum + (k.total_leads || 0), 0)
        const totalRevenue = kpisData.reduce((sum, k) => sum + (k.total_revenue || 0), 0)
        const totalCoaches = kpisData.length

        setGlobalStats({
          totalCoaches,
          totalLeads,
          totalRevenue,
          avgLeadsPerCoach: totalCoaches > 0 ? totalLeads / totalCoaches : 0
        })
      }
    } catch (error) {
      console.error('Erreur stats globales:', error)
    }
  }

  const handleCreateCoach = async () => {
    try {
      setLoading(true)
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            specialty: formData.specialty
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 1. Créer le profil coach
        const { error: coachError } = await supabase
          .from('coach_profiles')
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            name: formData.name,
            email: formData.email,
            specialty: formData.specialty,
            created_at: new Date().toISOString()
          })

        if (coachError) throw coachError

        // 2. Créer la config coach
        const { error: configError } = await supabase
          .from('config_coach')
          .insert({
            id: authData.user.id,
            nom: formData.name,
            email: formData.email,
            statut: 'Prérequis manquants',
            offre_existante: false,
            tests_effectues: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (configError) {
          console.error('Erreur config (non bloquant):', configError)
        }

        showMessage('success', `Coach ${formData.name} créé avec succès ! Un email de confirmation a été envoyé.`)
        setShowCreateModal(false)
        resetForm()
        fetchCoaches()
        fetchGlobalStats()
      }
    } catch (error: any) {
      console.error('Erreur création coach:', error)
      showMessage('error', error.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCoach = async () => {
    if (!selectedCoach) return
    
    try {
      setLoading(true)

      const { error } = await supabase
        .from('coach_profiles')
        .update({
          name: formData.name,
          specialty: formData.specialty
        })
        .eq('id', selectedCoach.id)

      if (error) throw error

      showMessage('success', 'Coach modifié avec succès !')
      setShowEditModal(false)
      resetForm()
      fetchCoaches()
    } catch (error: any) {
      console.error('Erreur modification coach:', error)
      showMessage('error', error.message || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCoach = async () => {
    if (!selectedCoach) return
    
    try {
      setLoading(true)
      console.log('🗑️ Suppression coach:', selectedCoach.id)

      // 1. Supprimer les leads associés
      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .eq('coach_id', selectedCoach.id)

      if (leadsError) {
        console.error('Erreur suppression leads:', leadsError)
      } else {
        console.log('✅ Leads supprimés')
      }

      // 2. Supprimer les messages associés
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('coach_id', selectedCoach.id)

      if (messagesError) {
        console.error('Erreur suppression messages:', messagesError)
      } else {
        console.log('✅ Messages supprimés')
      }

      // 3. Supprimer la config_coach
      const { error: configError } = await supabase
        .from('config_coach')
        .delete()
        .eq('id', selectedCoach.id)

      if (configError) {
        console.error('Erreur suppression config:', configError)
      } else {
        console.log('✅ Config supprimée')
      }

      // 4. Supprimer le coach_profile
      const { error: coachError } = await supabase
        .from('coach_profiles')
        .delete()
        .eq('id', selectedCoach.id)

      if (coachError) {
        console.error('Erreur suppression coach:', coachError)
        throw coachError
      }

      console.log('✅ Coach supprimé')

      // 5. Supprimer le user auth (nécessite Service Role Key)
      // Note: Ceci ne fonctionnera pas avec l'anon key
      // Il faudrait une Edge Function pour ça
      
      showMessage('success', 'Coach supprimé avec succès !')
      setShowDeleteModal(false)
      setSelectedCoach(null)
      fetchCoaches()
      fetchGlobalStats()
    } catch (error: any) {
      console.error('💥 Erreur suppression coach:', error)
      showMessage('error', error.message || 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (coach: Coach) => {
    setSelectedCoach(coach)
    setFormData({
      name: coach.name,
      email: coach.email,
      specialty: coach.specialty,
      password: ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (coach: Coach) => {
    setSelectedCoach(coach)
    setShowDeleteModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      specialty: '',
      password: ''
    })
    setSelectedCoach(null)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Vérification des accès...</div>
      </div>
    )
  }

  if (loading && coaches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Chargement du panel admin...</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Toast Message */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 ${
          message.type === 'success' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'
        } border backdrop-blur-xl rounded-xl px-6 py-4 flex items-center gap-3 animate-in slide-in-from-right`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <p className={message.type === 'success' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            Panel Administrateur
          </h1>
          <p className="text-white/60">Gérez les coachs et leurs accès en toute sécurité</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Créer un coach
        </button>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Coachs"
            value={globalStats.totalCoaches}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Leads"
            value={globalStats.totalLeads}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Revenus Totaux"
            value={`${globalStats.totalRevenue.toFixed(0)}€`}
            icon={<DollarSign className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Moy. Leads/Coach"
            value={globalStats.avgLeadsPerCoach.toFixed(1)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher un coach (nom, email, spécialité)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Coach</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Spécialité</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Leads</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Gagnés</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Revenus</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredCoaches.map((coach) => (
                  <tr key={coach.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {coach.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{coach.name}</p>
                          <p className="text-white/40 text-xs">
                            Créé le {new Date(coach.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/80">{coach.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                        {coach.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-white font-semibold">
                      {coach.total_leads}
                    </td>
                    <td className="px-6 py-4 text-center text-green-400 font-semibold">
                      {coach.leads_won}
                    </td>
                    <td className="px-6 py-4 text-center text-purple-400 font-semibold">
                      {coach.total_revenue?.toFixed(0)}€
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(coach)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(coach)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCoaches.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                {searchTerm ? 'Aucun coach trouvé' : 'Aucun coach enregistré'}
              </p>
            </div>
          )}
        </div>

        {showCreateModal && (
          <Modal
            title="Créer un nouveau coach"
            onClose={() => {
              setShowCreateModal(false)
              resetForm()
            }}
          >
            <CoachForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateCoach}
              onCancel={() => {
                setShowCreateModal(false)
                resetForm()
              }}
              submitLabel="Créer le coach"
              showPasswordField
              loading={loading}
            />
          </Modal>
        )}

        {showEditModal && selectedCoach && (
          <Modal
            title={`Modifier ${selectedCoach.name}`}
            onClose={() => {
              setShowEditModal(false)
              resetForm()
            }}
          >
            <CoachForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateCoach}
              onCancel={() => {
                setShowEditModal(false)
                resetForm()
              }}
              submitLabel="Enregistrer"
              showPasswordField={false}
              loading={loading}
            />
          </Modal>
        )}

        {showDeleteModal && selectedCoach && (
          <Modal
            title="Confirmer la suppression"
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedCoach(null)
            }}
          >
            <div className="space-y-4">
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  Cette action est irréversible. Tous les leads associés à ce coach seront également supprimés.
                </p>
              </div>
              
              <p className="text-white">
                Êtes-vous sûr de vouloir supprimer le coach <strong className="text-blue-400">{selectedCoach.name}</strong> ?
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedCoach(null)
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteCoach}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
      )
}

function StatCard({ title, value, icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/20',
    green: 'from-green-500/20 to-green-600/20',
    purple: 'from-purple-500/20 to-purple-600/20',
    yellow: 'from-yellow-500/20 to-yellow-600/20'
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.blue} backdrop-blur-xl rounded-xl p-6 border border-white/20`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-white/60">{icon}</div>
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-white/20 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

function CoachForm({ formData, setFormData, onSubmit, onCancel, submitLabel, showPasswordField, loading }: any) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Nom complet *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Email {showPasswordField && '*'}
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required={showPasswordField}
          disabled={!showPasswordField}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
      </div>

      {showPasswordField && (
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Mot de passe *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-white/40 text-xs mt-1">Minimum 6 caractères</p>
        </div>
      )}

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Spécialité *
        </label>
        <select
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="" className="bg-slate-800">Sélectionner...</option>
          <option value="fitness" className="bg-slate-800">Fitness</option>
          <option value="musculation" className="bg-slate-800">Musculation</option>
          <option value="yoga" className="bg-slate-800">Yoga</option>
          <option value="nutrition" className="bg-slate-800">Nutrition</option>
          <option value="pilates" className="bg-slate-800">Pilates</option>
          <option value="crossfit" className="bg-slate-800">CrossFit</option>
          <option value="coaching" className="bg-slate-800">Coaching général</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Création...' : submitLabel}
        </button>
      </div>
    </form>
  )
}