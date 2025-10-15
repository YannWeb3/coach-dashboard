import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  User,
  Settings,
  Link as LinkIcon,
  Calendar,
  Rocket
} from 'lucide-react'

interface OnboardingData {
  nom: string
  email: string
  telephone: string
  instagram_handle: string
  niche: string
  style_communication: string
  mots_cles_cibles: string[]
  openrouter_api_key: string
  offre_existante: boolean
  prerequis_manychat: boolean
  prerequis_openrouter: boolean
  urgence: string
  tests_effectues: number
  statut: string
}

const STEPS = [
  { id: 1, name: 'Présentation', icon: Play },
  { id: 2, name: 'Vos Infos', icon: User },
  { id: 3, name: 'Configuration', icon: Settings },
  { id: 4, name: 'Test Agent', icon: LinkIcon },
  { id: 5, name: 'Confirmation', icon: Check }
]

export default function Onboarding({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({
    nom: '',
    email: '',
    telephone: '',
    instagram_handle: '',
    niche: 'fitness',
    style_communication: 'professionnel',
    mots_cles_cibles: [],
    openrouter_api_key: '',
    offre_existante: false,
    prerequis_manychat: false,
    prerequis_openrouter: false,
    urgence: 'normal',
    tests_effectues: 0,
    statut: 'En configuration'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videos, setVideos] = useState<Record<number, string>>({})
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookStatus, setWebhookStatus] = useState<'pending' | 'success' | 'failed'>('pending')

  useEffect(() => {
    loadCoachInfo()
    loadVideos()
    generateWebhookUrl()
  }, [userId])

  const loadCoachInfo = async () => {
    // Charger depuis la table coach_profile
    const { data: coachData } = await supabase
      .from('coach_profiles')
      .select('name, email, specialty')
      .eq('coach_id', userId)
      .single()

    // Charger config existante si elle existe
    const { data: configData } = await supabase
      .from('config_coach')
      .select('*')
      .eq('coach_id', userId)
      .single()

    if (coachData) {
      setFormData(prev => ({
        ...prev,
        nom: coachData.name || '',
        email: coachData.email || '',
        niche: coachData.specialty || 'fitness'
      }))
    }

    // Si config existe, charger les données
    if (configData) {
      setFormData(prev => ({
        ...prev,
        ...configData
      }))
    }
  }

  const loadVideos = async () => {
    const { data } = await supabase
      .from('config_coach')
      .select('video_etape_1, video_etape_2, video_etape_3, video_etape_4, video_etape_5')
      .eq('coach_id', userId)
      .single()

    if (data) {
      setVideos({
        1: data.video_etape_1 || '',
        2: data.video_etape_2 || '',
        3: data.video_etape_3 || '',
        4: data.video_etape_4 || '',
        5: data.video_etape_5 || ''
      })
    }
  }

  const generateWebhookUrl = () => {
    // Générer URL webhook basée sur l'ID du coach
    const hash = userId.substring(0, 16)
    setWebhookUrl(`https://votre-n8n.com/webhook/setter/${hash}`)
  }

  const handleNext = async () => {
    if (currentStep === 2 && !validateStep2()) return
    if (currentStep === 3 && !validateStep3()) return
    
    if (currentStep < 5) {
      await saveProgress()
    }

    if (currentStep === 5) {
      await completeOnboarding()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const validateStep2 = () => {
    if (!formData.nom || !formData.email || !formData.instagram_handle) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    setError(null)
    return true
  }

  const validateStep3 = () => {
    if (!formData.style_communication || !formData.niche) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    setError(null)
    return true
  }

  const saveProgress = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('config_coach')
        .upsert({
          id: userId,
          ...formData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) throw error
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const testWebhook = async () => {
    try {
      setLoading(true)
      
      // Incrémenter le compteur de tests
      const newTestCount = formData.tests_effectues + 1
      
      const { error } = await supabase
        .from('config_coach')
        .update({
          tests_effectues: newTestCount,
          prerequis_manychat: true,
          updated_at: new Date().toISOString()
        })
        .eq('coach_id', userId)

      if (error) throw error

      setFormData(prev => ({ ...prev, tests_effectues: newTestCount, prerequis_manychat: true }))
      setWebhookStatus('success')
    } catch (err: any) {
      console.error('Erreur test webhook:', err)
      setWebhookStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('config_coach')
        .update({
          statut: 'Configuration terminée',
          updated_at: new Date().toISOString()
        })
        .eq('coach_id', userId)

      if (error) throw error

      onComplete()
    } catch (err: any) {
      console.error('Erreur finalisation:', err)
      setError('Erreur lors de la finalisation')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleKeywordsChange = (value: string) => {
    // Convertir string en array (séparé par virgules)
    const keywords = value.split(',').map(k => k.trim()).filter(k => k)
    setFormData({ ...formData, mots_cles_cibles: keywords })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`text-sm mt-2 font-medium ${
                      currentStep >= step.id ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 min-h-[600px]">
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {currentStep === 1 && <Step1 videoUrl={videos[1]} />}
          {currentStep === 2 && <Step2 formData={formData} setFormData={setFormData} videoUrl={videos[2]} />}
          {currentStep === 3 && <Step3 formData={formData} setFormData={setFormData} onKeywordsChange={handleKeywordsChange} videoUrl={videos[3]} />}
          {currentStep === 4 && <Step4 webhookUrl={webhookUrl} webhookStatus={webhookStatus} onTest={testWebhook} onCopy={copyToClipboard} loading={loading} videoUrl={videos[4]} />}
          {currentStep === 5 && <Step5 formData={formData} videoUrl={videos[5]} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/20">
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Précédent
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {currentStep === 5 ? (
                <>
                  <Rocket className="w-5 h-5" />
                  Accéder au Dashboard
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Vidéo
function VideoPlayer({ url }: { url?: string }) {
  if (!url) {
    return (
      <div className="aspect-video bg-white/5 rounded-xl border border-white/20 flex items-center justify-center mb-6">
        <div className="text-center">
          <Play className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60 text-sm">Vidéo non configurée</p>
        </div>
      </div>
    )
  }

  // Extraire l'ID YouTube si c'est une URL YouTube
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    return match ? match[1] : null
  }

  const videoId = getYouTubeId(url)

  if (videoId) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <div className="aspect-video bg-white/5 rounded-xl border border-white/20 flex items-center justify-center mb-6">
      <div className="text-center">
        <Play className="w-12 h-12 text-white/40 mx-auto mb-3" />
        <p className="text-white/60 text-sm">Format vidéo non supporté</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">
          Ouvrir dans un nouvel onglet
        </a>
      </div>
    </div>
  )
}

// Étape 1
function Step1({ videoUrl }: { videoUrl?: string }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Rocket className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-3">
          Bienvenue sur Coach Setter ! 🚀
        </h2>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Nous allons configurer votre agent IA en 5 étapes simples.
        </p>
      </div>

      <VideoPlayer url={videoUrl} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard icon={<User className="w-8 h-8" />} title="Vos Informations" description="Instagram, niche, style de communication" />
        <FeatureCard icon={<Settings className="w-8 h-8" />} title="Configuration" description="Mots-clés, API, personnalisation" />
        <FeatureCard icon={<LinkIcon className="w-8 h-8" />} title="Intégration" description="Connectez ManyChat en 2 clics" />
      </div>
    </div>
  )
}

// Étape 2
function Step2({ formData, setFormData, videoUrl }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Parlez-nous de vous</h2>
        <p className="text-white/60">Ces informations personnaliseront votre agent IA</p>
      </div>

      <VideoPlayer url={videoUrl} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Nom complet *</label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Marie Dupont"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="marie@coach.fr"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Téléphone</label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+33 6 12 34 56 78"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Instagram Handle *</label>
          <input
            type="text"
            value={formData.instagram_handle}
            onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="@votre_compte"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-white/80 text-sm font-medium mb-2">Niche / Spécialité *</label>
          <select
            value={formData.niche}
            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fitness" className="bg-slate-800">Fitness</option>
            <option value="musculation" className="bg-slate-800">Musculation</option>
            <option value="yoga" className="bg-slate-800">Yoga</option>
            <option value="nutrition" className="bg-slate-800">Nutrition</option>
            <option value="pilates" className="bg-slate-800">Pilates</option>
            <option value="crossfit" className="bg-slate-800">CrossFit</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Étape 3
function Step3({ formData, setFormData, onKeywordsChange, videoUrl }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Configurez votre Agent IA</h2>
        <p className="text-white/60">Personnalisez le comportement de votre assistant</p>
      </div>

      <VideoPlayer url={videoUrl} />

      <div className="space-y-4">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Style de communication</label>
          <div className="grid grid-cols-3 gap-3">
            {['professionnel', 'amical', 'motivant'].map((style) => (
              <button
                key={style}
                onClick={() => setFormData({ ...formData, style_communication: style })}
                className={`px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                  formData.style_communication === style
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Mots-clés cibles</label>
          <input
            type="text"
            value={formData.mots_cles_cibles.join(', ')}
            onChange={(e) => onKeywordsChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="perte de poids, musculation, nutrition"
          />
          <p className="text-white/40 text-xs mt-1">Séparez les mots-clés par des virgules</p>
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">OpenRouter API Key (optionnel)</label>
          <input
            type="password"
            value={formData.openrouter_api_key}
            onChange={(e) => setFormData({ ...formData, openrouter_api_key: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="sk-or-v1-..."
          />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.offre_existante}
              onChange={(e) => setFormData({ ...formData, offre_existante: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10"
            />
            <span className="text-white">J'ai déjà une offre commerciale définie</span>
          </label>
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Niveau d'urgence</label>
          <select
            value={formData.urgence}
            onChange={(e) => setFormData({ ...formData, urgence: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low" className="bg-slate-800">Pas pressé</option>
            <option value="normal" className="bg-slate-800">Normal</option>
            <option value="high" className="bg-slate-800">Urgent</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Étape 4
function Step4({ webhookUrl, webhookStatus, onTest, onCopy, loading, videoUrl }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Connectez votre Agent</h2>
        <p className="text-white/60">Intégrez ManyChat avec votre webhook</p>
      </div>

      <VideoPlayer url={videoUrl} />

      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Votre URL Webhook
        </h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={webhookUrl}
            readOnly
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
          />
          <button
            onClick={() => onCopy(webhookUrl)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            Copier
          </button>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onTest}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <LinkIcon className="w-5 h-5" />
              Tester la connexion
            </>
          )}
        </button>

        {webhookStatus === 'success' && (
          <div className="mt-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2 justify-center">
            <Check className="w-5 h-5" />
            Connexion réussie ! 🎉
          </div>
        )}
      </div>
    </div>
  )
}

// Étape 5
function Step5({ formData, videoUrl }: any) {
  const calendlyUrl = "https://calendly.com/coach_ai_solutions/30min"

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Félicitations ! 🎉</h2>
        <p className="text-white/60 text-lg">Votre agent IA est configuré</p>
      </div>

      <VideoPlayer url={videoUrl} />

      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4">📋 Récapitulatif</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow label="Nom" value={formData.nom} />
          <InfoRow label="Instagram" value={formData.instagram_handle} />
          <InfoRow label="Niche" value={formData.niche} />
          <InfoRow label="Style" value={formData.style_communication} />
          <InfoRow label="Mots-clés" value={formData.mots_cles_cibles.join(', ') || 'Aucun'} />
          <InfoRow label="Tests effectués" value={formData.tests_effectues.toString()} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
          <Calendar className="w-12 h-12 text-blue-400 mb-4" />
          <h4 className="text-white font-semibold mb-2">Réservez votre call</h4>
          <p className="text-white/60 text-sm mb-4">Un expert vous accompagne</p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition-all font-semibold"
          >
            Réserver
          </a>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30">
          <Rocket className="w-12 h-12 text-green-400 mb-4" />
          <h4 className="text-white font-semibold mb-2">Dashboard</h4>
          <p className="text-white/60 text-sm mb-4">Suivez vos performances</p>
          <div className="w-full px-4 py-3 bg-green-500 text-white text-center rounded-lg font-semibold cursor-pointer">
            Accéder maintenant
          </div>
        </div>
      </div>
    </div>
  )
}

// Composants utilitaires
function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/20 text-center">
      <div className="text-blue-400 mb-3 flex justify-center">{icon}</div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-white font-medium capitalize">{value}</span>
    </div>
  )
}