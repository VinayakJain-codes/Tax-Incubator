interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  loading?: boolean;
}

export default function SummaryCard({ title, value, subtitle, loading = false }: SummaryCardProps) {
  return (
    <div className="p-6 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
      <dt
        className="text-[0.65rem] font-semibold uppercase mb-2 text-gray-500"
        style={{ letterSpacing: '0.08em' }}
      >
        {title}
      </dt>
      <dd className="text-3xl font-bold tracking-tight text-gray-900">
        {loading ? (
          <div className="h-9 w-24 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          value
        )}
      </dd>
      {subtitle && (
        <p className="mt-2 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
