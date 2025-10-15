import { useState } from 'react'
import { supabase } from './supabase'
import { UserPlus, ArrowLeft } from 'lucide-react'

export default function Signup({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            specialty: specialty
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Créer le coach dans coach_profiles
        // ✅ Le trigger va automatiquement créer config_coach
        const { error: coachError } = await supabase
          .from('coach_profiles')
          .insert({
            id: authData.user.id,
            name: name,
            email: email,
            specialty: specialty,
            user_id: authData.user.id,
            created_at: new Date().toISOString()
          })

        if (coachError) {
          console.error('❌ Erreur création coach:', coachError)
          throw coachError
        }

        console.log('✅ Coach + Config créés automatiquement via trigger')
        setSuccess(true)
      }
    } catch (err: any) {
      console.error('Erreur inscription:', err)
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-8 h-8 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Compte créé avec succès ! 🎉
            </h2>
            
            <p className="text-white/60 mb-6">
              Vérifiez votre email <strong className="text-white">{email}</strong> pour confirmer votre compte.
            </p>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm">
                📧 Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte.
              </p>
            </div>

            <button
              onClick={onBackToLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>

          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-full">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Créer un compte
          </h1>
          <p className="text-white/60 text-center mb-8">
            Rejoignez Coach Setter Dashboard
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie Dupont"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@coach.fr"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Mot de passe *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-white/40 text-xs mt-1">
                Minimum 6 caractères
              </p>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Spécialité *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
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

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-white/40 text-xs text-center mt-6">
            En créant un compte, vous acceptez nos conditions d'utilisation.
          </p>
        </div>
      </div>
    </div>
  )
}