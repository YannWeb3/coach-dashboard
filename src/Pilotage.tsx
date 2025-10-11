import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  TrendingUp, Users, MessageSquare, Target, Phone, DollarSign,
  UserCheck, Mail, Award, BarChart3, TrendingDown
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Pilotage() {
  const [kpis, setKpis] = useState<any>(null);
  const [topSources, setTopSources] = useState<any[]>([]);
  const [topProfessions, setTopProfessions] = useState<any[]>([]);
  const [responseRates, setResponseRates] = useState<any>({
    msg1_rate: 0,
    msg2_rate: 0,
    msg3_rate: 0,
    msg4_rate: 0
  });
  const [leadsEvolution, setLeadsEvolution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Non authentifié');
        return;
      }

      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) {
        setError('Profil coach introuvable');
        return;
      }

      const coachId = profileData.id;

      // KPIs
      const { data: kpisData } = await supabase
        .from('coach_dashboard_kpis')
        .select('*')
        .eq('coach_id', coachId)
        .single();

      setKpis(kpisData);

      // Top sources
      const { data: sourcesData } = await supabase
        .rpc('get_top_sources', { p_coach_id: coachId, p_limit: 5 });
      setTopSources(sourcesData || []);

      // Top professions
      const { data: professionsData } = await supabase
        .rpc('get_top_professions', { p_coach_id: coachId, p_limit: 5 });
      setTopProfessions(professionsData || []);

      // Taux de réponse
      const { data: ratesData } = await supabase
        .rpc('get_response_rates', { p_coach_id: coachId });
      if (ratesData && ratesData.length > 0) {
        setResponseRates(ratesData[0]);
      }

      // Évolution leads 30 derniers jours
      const { data: evolutionData } = await supabase
        .from('leads')
        .select('created_at')
        .eq('coach_id', coachId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      // Grouper par jour
      const grouped = groupByDay(evolutionData || []);
      setLeadsEvolution(grouped);

    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function groupByDay(data: any[]) {
    const groups: { [key: string]: number } = {};
    const last30Days = [];

    // Générer les 30 derniers jours
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      groups[key] = 0;
      last30Days.push({
        date: key,
        leads: 0,
        label: new Date(key).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      });
    }

    // Compter les leads par jour
    data.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      if (groups.hasOwnProperty(date)) {
        groups[date]++;
      }
    });

    // Mettre à jour avec les vrais comptes
    return last30Days.map(day => ({
      ...day,
      leads: groups[day.date] || 0
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400 text-xl">{error || 'Erreur chargement'}</div>
      </div>
    );
  }

  // Données graphiques
  const funnelData = [
    { etape: 'Messages', valeur: kpis.total_messages_sent || 0, color: '#3b82f6' },
    { etape: 'Qualifiés', valeur: kpis.qualified_leads || 0, color: '#10b981' },
    { etape: 'Calls', valeur: kpis.calls_booked || 0, color: '#f59e0b' },
    { etape: 'Gagnés', valeur: kpis.leads_won || 0, color: '#8b5cf6' }
  ];

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
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

      {/* KPIs Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard 
          title="Total Leads" 
          value={kpis.total_leads || 0}
          icon={Users}
          color="blue"
        />
        <KPICard 
          title="Taux Qualification" 
          value={`${(kpis.qualification_rate || 0).toFixed(0)}%`}
          icon={Target}
          color="green"
        />
        <KPICard 
          title="Calls Réservés" 
          value={kpis.calls_booked || 0}
          icon={Phone}
          color="orange"
        />
        <KPICard 
          title="Revenus" 
          value={`${(kpis.total_revenue || 0).toFixed(0)}€`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Section Graphiques */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1 : Évolution Leads */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Évolution des Leads (30j)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={leadsEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="label" 
                stroke="#ffffff60"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2 : Funnel Conversion */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-400" />
            Funnel de Conversion
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis type="number" stroke="#ffffff60" style={{ fontSize: '12px' }} />
              <YAxis dataKey="etape" type="category" stroke="#ffffff60" style={{ fontSize: '12px' }} width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="valeur" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Graphique 3 : Sources Leads (PieChart) */}
      <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-400" />
          Répartition des Sources
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topSources}
                dataKey="lead_count"
                nameKey="source_name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.source_name}: ${entry.percentage}%`}
              >
                {topSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Légende Custom */}
          <div className="flex flex-col justify-center space-y-3">
            {topSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                  />
                  <span className="text-white font-medium">{source.source_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{source.lead_count}</span>
                  <span className="text-white/60 text-sm">({source.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Taux de Réponse */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-green-400" />
          </div>
          Taux de Réponse par Message
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(msgNum => {
            const rate = Number(responseRates[`msg${msgNum}_rate`] || 0);
            const badge = getStatusBadge(rate);
            return (
              <div key={msgNum} className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Message {msgNum}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="text-4xl font-bold text-white mb-4">
                  {rate.toFixed(0)}%
                </div>
                <ProgressBar value={rate} color={rate >= 60 ? 'green' : rate >= 40 ? 'yellow' : 'red'} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Démographie */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          Démographie & Professions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">
              {kpis.total_leads > 0 ? ((kpis.male_count / kpis.total_leads) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-white/60">Hommes</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <Users className="w-8 h-8 text-pink-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">
              {kpis.total_leads > 0 ? ((kpis.female_count / kpis.total_leads) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-white/60">Femmes</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">
              {Math.round(kpis.avg_age || 0)} ans
            </div>
            <p className="text-white/60">Âge moyen</p>
          </div>
        </div>

        {/* Top Professions */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Top 5 Professions</h3>
          {topProfessions.length > 0 ? (
            <div className="space-y-3">
              {topProfessions.map((prof, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-white/80 font-medium">{prof.profession_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{prof.lead_count}</span>
                    <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                      {prof.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-center py-4">Aucune donnée disponible</p>
          )}
        </div>
      </section>
    </div>
  );
}

// Components
function KPICard({ title, value, icon: Icon, color = 'blue' }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 border-blue-500/30',
    green: 'bg-green-500/20 border-green-500/30',
    purple: 'bg-purple-500/20 border-purple-500/30',
    orange: 'bg-orange-500/20 border-orange-500/30',
  };

  const iconColors: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  return (
    <div className={`${colorClasses[color]} backdrop-blur-xl rounded-2xl p-6 border-2`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        <Icon className={`w-6 h-6 ${iconColors[color]}`} />
      </div>
      <div className="text-4xl font-bold text-white">{value}</div>
    </div>
  );
}

function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
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

function getStatusBadge(rate: number) {
  if (rate >= 60) return { label: 'Excellent', color: 'bg-green-500/20 text-green-400' };
  if (rate >= 40) return { label: 'Bon', color: 'bg-yellow-500/20 text-yellow-400' };
  return { label: 'À améliorer', color: 'bg-red-500/20 text-red-400' };
}