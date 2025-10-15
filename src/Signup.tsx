import { useState } from 'react'
import { supabase } from './supabase'
import { UserPlus, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

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

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      console.log('🚀 Création du compte Auth...')
      
      // Créer l'utilisateur dans Supabase Auth avec métadonnées
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            specialty: specialty
          },
          // Redirection après confirmation email
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        console.error('❌ Erreur Auth:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte')
      }

      console.log('✅ Compte créé, en attente de confirmation email')
      
      // ✅ On NE crée PAS le profil coach ici
      // Il sera créé automatiquement après confirmation via un trigger Auth
      
      setSuccess(true)

    } catch (err: any) {
      console.error('❌ Erreur inscription:', err)
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            {/* Header avec icône */}
            <div className="bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white text-center mb-3">
              Vérifiez votre email 📧
            </h2>
            
            <p className="text-white/70 text-center mb-8">
              Un email de confirmation a été envoyé à :
            </p>

            {/* Email Box */}
            <div className="bg-white/5 border border-white/20 rounded-xl p-4 mb-8">
              <p className="text-white font-semibold text-center text-lg">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-full p-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white/60 text-sm">
                  Ouvrez votre boîte email et cliquez sur le lien de confirmation
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-full p-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white/60 text-sm">
                  Une fois confirmé, vous pourrez vous connecter et accéder à votre dashboard
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-full p-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white/60 text-sm">
                  Votre profil coach sera créé automatiquement après la confirmation
                </p>
              </div>
            </div>

            {/* Info supplémentaire */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm text-center">
                💡 <strong>Pensez à vérifier vos spams</strong> si vous ne recevez pas l'email dans quelques minutes
              </p>
            </div>

            {/* Bouton retour */}
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