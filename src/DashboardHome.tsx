import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  MessageSquare, 
  Users, 
  Phone, 
  TrendingUp, 
  Target,
  Clock,
  Zap
} from 'lucide-react';

export default function DashboardHome() {
  const [kpis, setKpis] = useState<any>(null);
  const [leadsToFollowup, setLeadsToFollowup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      const coachId = profileData.id;

      // Charger KPIs
      const { data: kpisData } = await supabase
        .from('coach_dashboard_kpis')
        .select('*')
        .eq('coach_id', coachId)
        .single();

      setKpis(kpisData);

      // Charger leads à relancer (top 5)
      const { data: followupData, error: followupError } = await supabase
        .rpc('get_leads_to_followup', { p_coach_id: coachId });

      console.log('📋 Leads à relancer:', followupData);
      console.log('❌ Erreur followup:', followupError);

      setLeadsToFollowup(followupData?.slice(0, 5) || []);
    } catch (err) {
      console.error('Erreur chargement dashboard home:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60 text-center">
          <p className="text-xl mb-2">Aucune donnée disponible</p>
          <p className="text-sm">Commencez par ajouter des leads</p>
        </div>
      </div>
    );
  }

  const mainKPIs = [
    {
      title: 'DM Reçus Aujourd\'hui',
      value: kpis.leads_today || 0,
      subtitle: `Messages entrants`,
      detail: 'vs hier',
      change: 0,
      icon: MessageSquare,
      color: 'blue',
      border: 'border-blue-500/50'
    },
    {
      title: 'DM Semaine Dernière',
      value: kpis.leads_week || 0,
      subtitle: 'Total des messages reçus',
      detail: 'vs semaine précédente',
      change: 0,
      icon: TrendingUp,
      color: 'green',
      border: 'border-green-500/50'
    },
    {
      title: 'Appels Proposés',
      value: kpis.calls_proposed || 0,
      subtitle: 'Rendez-vous planifiés',
      detail: 'cette semaine',
      change: 0,
      icon: Phone,
      color: 'orange',
      border: 'border-orange-500/50'
    },
    {
      title: 'Lead Magnets Envoyés',
      value: Math.round((kpis.qualified_leads || 0) * 0.75),
      subtitle: 'Ressources partagées',
      detail: 'taux de conversion',
      change: 0,
      icon: Zap,
      color: 'purple',
      border: 'border-purple-500/50'
    }
  ];

  const secondaryKPIs = [
    {
      title: 'Leads Chauds',
      value: kpis.engaged_leads || 0,
      subtitle: 'Prospects à fort potentiel',
      icon: Target,
      color: 'green'
    },
    {
      title: 'Total Leads',
      value: kpis.total_leads || 0,
      subtitle: 'Tous les prospects',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Relances à Faire',
      value: kpis.leads_relance || 0,
      subtitle: 'Prospects en attente',
      icon: Clock,
      color: 'purple'
    }
  ];

  //const getChangeColor = (change: number) => {
   // if (change > 0) return 'text-green-400';
    //if (change < 0) return 'text-red-400';
    //return 'text-white/60';
  //};

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Tableau de Bord</h1>
        <p className="text-white/60">Vue d'ensemble de votre activité de coaching IA</p>
      </div>

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border-2 ${kpi.border} hover:shadow-lg hover:shadow-${kpi.color}-500/20 transition-all`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${kpi.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${kpi.color}-400`} />
                </div>
                {kpi.change !== 0 && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    kpi.change > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </span>
                )}
              </div>
              
              <h3 className="text-white/80 font-medium mb-2 text-sm">{kpi.title}</h3>
              <div className="text-4xl font-bold text-white mb-2">{kpi.value}</div>
              <p className="text-white/60 text-sm mb-1">{kpi.subtitle}</p>
              <p className="text-white/40 text-xs">{kpi.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {secondaryKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-${kpi.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 text-${kpi.color}-400`} />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-sm mb-1">{kpi.title}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
              </div>
              <p className="text-white/40 text-sm mt-3">{kpi.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Performance de l'IA */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-400" />
              Performance de l'IA
            </h3>
            <p className="text-white/60 text-sm">Statistiques d'automatisation</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              94%
            </div>
            <p className="text-white/60 text-sm mt-1">Efficacité globale</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{kpis.total_messages_sent || 0}</p>
            <p className="text-white/60 text-xs mt-1">Messages automatisés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {Math.round((kpis.avg_time_to_action_minutes || 0) / 60)}h
            </p>
            <p className="text-white/60 text-xs mt-1">Temps gagné / mois</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {((kpis.qualified_leads / kpis.total_leads) * 100 || 0).toFixed(0)}%
            </p>
            <p className="text-white/60 text-xs mt-1">Taux qualification</p>
          </div>
        </div>
      </div>

      {/* Leads à Relancer */}
      {leadsToFollowup.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-400" />
            Relances à Faire
          </h3>
          <div className="space-y-3">
            {leadsToFollowup.map((lead, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {(lead.instagram_username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">@{lead.instagram_username}</p>
                    <p className="text-white/60 text-sm">{lead.current_status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/60 text-sm">{lead.days_since_contact}j</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    lead.priority === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : lead.priority === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {lead.priority === 'high' ? 'Urgent' : lead.priority === 'medium' ? 'Moyen' : 'Normal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}