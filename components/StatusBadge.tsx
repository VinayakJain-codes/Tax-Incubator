interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  const getBadgeClassNames = (val: string): { bg: string; text: string; dot: string; border: string } => {
    const s = val.toLowerCase();
    
    // CRITICAL - solid dark
    if (s.includes('overdue') || s.includes('expired') || s.includes('high') || s.includes('critical')) {
      return { bg: 'bg-gray-100', text: 'text-gray-900', dot: 'bg-gray-900', border: 'border-transparent' };
    }
    // WARNING - medium gray
    if (s.includes('soon') || s.includes('warning') || s.includes('pending') || s.includes('medium')) {
      return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', border: 'border-gray-200' };
    }
    // OK - light subtle
    if (s.includes('track') || s.includes('active') || s.includes('low')) {
      return { bg: 'bg-white', text: 'text-gray-500', dot: 'bg-gray-300', border: 'border-gray-200' };
    }
    
    // FALLBACK
    return { bg: 'bg-transparent', text: 'text-gray-400', dot: 'bg-gray-200', border: 'border-transparent' };
  };

  const style = getBadgeClassNames(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded border ${style.bg} ${style.text} ${style.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}
      />
      {status}
    </span>
  );
}
