import { useState, useEffect } from 'react';
import { Patient, PatientListResponse } from '../types';
import EnhancedCKDPatientCard, { EnhancedPatientData } from './EnhancedCKDPatientCard';

interface ScanResult {
  patientId: string;
  patientName: string;
  riskLevel: string;
  riskScore: number;
  riskTier: number;
  needsMonitoring: boolean;
  keyFindings: string[];
}

// Helper function to map risk_tier to risk level
const mapRiskTierToLevel = (tier: number): 'Low' | 'Moderate' | 'High' | 'Critical' => {
  if (tier === 1) return 'Low';
  if (tier === 2) return 'Moderate';
  return 'High';
};

// Helper function to determine CKD stage from stage string
const parseCKDStage = (stage: string): number => {
  const stageNum = parseInt(stage);
  return isNaN(stageNum) ? 0 : stageNum;
};

// Helper function to extract comorbidities
const extractComorbidities = (patient: Patient): string[] => {
  const comorbidities: string[] = [];
  if (patient.has_diabetes) comorbidities.push('Diabetes');
  if (patient.has_hypertension) comorbidities.push('Hypertension');
  return comorbidities;
};

// Transform Patient to EnhancedPatientData
const transformPatientData = (patient: Patient): EnhancedPatientData => {
  const eGFR = parseFloat(patient.latest_eGFR as any);
  const uACR = parseFloat(patient.latest_uACR as any);
  const ckdStage = parseCKDStage(patient.ckd_stage);
  const obs = patient.latest_observations;

  // Calculate BMI if height and weight are available
  const bmi = patient.weight && patient.height
    ? patient.weight / ((patient.height / 100) ** 2)
    : obs?.BMI;

  return {
    id: patient.id,
    name: patient.full_name,
    mrn: patient.medical_record_number,
    age: patient.age,
    gender: patient.gender === 'male' ? 'Male' : 'Female',
    riskLevel: mapRiskTierToLevel(patient.risk_tier),
    ckdStage: ckdStage,
    eGFR: obs?.eGFR ?? eGFR,
    eGFRTrend: obs?.eGFR_trend,
    eGFRChange: obs?.eGFR_change,
    serumCreatinine: obs?.serum_creatinine ?? 0,
    uACR: obs?.uACR ?? uACR,
    proteinuriaCategory: obs?.proteinuria_category,
    bun: obs?.BUN,
    systolicBP: obs?.blood_pressure?.systolic ?? 120,
    diastolicBP: obs?.blood_pressure?.diastolic ?? 80,
    hba1c: obs?.HbA1c,
    ldl: obs?.LDL_cholesterol,
    hdl: obs?.HDL_cholesterol,
    weight: patient.weight,
    height: patient.height,
    bmi: bmi,
    hemoglobin: obs?.hemoglobin,
    potassium: obs?.potassium,
    calcium: obs?.calcium,
    phosphorus: obs?.phosphorus,
    albumin: obs?.albumin,
    comorbidities: extractComorbidities(patient),
    smokingStatus: patient.smoking_status as 'Never' | 'Former' | 'Current' | undefined,
    cvdHistory: patient.cvd_history,
    familyHistoryESRD: patient.family_history_esrd,
    onRASInhibitor: patient.on_ras_inhibitor,
    onSGLT2i: patient.on_sglt2i,
    nephrotoxicMeds: patient.nephrotoxic_meds,
    nephrologistReferral: patient.nephrologist_referral ?? false,
    diagnosisDuration: patient.diagnosis_date
      ? `${Math.floor((new Date().getTime() - new Date(patient.diagnosis_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years`
      : undefined,
    lastVisit: patient.last_visit_date
      ? new Date(patient.last_visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : undefined,
    nextVisit: patient.next_visit_date
      ? new Date(patient.next_visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : undefined,
  };
};

function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/patients`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.status}`);
      }

      const data: PatientListResponse = await response.json();
      setPatients(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const scanDatabase = async () => {
    try {
      setScanning(true);
      setScanResults([]);
      setError(null);

      // Get all patient IDs
      const patientIds = patients.map(p => p.id);

      console.log(`Scanning ${patientIds.length} patients...`);
      console.log('API URL:', apiUrl);

      // Split into batches of 50 (backend limit)
      const BATCH_SIZE = 50;
      const batches: string[][] = [];
      for (let i = 0; i < patientIds.length; i += BATCH_SIZE) {
        batches.push(patientIds.slice(i, i + BATCH_SIZE));
      }

      console.log(`Processing ${batches.length} batches of up to ${BATCH_SIZE} patients each`);

      // Process all batches sequentially
      const allResults: ScanResult[] = [];
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} patients)...`);

        const response = await fetch(`${apiUrl}/api/analyze/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientIds: batch,
            storeResults: true,
            includePatientData: true,
            skipCache: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Error response:', errorData);
          const errorMsg = errorData?.error || `Batch ${i + 1} failed: ${response.status}`;
          throw new Error(errorMsg);
        }

        const batchResult = await response.json();

        // Transform results for this batch
        const batchResults: ScanResult[] = batchResult.results
          .filter((r: any) => r.success && r.analysis)
          .map((r: any) => {
            const patient = patients.find(p => p.id === r.patient_id);
            const analysis = r.analysis;

            return {
              patientId: r.patient_id,
              patientName: patient?.full_name || 'Unknown',
              riskLevel: analysis.risk_level,
              riskScore: analysis.risk_score,
              riskTier: analysis.risk_tier,
              needsMonitoring: analysis.risk_tier >= 2, // Tier 2 and 3 need monitoring
              keyFindings: [
                ...(analysis.key_findings?.abnormal_labs || []),
                ...(analysis.key_findings?.risk_factors || []),
              ].slice(0, 3), // Top 3 findings
            };
          });

        allResults.push(...batchResults);
        console.log(`Batch ${i + 1} complete. Total results so far: ${allResults.length}`);
      }

      console.log(`Scan complete! Analyzed ${allResults.length} patients.`);
      setScanResults(allResults);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan database');
      alert(err instanceof Error ? err.message : 'Failed to scan database');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-center">
          <span className="text-3xl mr-4">❌</span>
          <div>
            <h3 className="text-red-800 font-bold text-lg">Error Loading Patients</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchPatients}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <p className="text-gray-600 text-lg">No patients found in the database</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Patient List ({patients.length})
          </h2>
          <button
            onClick={fetchPatients}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Scan Database Button */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">CKD Risk Screening</h3>
              <p className="text-indigo-100">
                Scan all patients in the database using AI to identify those requiring CKD monitoring
              </p>
            </div>
            <button
              onClick={scanDatabase}
              disabled={scanning || patients.length === 0}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                scanning || patients.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-md hover:shadow-lg'
              }`}
            >
              {scanning ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning Database...
                </span>
              ) : (
                '🔍 Scan Database for CKD Risk'
              )}
            </button>
          </div>
        </div>

        {/* Scan Results */}
        {showResults && scanResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-indigo-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Scan Results - {scanResults.filter(r => r.needsMonitoring).length} Patients Need Monitoring
              </h3>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {scanResults
                .sort((a, b) => b.riskTier - a.riskTier)
                .map((result) => (
                  <div
                    key={result.patientId}
                    className={`p-4 rounded-lg border-2 ${
                      result.riskTier === 3
                        ? 'bg-red-50 border-red-300'
                        : result.riskTier === 2
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {result.patientName}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              result.riskTier === 3
                                ? 'bg-red-600 text-white'
                                : result.riskTier === 2
                                ? 'bg-yellow-600 text-white'
                                : 'bg-green-600 text-white'
                            }`}
                          >
                            {result.riskLevel} Risk - Tier {result.riskTier}
                          </span>
                          {result.needsMonitoring && (
                            <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold">
                              ⚠️ Needs Monitoring
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {(result.riskScore * 100).toFixed(0)}%
                          </span>
                          <span className="text-gray-600">Risk Score</span>
                        </div>
                        {result.keyFindings.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Key Findings:</p>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {result.keyFindings.map((finding, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Summary:</strong> {scanResults.filter(r => r.riskTier === 3).length} high-risk,{' '}
                {scanResults.filter(r => r.riskTier === 2).length} moderate-risk,{' '}
                {scanResults.filter(r => r.riskTier === 1).length} low-risk patients
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Patient List - Enhanced Cards */}
      <div className="space-y-4">
        {patients.map((patient) => (
          <EnhancedCKDPatientCard
            key={patient.id}
            patient={transformPatientData(patient)}
            defaultExpanded={false}
          />
        ))}
      </div>
    </>
  );
}

export default PatientList;
