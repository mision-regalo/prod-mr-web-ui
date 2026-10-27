import * as XLSX from 'xlsx';
import { Letter } from '../types';

export function exportLettersToExcel(
  letters: Letter[],
  fileName: string,
  includeCoordinator: boolean = true
) {
  const rows = letters.map((l) => {
    const row: Record<string, any> = {
      'ID Carta': l.id,
      'Nombre del Niño': l.kidName,
      'Edad': l.age,
      'Género': l.gender,
      'Opción 1: Juguete': l.toyRequest,
      'Opción 2: Juguete': l.toyRequested2,
      'Opción 3: Juguete': l.toyRequested3,
      'Líder': l.leaderName || 'Sin Asignar',
    };

    if (includeCoordinator) {
      row['Coordinador'] = l.coordinatorName || 'Sin Asignar';
    }

    row['Padrino'] = l.donorName || 'Sin Donante';
    row['Cantidad Regalos'] = l.presents.length;
    row['Regalos Recibidos'] = l.presents.map(p => `${p.type} (${p.description})`).join('; ');

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportSummaryStatsToExcel(letters: Letter[], fileName: string) {
  const distribution = {
    '3 o más regalos': letters.filter(l => l.presents.length >= 3).length,
    '2 regalos': letters.filter(l => l.presents.length === 2).length,
    '1 regalo': letters.filter(l => l.presents.length === 1).length,
    '0 regalos': letters.filter(l => l.presents.length === 0).length,
  };

  const rows = [
    { 'Métrica': 'Total de Cartas Registradas', 'Valor': letters.length },
    { 'Métrica': 'Cartas con Padrino', 'Valor': letters.filter(l => !!l.donorId).length },
    { 'Métrica': 'Cartas Sin Padrino', 'Valor': letters.filter(l => !l.donorId).length },
    { 'Métrica': 'Cartas con Padrino pero Sin Regalos', 'Valor': letters.filter(l => !!l.donorId && l.presents.length === 0).length },
    { 'Métrica': 'Cartas con 3 o más regalos', 'Valor': distribution['3 o más regalos'] },
    { 'Métrica': 'Cartas con 2 regalos', 'Valor': distribution['2 regalos'] },
    { 'Métrica': 'Cartas con 1 regalo (Objetivo Cumplido)', 'Valor': distribution['1 regalo'] },
    { 'Métrica': 'Cartas con 0 regalos (Requiere Reasignación)', 'Valor': distribution['0 regalos'] },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Estadístico');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
