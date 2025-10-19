import type { FigmaField, DBMapping, ComputedField, ConsolidatedField, ValidationError } from '../types/index.js';

export const consolidateData = (
  figmaFields: FigmaField[],
  dbMappings: DBMapping[],
  computedFields: ComputedField[],
  planType: string
): { consolidated: ConsolidatedField[]; errors: ValidationError[] } => {
  const consolidated: ConsolidatedField[] = [];
  const errors: ValidationError[] = [];

  // Create maps for quick lookup
  const dbMap = new Map<string, string>();
  dbMappings.forEach(mapping => {
    dbMap.set(mapping.field_name.toLowerCase(), mapping.db_column);
  });

  const computedMap = new Map<string, string>();
  computedFields.forEach(field => {
    computedMap.set(field.field_name.toLowerCase(), field.formula);
  });

  // Process each Figma field
  figmaFields.forEach(figmaField => {
    const fieldNameLower = figmaField.field_name.toLowerCase();
    
    // Find DB mapping
    const dbMapping = dbMap.get(fieldNameLower) || '';
    
    // Check if computed
    const formula = computedMap.get(fieldNameLower) || '';
    const isComputed = formula ? 'YES' : 'NO';

    // Validation
    if (!dbMapping) {
      errors.push({
        field_name: figmaField.field_name,
        error_type: 'missing_db_mapping',
        message: `Field "${figmaField.field_name}" does not have a DB mapping`,
      });
    }

    if (isComputed === 'YES' && !formula) {
      errors.push({
        field_name: figmaField.field_name,
        error_type: 'missing_formula',
        message: `Computed field "${figmaField.field_name}" is missing formula`,
      });
    }

    consolidated.push({
      section: figmaField.section,
      subsection: figmaField.subsection,
      field_name: figmaField.field_name,
      order: figmaField.order,
      screen_name: figmaField.screen_name,
      db_mapping: dbMapping,
      is_computed: isComputed as 'YES' | 'NO',
      formula: formula,
      plan_type: planType,
    });
  });

  return { consolidated, errors };
};

export const exportToExcel = (data: ConsolidatedField[]): void => {
  // Dynamic import to avoid bundling issues
  import('xlsx').then(XLSX => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated Fields');
    
    // Auto-size columns
    const maxWidth = 50;
    const cols = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, 10))
    }));
    worksheet['!cols'] = cols;
    
    XLSX.writeFile(workbook, 'consolidated_fields.xlsx');
  });
};