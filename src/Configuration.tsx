import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  Target,
  MessageSquare,
  Key,
  Briefcase,
  Save,
  Edit2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface ConfigData {
  nom: string;
  email: string;
  telephone: string | null;
  instagram_handle: string | null;
  niche: string | null;
  style_communication: string | null;
  mots_cles_cibles: string[] | null;
  openrouter_api_key: string | null;
  offre_existante: boolean;
  statut: string;
  created_at: string;
  updated_at: string;
}

export default function Configuration() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState<Partial<ConfigData>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer coach_id
      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) return;

      // Charger config
      const { data: configData, error } = await supabase
        .from('config_coach')
        .select('*')
        .eq('id', profileData.id)
        .single();

      if (error) throw error;

      setConfig(configData);
      setFormData(configData);
    } catch (err) {
      console.error('Erreur chargement config:', err);
      showMessage('error', 'Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) return;

      const { error } = await supabase
        .from('config_coach')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.id);

      if (error) throw error;

      setConfig({ ...config!, ...formData } as ConfigData);
      setEditMode(false);
      showMessage('success', 'Configuration mise à jour avec succès !');
      
      // Reload pour avoir les dernières données
      await loadConfig();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      showMessage('error', err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function handleCancel() {
    setFormData(config!);
    setEditMode(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-2">Configuration introuvable</p>
          <p className="text-white/60">Veuillez compléter l'onboarding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Configuration</h1>
          <p className="text-white/60">
            Gérez vos paramètres et préférences • Dernière modification : {new Date(config.updated_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
          >
            <Edit2 className="w-5 h-5" />
            Modifier
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

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
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Statut Badge */}
      <div className={`p-4 rounded-xl border-2 ${
        config.statut === 'Configuration terminée' 
          ? 'bg-green-500/10 border-green-500/50' 
          : 'bg-yellow-500/10 border-yellow-500/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            config.statut === 'Configuration terminée' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
          }`} />
          <p className={`font-semibold ${
            config.statut === 'Configuration terminée' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            Statut : {config.statut}
          </p>
        </div>
      </div>

      {/* Section 1 : Informations Personnelles */}
      <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          Informations Personnelles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="Nom complet"
            icon={User}
            value={editMode ? formData.nom || '' : config.nom}
            editMode={editMode}
            onChange={(value) => setFormData({ ...formData, nom: value })}
          />
          
          <ConfigField
            label="Email"
            icon={Mail}
            value={editMode ? formData.email || '' : config.email}
            editMode={editMode}
            onChange={(value) => setFormData({ ...formData, email: value })}
            type="email"
          />
          
          <ConfigField
            label="Téléphone"
            icon={Phone}
            value={editMode ? formData.telephone || '' : config.telephone || 'Non renseigné'}
            editMode={editMode}
            onChange={(value) => setFormData({ ...formData, telephone: value })}
            placeholder="+33 6 12 34 56 78"
          />
          
          <ConfigField
            label="Instagram"
            icon={Instagram}
            value={editMode ? formData.instagram_handle || '' : config.instagram_handle || 'Non renseigné'}
            editMode={editMode}
            onChange={(value) => setFormData({ ...formData, instagram_handle: value })}
            placeholder="@username"
          />
        </div>
      </section>

      {/* Section 2 : Niche & Expertise */}
      <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          Niche & Expertise
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="Niche"
            icon={Target}
            value={editMode ? formData.niche || '' : config.niche || 'Non renseigné'}
            editMode={editMode}
            onChange={(value) => setFormData({ ...formData, niche: value })}
            placeholder="Ex: Fitness, Nutrition, Yoga..."
          />
          
          <div className="space-y-3">
            <label className="block text-white/80 text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Offre existante
            </label>
            {editMode ? (
              <div className="flex gap-4">
                <button
                  onClick={() => setFormData({ ...formData, offre_existante: true })}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    formData.offre_existante
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-slate-800/50 border-white/10 text-white/60'
                  }`}
                >
                  Oui
                </button>
                <button
                  onClick={() => setFormData({ ...formData, offre_existante: false })}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    !formData.offre_existante
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-slate-800/50 border-white/10 text-white/60'
                  }`}
                >
                  Non
                </button>
              </div>
            ) : (
              <div className={`px-4 py-3 rounded-xl ${
                config.offre_existante
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {config.offre_existante ? '✓ Oui, j\'ai une offre' : '✗ Pas encore d\'offre'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3 : Configuration IA */}
      <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-green-400" />
          </div>
          Configuration IA
        </h2>

        <div className="space-y-6">
          <ConfigField
            label="Style de communication"
            icon={MessageSquare}
            value={editMode ? formData.style_communication || '' : config.style_communication || 'Non renseigné'}
            editMode={editMode}
            onChange={(value) => setFormData({ ...formData, style_communication: value })}
            placeholder="Ex: Professionnel, Amical, Décontracté..."
          />

          <div className="space-y-3">
            <label className="block text-white/80 text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Mots-clés cibles
            </label>
            {editMode ? (
              <textarea
                value={formData.mots_cles_cibles?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  mots_cles_cibles: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                })}
                placeholder="Ex: coaching, fitness, transformation..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {config.mots_cles_cibles && config.mots_cles_cibles.length > 0 ? (
                  config.mots_cles_cibles.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-white/60">Aucun mot-clé défini</span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 4 : API & Sécurité */}
      <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Key className="w-6 h-6 text-orange-400" />
          </div>
          API & Sécurité
        </h2>

        <div className="space-y-3">
          <label className="block text-white/80 text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            OpenRouter API Key
          </label>
          {editMode ? (
            <input
              type="password"
              value={formData.openrouter_api_key || ''}
              onChange={(e) => setFormData({ ...formData, openrouter_api_key: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          ) : (
            <div className="px-4 py-3 rounded-xl bg-slate-800/50 text-white/60 font-mono">
              {config.openrouter_api_key 
                ? '••••••••••••••••••••••••••••••••' 
                : 'Non configurée'}
            </div>
          )}
          <p className="text-white/40 text-xs">
            🔒 Votre clé API est stockée de manière sécurisée et chiffrée
          </p>
        </div>
      </section>
    </div>
  );
}

// Composant Field Réutilisable
function ConfigField({ 
  label, 
  icon: Icon, 
  value, 
  editMode, 
  onChange, 
  type = 'text',
  placeholder 
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  editMode: boolean;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-white/80 text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {editMode ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div className="px-4 py-3 rounded-xl bg-slate-800/50 text-white">
          {value}
        </div>
      )}
    </div>
  );
}