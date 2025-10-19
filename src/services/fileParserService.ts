import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { DBMapping, ComputedField } from '../types/index.js';

export const parseFile = async (file: File): Promise<any[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  switch (fileExtension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'csv':
      return parseCSV(file);
    case 'pdf':
      return parsePDF(file);
    case 'doc':
    case 'docx':
      return parseWord(file);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
};

const parseExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Convert to array of objects
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const result = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsBinaryString(file);
  });
};

const parseCSV = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const parsePDF = async (file: File): Promise<any[]> => {
  // For PDF parsing, we'll use a simpler text extraction approach
  // In production, you might want to use pdf-parse or similar
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // This is a placeholder - real PDF parsing would need pdf-parse library
        // For now, we'll just return empty array with a note
        console.warn('PDF parsing not fully implemented. Please use Excel or CSV format.');
        resolve([]);
      } catch (error) {
        console.error('PDF parsing error:', error);
        resolve([]);
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const parseWord = async (file: File): Promise<any[]> => {
  // For Word parsing, similar approach
  // In production, you might want to use mammoth or similar
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // This is a placeholder - real Word parsing would need mammoth library
        console.warn('Word document parsing not fully implemented. Please use Excel or CSV format.');
        resolve([]);
      } catch (error) {
        console.error('Word parsing error:', error);
        resolve([]);
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const extractDBMappings = (data: any[]): DBMapping[] => {
  // Assume data has columns: field_name, db_column (or similar variations)
  return data.map((row) => {
    const fieldName = row.field_name || row['Field Name'] || row.fieldName || row.name || '';
    const dbColumn = row.db_column || row['DB Column'] || row.dbColumn || row.mapping || row.column || '';
    
    return {
      field_name: fieldName.trim(),
      db_column: dbColumn.trim(),
    };
  }).filter(item => item.field_name && item.db_column);
};

export const extractComputedFields = (data: any[]): ComputedField[] => {
  // Assume data has columns: field_name, formula (or similar variations)
  return data.map((row) => {
    const fieldName = row.field_name || row['Field Name'] || row.fieldName || row.name || '';
    const formula = row.formula || row.Formula || row.logic || row.Logic || row.computation || '';
    
    return {
      field_name: fieldName.trim(),
      formula: formula.trim(),
    };
  }).filter(item => item.field_name && item.formula);
};