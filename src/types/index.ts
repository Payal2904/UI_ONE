export interface FigmaField {
  section: string;
  subsection: string;
  field_name: string;
  order: number;
  screen_name: string;
}

export interface DBMapping {
  field_name: string;
  db_column: string;
}

export interface ComputedField {
  field_name: string;
  formula: string;
}

export interface ConsolidatedField {
  section: string;
  subsection: string;
  field_name: string;
  order: number;
  screen_name: string;
  db_mapping: string;
  is_computed: 'YES' | 'NO';
  formula: string;
  plan_type: string;
}

export interface ValidationError {
  field_name: string;
  error_type: 'missing_db_mapping' | 'missing_formula';
  message: string;
}