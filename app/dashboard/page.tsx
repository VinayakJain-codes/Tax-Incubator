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

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, active: 0, overdueVat: 0, overdueCt: 0, expiredLicenses: 0 });
  const [jurisdictionData, setJurisdictionData] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      const { data: vat } = await supabase.from('vat_matrix').select('last_filing_date, is_deleted').eq('is_deleted', false);
      const overdueVat = vat?.filter((v: any) => v.last_filing_date && v.last_filing_date < today).length || 0;

      const { data: ct } = await supabase.from('ct_matrix').select('return_due_date, is_deleted').eq('is_deleted', false);
      const overdueCt = ct?.filter((c: any) => c.return_due_date && c.return_due_date < today).length || 0;

      const { data: licenses } = await supabase.from('licenses').select('expiry_date, is_deleted').eq('is_deleted', false);
      const expiredLicenses = licenses?.filter((l: any) => l.expiry_date && l.expiry_date < today).length || 0;

      setStats({ total, active, overdueVat, overdueCt, expiredLicenses });
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
    </div>
  );
}
