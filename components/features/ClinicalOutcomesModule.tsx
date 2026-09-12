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

export const ClinicalOutcomesModule: React.FC = () => {
  const { incidents, participants } = useManagementStore();

  // 1. Incidents Over Time
  const incidentsOverTime = useMemo(() => {
    // Generate dummy data based on store data or fallback to generic
    const data = [
      { month: 'Jan', critical: 2, minor: 5 },
      { month: 'Feb', critical: 1, minor: 6 },
      { month: 'Mar', critical: 0, minor: 4 },
      { month: 'Apr', critical: 3, minor: 7 },
      { month: 'May', critical: 1, minor: 3 },
      { month: 'Jun', critical: Math.min(incidents.length, 5), minor: incidents.length * 2 },
    ];
    return data;
  }, [incidents]);

  // 2. Incident Types Distribution
  const incidentTypes = useMemo(() => {
    return [
      { name: 'Behavioural', value: 45 },
      { name: 'Medical', value: 25 },
      { name: 'Environmental', value: 20 },
      { name: 'Other', value: 10 },
    ];
  }, []);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // 3. Progress Notes Sentiment
  const sentimentData = useMemo(() => {
    return [
      { name: 'Week 1', positive: 65, neutral: 20, negative: 15 },
      { name: 'Week 2', positive: 70, neutral: 15, negative: 15 },
      { name: 'Week 3', positive: 75, neutral: 15, negative: 10 },
      { name: 'Week 4', positive: 80, neutral: 10, negative: 10 },
    ];
  }, []);

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
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold">Critical Incidents (30d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">4</p>
          <p className="text-[10px] text-emerald-400 mt-1">↓ 20% from last month</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">Notes Logged (30d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">142</p>
          <p className="text-[10px] text-emerald-400 mt-1">↑ 15% from last month</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Avg. Goal Progress</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">76%</p>
          <p className="text-[10px] text-emerald-400 mt-1">↑ 5% from last month</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold">Active Participants</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{participants.length}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Line type="monotone" dataKey="minor" name="Minor Incidents" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="critical" name="Critical Incidents" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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

        {/* Incident Types Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Incident Types Distribution (YTD)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">All Participants</span>
          </h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
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
