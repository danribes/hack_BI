// Latest observation values
export interface LatestObservations {
  eGFR?: number;
  eGFR_trend?: 'up' | 'down' | 'stable';
  eGFR_change?: number;
  serum_creatinine?: number;
  uACR?: number;
  proteinuria_category?: 'A1' | 'A2' | 'A3';
  BUN?: number;
  HbA1c?: number;
  blood_pressure?: {
    systolic: number;
    diastolic: number;
    reading: string;
  };
  BMI?: number;
  hemoglobin?: number;
  potassium?: number;
  calcium?: number;
  phosphorus?: number;
  albumin?: number;
  LDL_cholesterol?: number;
  HDL_cholesterol?: number;
}

// Patient data types
export interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  age: number;
  gender: string;
  risk_tier: number;
  latest_eGFR: string;
  latest_uACR: string;
  has_diabetes: boolean;
  has_hypertension: boolean;
  ckd_stage: string;
  // Enhanced fields
  latest_observations?: LatestObservations;
  weight?: number;
  height?: number;
  smoking_status?: string;
  cvd_history?: boolean;
  family_history_esrd?: boolean;
  on_ras_inhibitor?: boolean;
  on_sglt2i?: boolean;
  nephrotoxic_meds?: boolean;
  nephrologist_referral?: boolean;
  diagnosis_date?: string;
  last_visit_date?: string;
  next_visit_date?: string;
}

export interface PatientListResponse {
  status: string;
  data: Patient[];
  count: number;
  timestamp: string;
}

// Risk Assessment types
export interface RiskAssessment {
  risk_score: number;
  risk_level: string;
  risk_tier: number;
  key_findings: string[];
  ckd_analysis: {
    stage: string;
    kidney_function: string;
    albuminuria_level: string;
    progression_risk: string;
  };
  recommendations: {
    immediate_actions: string[];
    follow_up: string[];
    lifestyle_modifications: string[];
    monitoring: string[];
  };
  assessed_at: string;
}

export interface RiskAnalysisResponse {
  status: string;
  data: RiskAssessment;
  timestamp: string;
}
