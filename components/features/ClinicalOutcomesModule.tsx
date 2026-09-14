import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { useManagementStore } from '../../stores';
import { NDISGoalTracker } from './NDISGoalTracker';

export const ClinicalOutcomesModule: React.FC = () => {
  const { incidents, participants, caseNotes } = useManagementStore();

  // 1. Incidents Over Time (Monthly Aggregation)
  const incidentsOverTime = useMemo(() => {
    const monthlyData: Record<string, { month: string; critical: number; minor: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      monthlyData[monthStr] = { month: monthStr, critical: 0, minor: 0 };
    }

    incidents.forEach(incident => {
      if (!incident.occurredAt) return;
      const d = new Date(incident.occurredAt);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      if (monthlyData[monthStr]) {
        if (incident.severity === 'critical_24h' || incident.severity === 'high_5day') {
          monthlyData[monthStr].critical += 1;
        } else {
          monthlyData[monthStr].minor += 1;
        }
      }
    });

    return Object.values(monthlyData);
  }, [incidents]);

  // 2. Incident Types Distribution
  const incidentTypes = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    incidents.forEach(inc => {
      const cat = inc.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    const mapped = Object.entries(categoryCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
    return mapped.length > 0 ? mapped : [{ name: 'No Data', value: 1 }];
  }, [incidents]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  // 3. Progress Notes Sentiment (Last 4 Weeks based on goal ratings)
  const sentimentData = useMemo(() => {
    const weeklyData: Record<string, { name: string; positive: number; neutral: number; negative: number; sortKey: string }> = {};
    
    // Initialize last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7));
      // Start of week
      const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      const weekStr = `Wk ${startOfWeek.getDate()} ${startOfWeek.toLocaleString('default', { month: 'short' })}`;
      weeklyData[weekStr] = { name: weekStr, positive: 0, neutral: 0, negative: 0, sortKey: startOfWeek.toISOString() };
    }

    const last4WeeksDate = new Date();
    last4WeeksDate.setDate(last4WeeksDate.getDate() - 28);

    caseNotes.forEach(note => {
      if (!note.sessionDate) return;
      const d = new Date(note.sessionDate);
      if (d < last4WeeksDate) return;
      
      const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
      const startOfWeek = new Date(new Date(d).setDate(diff));
      const weekStr = `Wk ${startOfWeek.getDate()} ${startOfWeek.toLocaleString('default', { month: 'short' })}`;
      
      if (!weeklyData[weekStr]) return;

      if (note.goalsAddressed && note.goalsAddressed.length > 0) {
        note.goalsAddressed.forEach(g => {
          if (g.progressRating >= 4) weeklyData[weekStr].positive += 1;
          else if (g.progressRating === 3) weeklyData[weekStr].neutral += 1;
          else weeklyData[weekStr].negative += 1;
        });
      }
    });

    return Object.values(weeklyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [caseNotes]);

  // Aggregate stats
  const recentCriticalIncidents = incidents.filter(i => 
    (i.severity === 'critical_24h' || i.severity === 'high_5day') && 
    (new Date().getTime() - new Date(i.occurredAt).getTime() < 30 * 24 * 60 * 60 * 1000)
  ).length;

  const recentNotes = caseNotes.filter(n => 
    (new Date().getTime() - new Date(n.sessionDate).getTime() < 30 * 24 * 60 * 60 * 1000)
  ).length;

  // Average Goal Progress based on the most recent notes
  let totalRating = 0;
  let ratingCount = 0;
  caseNotes.forEach(note => {
    if (note.goalsAddressed) {
      note.goalsAddressed.forEach(g => {
        totalRating += g.progressRating;
        ratingCount += 1;
      });
    }
  });
  const avgGoalProgress = ratingCount > 0 ? ((totalRating / (ratingCount * 5)) * 100).toFixed(0) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Clinical Outcomes & Trends</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing clinical progress, incident frequency, and sentiment trends across all participants.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold">Critical Incidents (30d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{recentCriticalIncidents}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">Notes Logged (30d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{recentNotes}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Avg. Goal Progress</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{avgGoalProgress}%</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold">Active Participants</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{participants.length}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NDIS Goal Tracker Feature Component */}
        <NDISGoalTracker />

        {/* Progress Notes Sentiment */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Progress Notes Sentiment (Last 4 Weeks)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Weekly</span>
          </h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  itemStyle={{ fontSize: 12 }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="positive" name="Positive" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#64748b" />
                <Bar dataKey="negative" name="Negative" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents Trend */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Incident Frequency (6 Months)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Monthly</span>
          </h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentsOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="minor" name="Minor/Standard" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="critical" name="Critical/High" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Types Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Incident Types Distribution (YTD)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">All Participants</span>
          </h2>
          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incidentTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {incidentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
