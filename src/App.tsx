import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import Signup from './Signup'
import Onboarding from './Onboarding'
import Layout from './Layout'
import DashboardHome from './DashboardHome'
import Dashboard from './Dashboard'
import Admin from './Admin'
import Configuration from './Configuration'
import { Loader2, Mail } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'onboarding' | 'dashboard' | 'pilotage' | 'configuration' | 'booster' | 'admin'>('login')
  const [isAdmin, setIsAdmin] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [waitingForProfile, setWaitingForProfile] = useState(false)

  useEffect(() => {
    // Récupérer la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkIfAdmin(session.user.id)
        checkOnboardingStatus(session.user.id)
      }
      setLoading(false)
    })

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkIfAdmin(session.user.id)
        checkOnboardingStatus(session.user.id)
      } else {
        setCurrentPage('login')
        setIsAdmin(false)
        setNeedsOnboarding(false)
        setWaitingForProfile(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkIfAdmin = async (userId: string) => {
    try {
      console.log('🔍 App.tsx - Vérif admin pour:', userId)
      
      const { data: adminData, error } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userId)
      
      console.log('🔍 App.tsx - Résultat admin:', adminData)
      
      if (error) {
        console.error('Erreur vérif admin:', error)
        setIsAdmin(false)
        return
      }
      
      if (adminData && adminData.length > 0) {
        setIsAdmin(true)
        console.log('✅ App.tsx - Admin détecté')
      } else {
        setIsAdmin(false)
        console.log('❌ App.tsx - Pas admin')
      }
    } catch (err) {
      console.error('Exception checkIfAdmin:', err)
      setIsAdmin(false)
    }
  }

  const checkOnboardingStatus = async (userId: string) => {
    try {
      console.log('🔍 Vérification du profil coach...')
      
      // Récupérer coach_profiles.id depuis user_id
      const { data: profileData, error: profileError } = await supabase
        .from('coach_profiles')
        .select('id, name, email')
        .eq('user_id', userId)
        .maybeSingle()
      
      // Si pas de profil ET pas d'erreur, c'est que le profil est en cours de création
      if (!profileData && !profileError) {
        console.log('⏳ Profil en cours de création (trigger Auth)...')
        setWaitingForProfile(true)
        
        // Réessayer après 2 secondes
        setTimeout(() => {
          console.log('🔄 Nouvelle tentative de récupération du profil...')
          checkOnboardingStatus(userId)
        }, 2000)
        
        return
      }

      if (profileError) {
        console.error('❌ Erreur récupération profil:', profileError)
        setWaitingForProfile(false)
        setNeedsOnboarding(true)
        setCurrentPage('onboarding')
        return
      }

      if (!profileData) {
        console.warn('❌ Pas de coach_profile pour cet user')
        setWaitingForProfile(false)
        setNeedsOnboarding(true)
        setCurrentPage('onboarding')
        return
      }

      console.log('✅ Profil trouvé:', profileData)
      setWaitingForProfile(false)

      const coachId = profileData.id
      setUserName(profileData.name || 'Coach')
      setUserEmail(profileData.email || '')

      // Vérifier si le coach a complété l'onboarding via config_coach
      const { data: configData } = await supabase
        .from('config_coach')
        .select('statut')
        .eq('coach_id', coachId)
        .maybeSingle()
      
      // Si pas de config ou statut != "Configuration terminée"
      if (!configData || configData.statut !== 'Configuration terminée') {
        console.log('📝 Onboarding requis')
        setNeedsOnboarding(true)
        setCurrentPage('onboarding')
      } else {
        console.log('✅ Onboarding terminé')
        setNeedsOnboarding(false)
        setCurrentPage('dashboard')
      }
    } catch (err) {
      console.error('❌ Exception checkOnboardingStatus:', err)
      setWaitingForProfile(false)
      setNeedsOnboarding(false)
      setCurrentPage('dashboard')
    }
  }

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false)
    setCurrentPage('dashboard')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentPage('login')
    setIsAdmin(false)
    setNeedsOnboarding(false)
    setWaitingForProfile(false)
  }

  // Écran de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    )
  }

  // Écran d'attente de création du profil (après confirmation email)
  if (session && waitingForProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Initialisation de votre profil...
            </h2>
            
            <p className="text-white/60 mb-6">
              Nous créons votre espace coach. Cela ne prendra que quelques secondes.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                💡 Votre profil est en cours de configuration automatique
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-6 text-white/60 hover:text-white text-sm transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Si pas de session, afficher login ou signup
  if (!session) {
    if (currentPage === 'signup') {
      return <Signup onBackToLogin={() => setCurrentPage('login')} />
    }
    return <Login onSignupClick={() => setCurrentPage('signup')} />
  }

  // Si le coach doit faire l'onboarding
  if (needsOnboarding && currentPage === 'onboarding') {
    return <Onboarding userId={session.user.id} onComplete={handleOnboardingComplete} />
  }

  console.log('🔍 App.tsx - Render avec isAdmin:', isAdmin)

  // Dashboard principal
  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onSignOut={handleSignOut}
      userEmail={userEmail}
      userName={userName}
      isAdmin={isAdmin}
    >
      {currentPage === 'dashboard' && <DashboardHome />}
      {currentPage === 'pilotage' && <Dashboard />}
      {currentPage === 'configuration' && <Configuration />}
      {currentPage === 'booster' && (
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-4">Booster Instagram</h1>
          <p className="text-white/60">Page en construction...</p>
        </div>
      )}
      {currentPage === 'admin' && isAdmin && <Admin />}
    </Layout>
  )
}