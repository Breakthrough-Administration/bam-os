import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Lock,
  AlertTriangle,
  Receipt,
  CalendarCheck,
  ShieldCheck,
  Building,
  Cloud,
  Activity,
} from 'lucide-react';
import { useManagementStore } from '../stores';
import { MainNavTab } from '../stores/slices/uiSlice';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, incidents, protocols } = useManagementStore();

  const criticalIncidentsCount = incidents.filter(
    (inc) => inc.is24HourReportable && inc.status !== 'closed'
  ).length;

  const activeProtocolsCount = protocols.filter(
    (p) => p.authorisationStatus === 'authorised' || p.authorisationStatus === 'fading_in_progress'
  ).length;

  const navItems: {
    key: MainNavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      key: 'dashboard',
      label: 'Clinical Governance',
      icon: LayoutDashboard,
    },
    {
      key: 'participants',
      label: 'Participants & BSP',
      icon: Users,
    },
    {
      key: 'case_notes',
      label: 'SOAP Clinical Notes',
      icon: FileText,
    },
    {
      key: 'restrictive_practices',
      label: 'Restrictive Practices Hub',
      icon: Lock,
      badge: activeProtocolsCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      key: 'incident_escalation',
      label: '24h Incident Escalation',
      icon: AlertTriangle,
      badge: criticalIncidentsCount > 0 ? `${criticalIncidentsCount} PRIORITY` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold',
    },
    {
      key: 'clinical_outcomes',
      label: 'Clinical Outcomes & Trends',
      icon: Activity,
    },
    {
      key: 'billing_papl',
      label: 'NDIS PAPL & Travel Engine',
      icon: Receipt,
    },
    {
      key: 'schads_roster',
      label: 'Fair Work SCHADS Roster',
      icon: CalendarCheck,
    },
    {
      key: 'audit_compliance',
      label: 'Quality & Audit Register',
      icon: ShieldCheck,
    },
    {
      key: 'workspace_hub',
      label: 'Workspace & Cloud Hub',
      icon: Cloud,
      badge: 'LIVE',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      key: 'security_rollout',
      label: 'Security & Rollout Plan',
      icon: ShieldCheck,
      badge: '91/100',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Clinical Operations
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition text-left group ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Compliance Footer Information */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/40 border border-slate-800 text-slate-300 text-[11px]">
          <Building className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <p className="font-semibold text-slate-200 truncate">VIC Branch Melbourne</p>
            <p className="text-[10px] text-slate-400">NDIS Reg: 4-3199-8821</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
