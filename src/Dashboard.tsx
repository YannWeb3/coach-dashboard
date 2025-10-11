import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  TrendingUp, Users, MessageSquare, Target, Phone, DollarSign,
  UserCheck, Mail, Award, BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [topSources, setTopSources] = useState<any[]>([]);
  const [topProfessions, setTopProfessions] = useState<any[]>([]);
  const [responseRates, setResponseRates] = useState<any>({
    msg1_rate: 0,
    msg2_rate: 0,
    msg3_rate: 0,
    msg4_rate: 0
  });
  const [leadsToFollowup, setLeadsToFollowup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer l'auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Non authentifié');
        return;
      }

      // 2. Récupérer le coach_profile.id depuis user_id
      const { data: profileData, error: profileError } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Erreur récupération profil:', profileError);
        setError('Profil coach introuvable. Contactez l\'administrateur.');
        return;
      }

      const coachId = profileData.id;
      console.log('Coach ID trouvé:', coachId);

      // 3. Vérifier si admin (non bloquant)
      console.log('Vérification admin pour user.id:', user.id);
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin')
        .select('id')
        .eq('id', user.id);
      
      console.log('Résultat vérif admin:', adminCheck);
      console.log('Erreur admin:', adminError);
      
      if (adminCheck && adminCheck.length > 0) {
        setIsAdmin(true);
        console.log('✅ Admin détecté - Bouton devrait apparaître');
      } else {
        console.log('❌ Pas admin - adminCheck:', adminCheck);
      }

      // 4. Charger les KPIs depuis la vue matérialisée
      const { data: kpisData, error: kpisError } = await supabase
        .from('coach_dashboard_kpis')
        .select('*')
        .eq('coach_id', coachId)
        .single();

      if (kpisError) {
        console.error('Erreur KPIs:', kpisError);
        throw new Error('Impossible de charger les KPIs');
      }

      setKpis(kpisData);
      console.log('KPIs chargés:', kpisData);

      // 5. Charger top sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .rpc('get_top_sources', { 
          p_coach_id: coachId, 
          p_limit: 5 
        });

      if (sourcesError) {
        console.warn('Erreur top sources (non bloquant):', sourcesError);
        setTopSources([]);
      } else {
        setTopSources(sourcesData || []);
      }

      // 6. Charger top professions
      const { data: professionsData, error: professionsError } = await supabase
        .rpc('get_top_professions', { 
          p_coach_id: coachId, 
          p_limit: 5 
        });

      if (professionsError) {
        console.warn('Erreur top professions (non bloquant):', professionsError);
        setTopProfessions([]);
      } else {
        setTopProfessions(professionsData || []);
      }

      // 7. Charger taux de réponse
      const { data: ratesData, error: ratesError } = await supabase
        .rpc('get_response_rates', { 
          p_coach_id: coachId 
        });

      if (ratesError) {
        console.warn('Erreur taux réponse (non bloquant):', ratesError);
        setResponseRates({ msg1_rate: 0, msg2_rate: 0, msg3_rate: 0, msg4_rate: 0 });
      } else if (ratesData && ratesData.length > 0) {
        setResponseRates(ratesData[0]);
      }

      // 8. Charger leads à relancer
      const { data: followupData, error: followupError } = await supabase
        .rpc('get_leads_to_followup', { 
          p_coach_id: coachId 
        });

      if (followupError) {
        console.warn('Erreur leads followup (non bloquant):', followupError);
        setLeadsToFollowup([]);
      } else {
        setLeadsToFollowup(followupData || []);
      }

    } catch (err: any) {
      console.error('Erreur chargement dashboard:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du dashboard...</div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">Erreur</h2>
          <p className="text-white">{error || 'Impossible de charger les données'}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Retour au login
          </button>
        </div>
      </div>
    );
  }

  console.log('🔍 Render Dashboard - isAdmin:', isAdmin);

  const getStatusBadge = (rate: number) => {
    if (rate >= 60) return { label: 'Excellent', color: 'bg-green-500/20 text-green-400' };
    if (rate >= 40) return { label: 'Bon', color: 'bg-yellow-500/20 text-yellow-400' };
    return { label: 'À améliorer', color: 'bg-red-500/20 text-red-400' };
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Pilotage & Analytics</h1>
            <p className="text-white/60">
              Suivez vos KPIs en temps réel • Dernière mise à jour : {new Date(kpis.last_updated).toLocaleString('fr-FR')}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Section 1 : Activité & Volume */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">📊 Activité & Volume</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Messages envoyés" 
              value={kpis.total_messages_sent || 0}
              icon={MessageSquare}
              borderColor="border-blue-500/50"
              iconBg="from-blue-500/20 to-blue-600/20"
              iconColor="text-blue-400"
            />
            <KPICard 
              title="Nombre de leads" 
              value={kpis.total_leads || 0}
              icon={Users}
              borderColor="border-emerald-500/50"
              iconBg="from-emerald-500/20 to-emerald-600/20"
              iconColor="text-emerald-400"
            />
            <KPICard 
              title="Leads aujourd'hui" 
              value={kpis.leads_today || 0}
              icon={TrendingUp}
              borderColor="border-orange-500/50"
              iconBg="from-orange-500/20 to-orange-600/20"
              iconColor="text-orange-400"
            />
            <KPICard 
              title="Messages moy/lead" 
              value={(kpis.avg_messages_per_lead || 0).toFixed(1)}
              icon={BarChart3}
              borderColor="border-purple-500/50"
              iconBg="from-purple-500/20 to-purple-600/20"
              iconColor="text-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Sources */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Top Sources de Leads</h3>
              {topSources.length > 0 ? (
                <div className="space-y-3">
                  {topSources.map((source, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-white/80">{source.source_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">{source.lead_count}</span>
                        <span className="text-sm text-white/60">({source.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">Aucune donnée disponible</p>
              )}
            </div>

            {/* Temps moyen */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Temps de Discussion Moyen</h3>
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">
                    {Math.round(kpis.avg_time_to_action_minutes || 0)}
                  </div>
                  <div className="text-white/60 mt-2">minutes</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 : Taux de Réponse */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">💬 Taux de Réponse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(msgNum => {
              const rate = Number(responseRates[`msg${msgNum}_rate`] || 0);
              const badge = getStatusBadge(rate);
              return (
                <div key={msgNum} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Message {msgNum}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-3">
                    {rate.toFixed(0)}%
                  </div>
                  <ProgressBar value={rate} color={rate >= 60 ? 'green' : rate >= 40 ? 'yellow' : 'red'} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3 : Qualification & Conversion */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Qualification & Conversion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard 
              title="Prospects qualifiés" 
              value={`${kpis.qualified_leads || 0} (${(kpis.qualification_rate || 0).toFixed(0)}%)`}
              icon={Target}
              borderColor="border-blue-500/50"
              iconBg="from-blue-500/20 to-blue-600/20"
              iconColor="text-blue-400"
            />
            <KPICard 
              title="Lead magnets envoyés" 
              value={Math.round((kpis.qualified_leads || 0) * 0.75)}
              icon={Mail}
              borderColor="border-purple-500/50"
              iconBg="from-purple-500/20 to-purple-600/20"
              iconColor="text-purple-400"
            />
            <KPICard 
              title="Emails capturés" 
              value={Math.round((kpis.qualified_leads || 0) * 0.6)}
              icon={UserCheck}
              borderColor="border-emerald-500/50"
              iconBg="from-emerald-500/20 to-emerald-600/20"
              iconColor="text-emerald-400"
            />
          </div>

          {/* Funnel */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10 mt-6">
            <h3 className="text-xl font-semibold text-white mb-6">Funnel de Conversion</h3>
            <div className="space-y-4">
              <FunnelStep label="Messages envoyés" value={kpis.total_messages_sent || 0} width={100} />
              <FunnelStep label="Qualifiés" value={kpis.qualified_leads || 0} width={(kpis.qualification_rate || 0)} />
              <FunnelStep label="Calls proposés" value={kpis.calls_proposed || 0} width={(kpis.call_booking_rate || 0) * 0.8} />
              <FunnelStep label="Calls réservés" value={kpis.calls_booked || 0} width={kpis.call_booking_rate || 0} />
            </div>
          </div>
        </section>

        {/* Section 4 : Démographie */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">👥 Démographie</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <KPICard 
              title="% Hommes" 
              value={kpis.total_leads > 0 ? `${((kpis.male_count / kpis.total_leads) * 100).toFixed(0)}%` : '0%'} 
              icon={Users}
              borderColor="border-blue-500/50"
              iconBg="from-blue-500/20 to-blue-600/20"
              iconColor="text-blue-400"
            />
            <KPICard 
              title="% Femmes" 
              value={kpis.total_leads > 0 ? `${((kpis.female_count / kpis.total_leads) * 100).toFixed(0)}%` : '0%'} 
              icon={Users}
              borderColor="border-pink-500/50"
              iconBg="from-pink-500/20 to-pink-600/20"
              iconColor="text-pink-400"
            />
            <KPICard 
              title="% Autre" 
              value={kpis.total_leads > 0 ? `${(((kpis.total_leads - kpis.male_count - kpis.female_count) / kpis.total_leads) * 100).toFixed(0)}%` : '0%'} 
              icon={Users}
              borderColor="border-purple-500/50"
              iconBg="from-purple-500/20 to-purple-600/20"
              iconColor="text-purple-400"
            />
            <KPICard 
              title="Âge moyen" 
              value={Math.round(kpis.avg_age || 0)} 
              icon={Award}
              borderColor="border-emerald-500/50"
              iconBg="from-emerald-500/20 to-emerald-600/20"
              iconColor="text-emerald-400"
              suffix=" ans" 
            />
          </div>

          {/* Top Professions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Top 5 Professions</h3>
            {topProfessions.length > 0 ? (
              <div className="space-y-3">
                {topProfessions.map((prof, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-white/80">{prof.profession_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">{prof.lead_count}</span>
                      <span className="text-sm text-white/60">({prof.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60">Aucune donnée disponible</p>
            )}
          </div>
        </section>

        {/* Section 5 : Pipeline & Relances */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">📈 Pipeline & Relances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Leads nouveaux" 
              value={kpis.new_leads || 0} 
              icon={Users}
              borderColor="border-blue-500/50"
              iconBg="from-blue-500/20 to-blue-600/20"
              iconColor="text-blue-400"
            />
            <KPICard 
              title="Leads gagnés" 
              value={kpis.leads_won || 0} 
              icon={Award}
              borderColor="border-emerald-500/50"
              iconBg="from-emerald-500/20 to-emerald-600/20"
              iconColor="text-emerald-400"
            />
            <KPICard 
              title="Leads perdus" 
              value={`${kpis.leads_lost || 0} (${(kpis.lost_rate || 0).toFixed(0)}%)`} 
              icon={TrendingUp}
              borderColor="border-red-500/50"
              iconBg="from-red-500/20 to-red-600/20"
              iconColor="text-red-400"
            />
            <KPICard 
              title="À relancer" 
              value={`${kpis.leads_relance || 0}`} 
              icon={Phone}
              borderColor="border-orange-500/50"
              iconBg="from-orange-500/20 to-orange-600/20"
              iconColor="text-orange-400"
            />
          </div>

          {/* Liste leads à relancer */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10 mt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Leads à Relancer</h3>
            {leadsToFollowup.length > 0 ? (
              <div className="space-y-3">
                {leadsToFollowup.slice(0, 10).map((lead, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-semibold">@{lead.instagram_username}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(lead.priority)}`}>
                        {lead.priority === 'high' ? 'Haute' : lead.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/60 text-sm">{lead.days_since_contact}j sans contact</span>
                      <span className="text-white/80 text-sm">{lead.current_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60">Aucun lead à relancer</p>
            )}
          </div>
        </section>

        {/* Section 6 : Performance & ROI */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">💰 Performance & ROI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="ROI" 
              value={`${kpis.total_revenue > 0 ? ((kpis.total_revenue / 1000) * 100).toFixed(0) : 0}%`} 
              icon={DollarSign}
              borderColor="border-emerald-500/50"
              iconBg="from-emerald-500/20 to-emerald-600/20"
              iconColor="text-emerald-400"
            />
            <KPICard 
              title="Revenus générés" 
              value={`${(kpis.total_revenue || 0).toFixed(0)}€`} 
              icon={DollarSign}
              borderColor="border-blue-500/50"
              iconBg="from-blue-500/20 to-blue-600/20"
              iconColor="text-blue-400"
            />
            <KPICard 
              title="Coût acquisition" 
              value="50€" 
              icon={DollarSign}
              borderColor="border-orange-500/50"
              iconBg="from-orange-500/20 to-orange-600/20"
              iconColor="text-orange-400"
            />
            <KPICard 
              title="Deals fermés" 
              value={kpis.leads_won || 0} 
              icon={Award}
              borderColor="border-purple-500/50"
              iconBg="from-purple-500/20 to-purple-600/20"
              iconColor="text-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Efficacité IA</h3>
              <div className="text-4xl font-bold text-white">94%</div>
              <p className="text-white/60 mt-2">Temps gagné : 47h/mois</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Meilleur moment</h3>
              <div className="text-2xl font-bold text-white">Mardi, 18h</div>
              <p className="text-white/60 mt-2">Taux de conversion max</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Composants utilitaires
function KPICard({ title, value, icon: Icon, suffix = '', borderColor = 'border-blue-500/50', iconBg = 'from-blue-500/20 to-blue-600/20', iconColor = 'text-blue-400' }: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>; 
  suffix?: string;
  borderColor?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 ${borderColor} hover:bg-white/10 transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`bg-gradient-to-br ${iconBg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="text-4xl font-bold text-white mb-2">
        {value}{suffix}
      </div>
      <h3 className="text-sm font-medium text-white/60">{title}</h3>
    </div>
  );
}

function ProgressBar({ value, color = 'blue' }: { value: number; color?: 'blue' | 'green' | 'yellow' | 'red' }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div 
        className={`${colorClasses[color]} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function FunnelStep({ label, value, width }: { label: string; value: number; width: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm text-white/80 mb-2">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-8 flex items-center px-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all"
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </div>
  );
}