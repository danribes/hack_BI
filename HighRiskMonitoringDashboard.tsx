import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface Alert {
  severity: string;
  code: string;
  message: string;
  action: string;
}

interface HighRiskPatient {
  patient_id: number;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  stage: number;
  egfr: number;
  egfr_trend: string;
  egfr_change: number;
  comorbidities: string[];
  alerts: Alert[];
  alert_count: number;
  severity_score: number;
  priority: string;
}

interface ScanResults {
  scan_date: string;
  total_patients_scanned: number;
  high_risk_patients: number;
  high_risk_percentage: number;
  priority_distribution: {
    CRITICAL: number;
    HIGH: number;
    MODERATE: number;
  };
  alert_frequency: Record<string, number>;
  patients: HighRiskPatient[];
}

const HighRiskMonitoringDashboard: React.FC = () => {
  const [results, setResults] = useState<ScanResults | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<HighRiskPatient | null>(null);

  useEffect(() => {
    // Load the scan results (in production, this would be an API call)
    fetch('/high_risk_patients.json')
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => console.error('Error loading results:', err));
  }, []);

  if (!results) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading monitoring data...</div>
      </div>
    );
  }

  const filteredPatients = selectedPriority === 'ALL' 
    ? results.patients 
    : results.patients.filter(p => p.priority === selectedPriority);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MODERATE': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-700';
      case 'HIGH': return 'text-orange-700';
      case 'MODERATE': return 'text-yellow-700';
      default: return 'text-green-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            CKD High-Risk Patient Monitoring
          </h1>
          <p className="text-gray-600">
            Last scan: {new Date(results.scan_date).toLocaleString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-800">
                  {results.total_patients_scanned}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">High-Risk</p>
                <p className="text-3xl font-bold text-orange-600">
                  {results.high_risk_patients}
                </p>
                <p className="text-xs text-gray-500">{results.high_risk_percentage}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical</p>
                <p className="text-3xl font-bold text-red-600">
                  {results.priority_distribution.CRITICAL}
                </p>
                <p className="text-xs text-gray-500">Immediate action</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">High Priority</p>
                <p className="text-3xl font-bold text-orange-600">
                  {results.priority_distribution.HIGH}
                </p>
                <p className="text-xs text-gray-500">Within 1-2 weeks</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Priority Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map(priority => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPriority === priority
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {priority}
                {priority !== 'ALL' && (
                  <span className="ml-2 text-sm">
                    ({priority === 'CRITICAL' && results.priority_distribution.CRITICAL}
                    {priority === 'HIGH' && results.priority_distribution.HIGH}
                    {priority === 'MODERATE' && results.priority_distribution.MODERATE})
                  </span>
                )}
                {priority === 'ALL' && (
                  <span className="ml-2 text-sm">({results.high_risk_patients})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Top Clinical Issues */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Clinical Issues</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(results.alert_frequency).slice(0, 10).map(([code, count]) => {
              const codeNames: Record<string, string> = {
                'UNCONTROLLED_HTN': 'Uncontrolled HTN',
                'HYPERPHOSPHATEMIA': 'High Phosphorus',
                'OBESITY': 'Obesity',
                'PROGRESSIVE_CKD': 'Progressive CKD',
                'NEPHROTIC_DECLINE': 'Heavy Proteinuria',
                'UNCONTROLLED_DM': 'Uncontrolled DM',
                'RAPID_DECLINE': 'Rapid Decline',
                'MODERATE_ANEMIA': 'Anemia',
                'NO_RAS_INHIBITOR': 'No RAS Inhibitor',
                'SEVERE_ANEMIA': 'Severe Anemia',
              };
              
              return (
                <div key={code} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                  <p className="text-xs text-gray-600">{codeNames[code] || code}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              High-Risk Patients 
              <span className="ml-2 text-sm text-gray-500">
                ({filteredPatients.length} patients)
              </span>
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredPatients.slice(0, 20).map(patient => (
              <div
                key={patient.patient_id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {patient.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getPriorityColor(patient.priority)}`}>
                        {patient.priority}
                      </span>
                      <span className="text-sm text-gray-600">
                        {patient.mrn}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span>{patient.age}yo {patient.gender}</span>
                      <span>Stage {patient.stage}</span>
                      <span>eGFR: {patient.egfr} mL/min</span>
                      <span className={patient.egfr_trend === 'down' ? 'text-red-600 font-medium' : ''}>
                        {patient.egfr_trend} ({patient.egfr_change > 0 ? '+' : ''}{patient.egfr_change}%)
                      </span>
                    </div>
                    {patient.comorbidities.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {patient.comorbidities.map(condition => (
                          <span
                            key={condition}
                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      {patient.severity_score}
                    </div>
                    <div className="text-xs text-gray-500">severity score</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {patient.alert_count} alerts
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {patient.alerts.slice(0, 3).map((alert, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 p-3 rounded-lg ${
                        alert.severity === 'CRITICAL' ? 'bg-red-50' :
                        alert.severity === 'HIGH' ? 'bg-orange-50' :
                        'bg-yellow-50'
                      }`}
                    >
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          alert.severity === 'CRITICAL' ? 'text-red-800' :
                          alert.severity === 'HIGH' ? 'text-orange-800' :
                          'text-yellow-800'
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          → {alert.action}
                        </p>
                      </div>
                    </div>
                  ))}
                  {patient.alerts.length > 3 && (
                    <p className="text-sm text-gray-500 pl-6">
                      ... and {patient.alerts.length - 3} more alerts
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length > 20 && (
            <div className="p-4 text-center text-gray-600 border-t border-gray-200">
              Showing 20 of {filteredPatients.length} patients
            </div>
          )}
        </div>

        {/* Action Summary */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recommended Actions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>{results.priority_distribution.CRITICAL} patients</strong> require immediate intervention within 24-48 hours</li>
            <li>• <strong>{results.priority_distribution.HIGH} patients</strong> need action within 1-2 weeks</li>
            <li>• Review and optimize antihypertensive therapy for <strong>{results.alert_frequency['UNCONTROLLED_HTN'] || 0} patients</strong></li>
            <li>• Initiate nephrology referral for <strong>{results.alert_frequency['NO_SPECIALIST'] || 0} Stage 4-5 patients</strong></li>
            <li>• Address medication gaps: <strong>{results.alert_frequency['NO_RAS_INHIBITOR'] || 0}</strong> need RAS inhibitors, <strong>{results.alert_frequency['NO_SGLT2I'] || 0}</strong> need SGLT2i</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HighRiskMonitoringDashboard;
