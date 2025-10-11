import { useState } from 'react'
import { supabase } from './supabase'
import { LogIn } from 'lucide-react'
import React from 'react' // Import de React souvent nécessaire implicitement

// Définir l'interface des props pour une meilleure clarté
interface LoginProps {
  onSignupClick: () => void
}

// Utiliser l'interface pour typer les props
export default function Login({ onSignupClick }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    // ... Reste du rendu inchangé
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Coach Setter Dashboard
          </h1>
          <p className="text-white/60 text-center mb-8">
            Connectez-vous pour accéder à vos KPIs
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@exemple.fr"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            {/* Ajout d'un bouton pour onSignupClick (s'il était prévu dans le design) */}
            <button
              type="button"
              onClick={onSignupClick}
              className="w-full text-white/70 text-sm mt-4 hover:text-white transition-colors"
            >
              Pas encore de compte ? S'inscrire
            </button>
          </form>

          <p className="text-white/40 text-xs text-center mt-6">
            Contactez l'administrateur si vous avez oublié vos identifiants
          </p>
        </div>
      </div>
    </div>
  )
}