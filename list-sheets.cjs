const XLSX = require('xlsx');
const wb = XLSX.readFile('Group_Governance_and_Control_v6_SJ Comments.xlsx');
console.log('Sheet names:', JSON.stringify(wb.SheetNames, null, 2));
