import { useState, useEffect } from 'react';
import { AlertCircle, Users, TrendingUp, AlertTriangle, CheckCircle, Pill } from 'lucide-react';

interface uACRAnalysis {
  current_uacr: number;
  previous_uacr: number;
  percent_change: number;
  current_category: string;
  previous_category: string;
  worsening_level: string;
  date_current: string;
  date_previous: string;
  days_between: number;
}

interface AdherenceAnalysis {
  on_treatment: boolean;
  medication: string | null;
  adherence_status: string | null;
  is_adherent: boolean;
  barriers: string[];
  interventions: string[];
}

interface UACRAlert {
  alert_id: string;
  severity: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  alert_type: string;
  message: string;
  uacr_analysis: uACRAnalysis;
  adherence_analysis: AdherenceAnalysis | null;
  treatment_recommendation: string | null;
  recommended_actions: string[];
  clinical_rationale: string;
  timestamp: string;
}

interface ScanResults {
  scan_date: string;
  total_patients_scanned: number;
  patients_with_worsening: number;
  worsening_percentage: number;
  severity_distribution: {
    CRITICAL: number;
    HIGH: number;
    MODERATE: number;
    LOW: number;
  };
  alert_type_frequency: Record<string, number>;
  alerts: UACRAlert[];
}

const UACRMonitoringDashboard = () => {
  const [results, setResults] = useState<ScanResults | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/uacr-monitoring/scan`);

        if (!response.ok) {
          throw new Error(`Failed to fetch uACR monitoring data: ${response.status}`);
        }

        const data = await response.json();
        setResults(data.data);
        setError(null);
      } catch (err) {
        console.error('Error loading uACR monitoring data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load uACR monitoring data');
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Scanning patients for uACR changes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center text-red-800 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Error Loading uACR Monitoring Data</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const filteredAlerts = selectedSeverity === 'ALL'
    ? results.alerts
    : results.alerts.filter(a => a.severity === selectedSeverity);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MODERATE': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            uACR Monitoring & Treatment Adherence
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
                <p className="text-sm text-gray-600 mb-1">uACR Worsening</p>
                <p className="text-3xl font-bold text-orange-600">
                  {results.patients_with_worsening}
                </p>
                <p className="text-xs text-gray-500">{results.worsening_percentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical</p>
                <p className="text-3xl font-bold text-red-600">
                  {results.severity_distribution.CRITICAL}
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
                  {results.severity_distribution.HIGH}
                </p>
                <p className="text-xs text-gray-500">Within 24-48 hours</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(severity => (
              <button
                key={severity}
                onClick={() => setSelectedSeverity(severity)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSeverity === severity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {severity}
                {severity !== 'ALL' && (
                  <span className="ml-2 text-sm">
                    ({severity === 'CRITICAL' && results.severity_distribution.CRITICAL}
                    {severity === 'HIGH' && results.severity_distribution.HIGH}
                    {severity === 'MODERATE' && results.severity_distribution.MODERATE}
                    {severity === 'LOW' && results.severity_distribution.LOW})
                  </span>
                )}
                {severity === 'ALL' && (
                  <span className="ml-2 text-sm">({results.patients_with_worsening})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Alert List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              uACR Worsening Alerts
              <span className="ml-2 text-sm text-gray-500">
                ({filteredAlerts.length} patients)
              </span>
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No alerts in this category</p>
                <p className="text-sm">All patients are stable or improving</p>
              </div>
            ) : (
              filteredAlerts.slice(0, 20).map(alert => (
                <div
                  key={alert.alert_id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {alert.patient_name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm text-gray-600">
                          {alert.mrn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* uACR Analysis */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">uACR Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Previous:</span>
                        <span className="ml-2 font-medium text-gray-800">
                          {alert.uacr_analysis.previous_uacr.toFixed(0)} mg/g
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-2 font-medium text-gray-800">
                          {alert.uacr_analysis.current_uacr.toFixed(0)} mg/g
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Change:</span>
                        <span className={`ml-2 font-medium ${alert.uacr_analysis.percent_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {alert.uacr_analysis.percent_change > 0 ? '+' : ''}{alert.uacr_analysis.percent_change.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Period:</span>
                        <span className="ml-2 font-medium text-gray-800">
                          {alert.uacr_analysis.days_between} days
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 text-gray-800">
                        {alert.uacr_analysis.previous_category.split('(')[0]} → {alert.uacr_analysis.current_category.split('(')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Adherence Analysis */}
                  {alert.adherence_analysis && alert.adherence_analysis.on_treatment && (
                    <div className="bg-purple-50 rounded-lg p-4 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-900">Treatment Status</span>
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="text-gray-600">Medication:</span>
                          <span className="ml-2 font-medium text-gray-800">
                            {alert.adherence_analysis.medication}
                          </span>
                        </div>
                        <div className="mb-1">
                          <span className="text-gray-600">Adherence:</span>
                          <span className={`ml-2 font-medium ${alert.adherence_analysis.is_adherent ? 'text-green-600' : 'text-red-600'}`}>
                            {alert.adherence_analysis.is_adherent ? '✅ Adherent' : '❌ Non-adherent'}
                          </span>
                        </div>
                        {alert.adherence_analysis.barriers && alert.adherence_analysis.barriers.length > 0 && (
                          <div>
                            <span className="text-gray-600">Barriers:</span>
                            <span className="ml-2 text-gray-800">
                              {alert.adherence_analysis.barriers.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  <div className="space-y-2 mb-3">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Recommended Actions
                    </h4>
                    <div className="space-y-1">
                      {alert.recommended_actions.slice(0, 5).map((action, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-gray-50 rounded p-2 text-gray-700"
                        >
                          {action}
                        </div>
                      ))}
                      {alert.recommended_actions.length > 5 && (
                        <p className="text-sm text-gray-500 pl-2">
                          ... and {alert.recommended_actions.length - 5} more actions
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Clinical Rationale */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Clinical Rationale</h4>
                    <p className="text-sm text-gray-700">{alert.clinical_rationale}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredAlerts.length > 20 && (
            <div className="p-4 text-center text-gray-600 border-t border-gray-200">
              Showing 20 of {filteredAlerts.length} patients
            </div>
          )}
        </div>

        {/* Action Summary */}
        {results.patients_with_worsening > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Summary & Next Steps
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>{results.severity_distribution.CRITICAL} patients</strong> require immediate intervention (today)
              </li>
              <li>
                <strong>{results.severity_distribution.HIGH} patients</strong> need action within 24-48 hours
              </li>
              <li>
                <strong>{results.severity_distribution.MODERATE} patients</strong> should be addressed within 1 week
              </li>
              <li>
                Evidence-based recommendations provided for each patient based on KDIGO guidelines and EMPA-KIDNEY trial criteria
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UACRMonitoringDashboard;
