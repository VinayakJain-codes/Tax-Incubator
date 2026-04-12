export function convertToCSV(data: any[], columns: { key: string; label: string }[]): string {
  if (data.length === 0) return '';

  // Filter out columns that start with underscore (auto-generated logic columns) if needed
  // Or just process the ones provided
  const headerRows = columns.map(col => col.label).join(',');
  
  const csvRows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];

      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert booleans to Yes/No
      if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No';
      }
      
      // Convert objects/arrays to JSON string
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  return [headerRows, ...csvRows].join('\n');
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const docUrl = document.createElement('a');
  if (navigator.clipboard) {
    // optional: add to clipboard? No, just download
  }
  
  const url = URL.createObjectURL(blob);
  docUrl.setAttribute('href', url);
  docUrl.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  docUrl.style.visibility = 'hidden';
  document.body.appendChild(docUrl);
  docUrl.click();
  document.body.removeChild(docUrl);
  URL.revokeObjectURL(url);
}
