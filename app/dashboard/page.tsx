'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF'];
const RISK_COLORS: Record<string, string> = {
  Low: '#9CA3AF',
  Medium: '#6B7280',
  High: '#111827',
  Unknown: '#D1D5DB',
};

interface DueItem {
  label: string;
  entity: string;
  dueDate: string;
  daysLeft: number;
  tab: string;
  rag: 'red' | 'amber' | 'green';
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, active: 0, overdueVat: 0, overdueCt: 0, expiredLicenses: 0 });
  const [jurisdictionData, setJurisdictionData] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const daysFromToday = (dateStr: string): number => {
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.round((new Date(dateStr).getTime() - today.getTime()) / 86400000);
  };

  const ragColor = (days: number): 'red' | 'amber' | 'green' => {
    if (days < 0) return 'red';
    if (days <= 14) return 'red';
    if (days <= 30) return 'amber';
    return 'green';
  };

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];

      const { data: entities } = await supabase.from('entities').select('entity_status, jurisdiction, risk_rating, is_deleted').eq('is_deleted', false);
      const total = entities?.length || 0;
      const active = entities?.filter((e: any) => e.entity_status === 'Active').length || 0;

      const jCount: Record<string, number> = {};
      entities?.forEach((e: any) => {
        const j = e.jurisdiction || 'Unknown';
        jCount[j] = (jCount[j] || 0) + 1;
      });
      setJurisdictionData(Object.entries(jCount).map(([name, value]) => ({ name, value })));

      const rCount: Record<string, number> = {};
      entities?.forEach((e: any) => {
        const r = e.risk_rating || 'Unknown';
        rCount[r] = (rCount[r] || 0) + 1;
      });
      setRiskData(Object.entries(rCount).map(([name, value]) => ({ name, value })));

      const { data: vat } = await supabase.from('vat_matrix_computed').select('next_due_date, filing_frequency, entity_legal_name, days_to_due, filing_status, is_deleted, is_completed').eq('is_deleted', false).eq('is_completed', false);
      const overdueVat = vat?.filter((v: any) => v.filing_status === 'Overdue').length || 0;

      const { data: ct } = await supabase.from('ct_matrix_computed').select('next_due_date, filing_frequency, entity_legal_name, days_to_due, filing_status, is_deleted, is_completed').eq('is_deleted', false).eq('is_completed', false);
      const overdueCt = ct?.filter((c: any) => c.filing_status === 'Overdue').length || 0;

      const { data: licenses } = await supabase.from('licenses_computed').select('expiry_date, entity_legal_name, licensing_authority, days_to_expiry, license_status, is_deleted, is_completed').eq('is_deleted', false).eq('is_completed', false);
      const expiredLicenses = licenses?.filter((l: any) => l.license_status === 'EXPIRED').length || 0;

      const { data: renewals } = await supabase.from('renewal_calendar_computed').select('due_date, description, entity_legal_name, days_to_due, rag_status, is_deleted').eq('is_deleted', false);

      setStats({ total, active, overdueVat, overdueCt, expiredLicenses });

      // Build "Due in 30 days" list
      const dueIn30: DueItem[] = [];
      const HORIZON = 30;

      vat?.forEach((v: any) => {
        if (v.days_to_due !== null && v.days_to_due >= 0 && v.days_to_due <= HORIZON) {
          dueIn30.push({ label: `VAT Filing (${v.filing_frequency})`, entity: v.entity_legal_name || '—', dueDate: v.next_due_date, daysLeft: v.days_to_due, tab: '/sheets/vat', rag: ragColor(v.days_to_due) });
        }
      });

      ct?.forEach((c: any) => {
        if (c.days_to_due !== null && c.days_to_due >= 0 && c.days_to_due <= HORIZON) {
          dueIn30.push({ label: 'CT Filing', entity: c.entity_legal_name || '—', dueDate: c.next_due_date, daysLeft: c.days_to_due, tab: '/sheets/ct', rag: ragColor(c.days_to_due) });
        }
      });

      licenses?.forEach((l: any) => {
        if (l.days_to_expiry !== null && l.days_to_expiry >= 0 && l.days_to_expiry <= HORIZON) {
          dueIn30.push({ label: `License Renewal — ${l.licensing_authority || 'N/A'}`, entity: l.entity_legal_name || '—', dueDate: l.expiry_date, daysLeft: l.days_to_expiry, tab: '/sheets/licenses', rag: ragColor(l.days_to_expiry) });
        }
      });

      renewals?.forEach((r: any) => {
        if (r.days_to_due !== null && r.days_to_due >= 0 && r.days_to_due <= HORIZON) {
          dueIn30.push({ label: r.description || 'Renewal', entity: r.entity_legal_name || '—', dueDate: r.due_date, daysLeft: r.days_to_due, tab: '/sheets/renewals', rag: r.rag_status?.toLowerCase() || ragColor(r.days_to_due) });
        }
      });

      dueIn30.sort((a, b) => a.daysLeft - b.daysLeft);
      setDueItems(dueIn30);

      setLoading(false);
    }
    load();
  }, []);

  const kpis = [
    { label: 'Total Entities', value: stats.total, icon: '▦' },
    { label: 'Active Entities', value: stats.active, icon: '◉' },
    { label: 'Overdue VAT', value: stats.overdueVat, icon: '◈' },
    { label: 'Overdue CT', value: stats.overdueCt, icon: '◇' },
    { label: 'Expired Licenses', value: stats.expiredLicenses, icon: '▧' },
  ];

  return (
    <div className="space-y-6">
      {/* System Status Banner */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md">
            <span className="text-gray-500 text-sm">◎</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 tracking-wide">
              SYSTEM STATUS: {stats.total} Entities Tracked
            </p>
            <p className="text-xs mt-0.5 text-gray-500">All systems operational. Compliance monitoring active.</p>
          </div>
        </div>
        <Link
          href="/audit-log"
          className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors duration-200 whitespace-nowrap"
          style={{ letterSpacing: '0.05em' }}
        >
          VIEW ALL →
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 transition-all duration-200 hover:translate-y-[-2px] bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 flex items-center justify-center text-lg bg-gray-50 rounded-md">
                <span className="text-gray-500">{kpi.icon}</span>
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</p>
            )}
            <p
              className="text-[0.65rem] font-semibold mt-2 uppercase text-gray-500"
              style={{ letterSpacing: '0.08em' }}
            >
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Jurisdiction Distribution */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Executive Summary</h3>
          <p className="text-xs mb-5 text-gray-500">Jurisdiction Distribution</p>
          {loading ? (
            <div className="h-48 animate-pulse rounded bg-gray-100" />
          ) : jurisdictionData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={jurisdictionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {jurisdictionData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', color: '#111827', fontSize: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                  itemStyle={{ color: '#111827' }}
                />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Board Pack Summary</h3>
          <p className="text-xs mb-5 text-gray-500">Risk Distribution</p>
          {loading ? (
            <div className="h-48 animate-pulse rounded bg-gray-100" />
          ) : riskData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', color: '#111827', fontSize: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
                <Bar dataKey="value" radius={[0, 0, 0, 0]} maxBarSize={50}>
                  {riskData.map((entry: any, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name] || RISK_COLORS.Unknown} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Items Due in 30 Days Widget */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">⏰ Items Due in 30 Days</h3>
            <p className="text-xs mt-0.5 text-gray-500">VAT, CT, Licenses & Renewals requiring attention</p>
          </div>
          {dueItems.length > 0 && (
            <span className="inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full bg-red-50 text-red-600 border border-red-100">
              {dueItems.length}
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded animate-pulse bg-gray-100" />)}
          </div>
        ) : dueItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <span className="text-3xl mb-2">✅</span>
            <p className="text-sm font-medium">No items due in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {dueItems.map((item, idx) => (
              <Link key={idx} href={item.tab} className="group flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150">
                {/* RAG indicator */}
                <div className={`w-2.5 h-2.5 flex-shrink-0 rounded-full ${
                  item.rag === 'red' ? 'bg-red-500' :
                  item.rag === 'amber' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 truncate">{item.entity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${
                    item.rag === 'red' ? 'text-red-600' :
                    item.rag === 'amber' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d left`}
                  </p>
                  <p className="text-xs text-gray-400">{item.dueDate}</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
