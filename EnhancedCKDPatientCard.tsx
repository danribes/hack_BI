import React, { useState } from 'react';
import { AlertCircle, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface PatientData {
  name: string;
  mrn: string;
  age: number;
  gender: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  
  // Kidney Function
  ckdStage: number; // 0 = No CKD, 1-5 = CKD stages
  eGFR: number;
  eGFRTrend: 'up' | 'down' | 'stable';
  eGFRChange: number; // percentage change
  serumCreatinine: number;
  uACR: number;
  proteinuriaCategory: 'A1' | 'A2' | 'A3';
  bun: number;
  
  // Cardiovascular & Metabolic
  systolicBP: number;
  diastolicBP: number;
  hba1c?: number;
  ldl?: number;
  hdl?: number;
  
  // Anthropometric
  weight: number; // kg
  height: number; // cm
  bmi: number;
  
  // Hematology & Minerals
  hemoglobin: number;
  potassium: number;
  calcium: number;
  phosphorus: number;
  albumin: number;
  
  // Comorbidities
  comorbidities: string[];
  smokingStatus: 'Never' | 'Former' | 'Current';
  cvdHistory: boolean;
  familyHistoryESRD: boolean;
  
  // Medications & Management
  onRASInhibitor: boolean;
  onSGLT2i: boolean;
  nephrotoxicMeds: boolean;
  nephrologistReferral: boolean;
  
  // Clinical Tracking
  diagnosisDuration: string; // e.g., "2.5 years"
  lastVisit: string;
  nextVisit: string;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const colors = {
    Low: 'bg-green-100 text-green-800 border-green-300',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Critical: 'bg-red-100 text-red-800 border-red-300'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[risk as keyof typeof colors]}`}>
      {risk} Risk
    </span>
  );
};

const StageBadge = ({ stage }: { stage: number }) => {
  if (stage === 0) {
    return (
      <span className="bg-green-600 text-white px-3 py-1 rounded-md font-bold text-sm">
        No CKD
      </span>
    );
  }
  
  const colors = ['bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
  return (
    <span className={`${colors[stage - 1]} text-white px-3 py-1 rounded-md font-bold text-sm`}>
      Stage {stage}
    </span>
  );
};

const AlertBadge = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-semibold">
    <AlertCircle className="w-3 h-3" />
    {text}
  </div>
);

const MedBadge = ({ active, label }: { active: boolean; label: string }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
    active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
  }`}>
    {label}
  </span>
);

const EnhancedCKDPatientCard: React.FC<{ patient: PatientData }> = ({ patient }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Determine if values are out of normal range
  const isHighPotassium = patient.potassium > 5.5;
  const isLowHemoglobin = patient.hemoglobin < 11;
  const isHighBP = patient.systolicBP > 140 || patient.diastolicBP > 90;
  const isHighPhosphorus = patient.phosphorus > 4.5 && patient.ckdStage >= 3;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-6 max-w-4xl">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{patient.name}</h2>
          <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
        </div>
        <RiskBadge risk={patient.riskLevel} />
      </div>
      
      {/* Demographics & Primary Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase">Age / Gender</p>
          <p className="text-lg font-semibold">{patient.age} / {patient.gender}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">CKD Stage</p>
          <StageBadge stage={patient.ckdStage} />
        </div>
      </div>
      
      {/* Anthropometric Measurements - Critical for Monitoring */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg mb-4 border border-indigo-200">
        <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase">Anthropometric Measurements</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 font-medium">Weight</p>
            <p className="text-xl font-bold text-gray-800">{patient.weight} kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Height</p>
            <p className="text-xl font-bold text-gray-800">{patient.height} cm</p>
          </div>
          <div className={`${patient.bmi >= 30 ? 'text-orange-800' : patient.bmi >= 25 ? 'text-yellow-800' : 'text-green-800'}`}>
            <p className="text-xs font-medium">BMI</p>
            <p className="text-xl font-bold">{patient.bmi}</p>
            <p className="text-xs">
              {patient.bmi >= 30 ? 'Obese' : patient.bmi >= 25 ? 'Overweight' : 'Normal'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Key Clinical Values - Always Visible */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">eGFR</p>
            <div className="flex items-center gap-1">
              <TrendIcon trend={patient.eGFRTrend} />
              <span className="text-xs text-gray-500">{patient.eGFRChange > 0 ? '+' : ''}{patient.eGFRChange}%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{patient.eGFR}</p>
          <p className="text-xs text-gray-500">mL/min/1.73m²</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">uACR</p>
          <p className="text-2xl font-bold text-gray-800">{patient.uACR}</p>
          <p className="text-xs text-gray-500">mg/g ({patient.proteinuriaCategory})</p>
        </div>
        
        <div className={`p-3 rounded-lg ${isHighBP ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">Blood Pressure</p>
            {isHighBP && <AlertCircle className="w-4 h-4 text-red-600" />}
          </div>
          <p className="text-2xl font-bold text-gray-800">{patient.systolicBP}/{patient.diastolicBP}</p>
          <p className="text-xs text-gray-500">mmHg</p>
        </div>
      </div>
      
      {/* Alerts Row */}
      {(isHighPotassium || isLowHemoglobin || patient.nephrotoxicMeds || isHighPhosphorus) && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          {isHighPotassium && <AlertBadge text={`High K+ (${patient.potassium})`} />}
          {isLowHemoglobin && <AlertBadge text={`Anemia (Hb ${patient.hemoglobin})`} />}
          {isHighPhosphorus && <AlertBadge text={`High Phosphorus`} />}
          {patient.nephrotoxicMeds && <AlertBadge text="Nephrotoxic Meds" />}
        </div>
      )}
      
      {/* Comorbidities */}
      <div className="flex flex-wrap gap-2 mb-4">
        {patient.comorbidities.map((condition) => (
          <span key={condition} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            {condition}
          </span>
        ))}
        {patient.cvdHistory && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            CVD History
          </span>
        )}
        {patient.smokingStatus === 'Current' && (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            Current Smoker
          </span>
        )}
      </div>
      
      {/* Medication Status */}
      <div className="flex gap-2 mb-4">
        <MedBadge active={patient.onRASInhibitor} label="RAS Inhibitor" />
        <MedBadge active={patient.onSGLT2i} label="SGLT2i" />
        {!patient.nephrologistReferral && patient.ckdStage >= 4 && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-semibold">
            ⚠️ Nephrology Referral Needed
          </span>
        )}
      </div>
      
      {/* Expandable Detailed Section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm mb-2"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? 'Show Less' : 'Show Detailed Labs & Metrics'}
      </button>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Lab Values Grid */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Laboratory Values</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Creatinine</p>
                <p className="text-lg font-bold">{patient.serumCreatinine}</p>
                <p className="text-xs text-gray-500">mg/dL</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">BUN</p>
                <p className="text-lg font-bold">{patient.bun}</p>
                <p className="text-xs text-gray-500">mg/dL</p>
              </div>
              
              <div className={`p-3 rounded ${isLowHemoglobin ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-600">Hemoglobin</p>
                <p className="text-lg font-bold">{patient.hemoglobin}</p>
                <p className="text-xs text-gray-500">g/dL</p>
              </div>
              
              <div className={`p-3 rounded ${isHighPotassium ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-600">Potassium</p>
                <p className="text-lg font-bold">{patient.potassium}</p>
                <p className="text-xs text-gray-500">mEq/L</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Calcium</p>
                <p className="text-lg font-bold">{patient.calcium}</p>
                <p className="text-xs text-gray-500">mg/dL</p>
              </div>
              
              <div className={`p-3 rounded ${isHighPhosphorus ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-600">Phosphorus</p>
                <p className="text-lg font-bold">{patient.phosphorus}</p>
                <p className="text-xs text-gray-500">mg/dL</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Albumin</p>
                <p className="text-lg font-bold">{patient.albumin}</p>
                <p className="text-xs text-gray-500">g/dL</p>
              </div>
            </div>
          </div>
          
          {/* Metabolic Panel */}
          {patient.hba1c && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Metabolic & Cardiovascular</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">HbA1c</p>
                  <p className="text-lg font-bold">{patient.hba1c}%</p>
                </div>
                
                {patient.ldl && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">LDL</p>
                    <p className="text-lg font-bold">{patient.ldl}</p>
                    <p className="text-xs text-gray-500">mg/dL</p>
                  </div>
                )}
                
                {patient.hdl && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">HDL</p>
                    <p className="text-lg font-bold">{patient.hdl}</p>
                    <p className="text-xs text-gray-500">mg/dL</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Clinical Timeline */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Clinical Timeline</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Duration Since Diagnosis</p>
                <p className="text-sm font-bold">{patient.diagnosisDuration}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Last Visit</p>
                <p className="text-sm font-bold">{patient.lastVisit}</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-gray-600">Next Visit</p>
                <p className="text-sm font-bold">{patient.nextVisit}</p>
              </div>
            </div>
          </div>
          
          {/* Risk Factors */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Additional Risk Factors</h3>
            <div className="flex flex-wrap gap-2">
              {patient.familyHistoryESRD && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium">
                  Family History of ESRD
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">
                Smoking: {patient.smokingStatus}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer - Last Updated */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-right">
        Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

// Example usage with sample data
const SamplePatientCard = () => {
  const samplePatient: PatientData = {
    name: "John Anderson",
    mrn: "MRN001",
    age: 67,
    gender: "Male",
    riskLevel: "High",
    ckdStage: 4,
    eGFR: 28.50,
    eGFRTrend: "down",
    eGFRChange: -8.5,
    serumCreatinine: 2.4,
    uACR: 450.00,
    proteinuriaCategory: "A3",
    bun: 45,
    systolicBP: 152,
    diastolicBP: 94,
    hba1c: 7.8,
    ldl: 142,
    hdl: 38,
    weight: 92.5,
    height: 172,
    bmi: 31.2,
    hemoglobin: 10.2,
    potassium: 5.8,
    calcium: 8.9,
    phosphorus: 5.2,
    albumin: 3.2,
    comorbidities: ["Diabetes", "Hypertension"],
    smokingStatus: "Former",
    cvdHistory: true,
    familyHistoryESRD: false,
    onRASInhibitor: true,
    onSGLT2i: false,
    nephrotoxicMeds: true,
    nephrologistReferral: false,
    diagnosisDuration: "3.5 years",
    lastVisit: "Oct 15, 2025",
    nextVisit: "Nov 28, 2025"
  };
  
  // Example patient with No CKD (Stage 0)
  const noCKDPatient: PatientData = {
    name: "Maria Rodriguez",
    mrn: "MRN002",
    age: 52,
    gender: "Female",
    riskLevel: "Low",
    ckdStage: 0, // No CKD
    eGFR: 95.00,
    eGFRTrend: "stable",
    eGFRChange: 0.5,
    serumCreatinine: 0.9,
    uACR: 15.00,
    proteinuriaCategory: "A1",
    bun: 18,
    systolicBP: 122,
    diastolicBP: 78,
    hba1c: 5.4,
    ldl: 105,
    hdl: 58,
    weight: 68.5,
    height: 165,
    bmi: 25.2,
    hemoglobin: 13.5,
    potassium: 4.2,
    calcium: 9.4,
    phosphorus: 3.5,
    albumin: 4.1,
    comorbidities: ["Hypertension"],
    smokingStatus: "Never",
    cvdHistory: false,
    familyHistoryESRD: false,
    onRASInhibitor: true,
    onSGLT2i: false,
    nephrotoxicMeds: false,
    nephrologistReferral: false,
    diagnosisDuration: "N/A",
    lastVisit: "Oct 28, 2025",
    nextVisit: "Apr 28, 2026"
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">CKD Risk Assessment - Patient Cards</h1>
        
        {/* High Risk CKD Stage 4 Patient */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Example 1: High Risk Patient (Stage 4 CKD)</h2>
          <EnhancedCKDPatientCard patient={samplePatient} />
        </div>
        
        {/* No CKD Patient (Monitoring Only) */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Example 2: No CKD Diagnosis (Preventive Monitoring)</h2>
          <EnhancedCKDPatientCard patient={noCKDPatient} />
        </div>
      </div>
    </div>
  );
};

export default SamplePatientCard;
