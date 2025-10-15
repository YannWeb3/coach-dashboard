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

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'onboarding' | 'dashboard' | 'pilotage' | 'configuration' | 'booster' | 'admin'>('login')
  const [isAdmin, setIsAdmin] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

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
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkIfAdmin = async (userId: string) => {
    try {
      console.log('🔍 App.tsx - Vérif admin pour:', userId);
      
      // Vérifier directement dans la table admin
      const { data: adminData, error } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userId);
      
      console.log('🔍 App.tsx - Résultat admin:', adminData);
      
      if (error) {
        console.error('Erreur vérif admin:', error);
        setIsAdmin(false);
        return;
      }
      
      if (adminData && adminData.length > 0) {
        setIsAdmin(true);
        console.log('✅ App.tsx - Admin détecté');
      } else {
        setIsAdmin(false);
        console.log('❌ App.tsx - Pas admin');
      }
    } catch (err) {
      console.error('Exception checkIfAdmin:', err);
      setIsAdmin(false);
    }
  }

  const checkOnboardingStatus = async (userId: string) => {
    try {
      // Récupérer coach_profiles.id depuis user_id
      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('id, name, email')
        .eq('user_id', userId)
        .single()
      
      if (!profileData) {
        console.warn('Pas de coach_profile pour cet user');
        setNeedsOnboarding(true);
        setCurrentPage('onboarding');
        return;
      }

      const coachId = profileData.id;
      setUserName(profileData.name || 'Coach');
      setUserEmail(profileData.email || '');

      // Vérifier si le coach a complété l'onboarding via config_coach
      const { data: configData } = await supabase
        .from('config_coach')
        .select('statut')
        .eq('coach_id', coachId)
        .single()
      
      // Si pas de config ou statut != "Configuration terminée"
      if (!configData || configData.statut !== 'Configuration terminée') {
        setNeedsOnboarding(true)
        setCurrentPage('onboarding')
      } else {
        setNeedsOnboarding(false)
        setCurrentPage('dashboard')
      }
    } catch (err) {
      console.error('Erreur checkOnboardingStatus:', err);
      setNeedsOnboarding(false);
      setCurrentPage('dashboard');
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

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

  console.log('🔍 App.tsx - Render avec isAdmin:', isAdmin);

  return (
    <div>
      {!session ? (
        currentPage === 'signup' ? (
          <Signup onBackToLogin={() => setCurrentPage('login')} />
        ) : (
          <Login onSignupClick={() => setCurrentPage('signup')} />
        )
      ) : needsOnboarding && currentPage === 'onboarding' ? (
        <Onboarding userId={session.user.id} onComplete={handleOnboardingComplete} />
      ) : (
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
      )}
    </div>
  )
}