import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  Pill,
  Target,
  Users
} from 'lucide-react';

// ============================================
// GCUA Types
// ============================================

export interface GCUAModule1Result {
  name: string;
  fiveYearRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  components: string[];
  interpretation: string;
  cStatistic: number;
}

export interface GCUAModule2Result {
  name: string;
  tenYearRisk: number;
  riskCategory: 'low' | 'borderline' | 'intermediate' | 'high';
  heartAge?: number;
  components: string[];
  interpretation: string;
  cStatistic: number;
}

export interface GCUAModule3Result {
  name: string;
  fiveYearMortalityRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  points: number;
  components: string[];
  interpretation: string;
  competingRiskAdjustment: boolean;
}

export interface GCUATreatmentRecommendations {
  sglt2i: boolean;
  rasInhibitor: boolean;
  statin: boolean;
  bpTarget: string;
  monitoringFrequency: string;
}

export interface GCUAPhenotype {
  type: 'I' | 'II' | 'III' | 'IV';
  name: string;
  tag: string;
  color: 'red' | 'orange' | 'yellow' | 'gray';
  description: string;
  clinicalStrategy: string[];
  treatmentRecommendations: GCUATreatmentRecommendations;
}

export interface GCUAAssessmentData {
  isEligible: boolean;
  eligibilityReason?: string;
  module1: GCUAModule1Result;
  module2: GCUAModule2Result;
  module3: GCUAModule3Result;
  phenotype: GCUAPhenotype;
  benefitRatio: number;
  benefitRatioInterpretation: string;
  dataCompleteness: number;
  missingData: string[];
  confidenceLevel: 'high' | 'moderate' | 'low';
  kdigoScreeningRecommendation: string;
  cystatinCRecommended: boolean;
  assessedAt: string;
}

interface GCUARiskCardProps {
  assessment: GCUAAssessmentData | null;
  loading?: boolean;
  onCalculate?: () => void;
  isEligible?: boolean;
  eligibilityReason?: string;
}

// ============================================
// Utility Functions
// ============================================

function getPhenotypeColors(color: string) {
  switch (color) {
    case 'red':
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800',
        icon: 'text-red-600'
      };
    case 'orange':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-800',
        icon: 'text-orange-600'
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: 'text-yellow-600'
      };
    case 'gray':
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-600',
        badge: 'bg-gray-200 text-gray-700',
        icon: 'text-gray-500'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700',
        icon: 'text-gray-500'
      };
  }
}

function getRiskColor(category: string) {
  switch (category) {
    case 'very_high':
    case 'high':
      return 'text-red-600';
    case 'intermediate':
    case 'moderate':
      return 'text-orange-600';
    case 'borderline':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

function getConfidenceIcon(level: string) {
  switch (level) {
    case 'high':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'moderate':
      return <Info className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}

// ============================================
// Component
// ============================================

export const GCUARiskCard: React.FC<GCUARiskCardProps> = ({
  assessment,
  loading,
  onCalculate,
  isEligible,
  eligibilityReason
}) => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [showAllStrategies, setShowAllStrategies] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Not eligible state
  if (isEligible === false && !assessment) {
    return (
      <div className="bg-gray-50 rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <Users className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700">GCUA Risk Assessment</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {eligibilityReason || 'Patient is not eligible for GCUA assessment.'}
        </p>
        <p className="text-xs text-gray-500">
          GCUA is designed for adults 60+ with eGFR &gt; 60. For established CKD, use KDIGO staging.
        </p>
      </div>
    );
  }

  // No assessment yet
  if (!assessment) {
    return (
      <div className="bg-blue-50 rounded-lg shadow p-6 mb-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-blue-700">GCUA Risk Assessment</h3>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          No GCUA assessment available. Calculate comprehensive cardiorenal risk for this patient.
        </p>
        {onCalculate && (
          <button
            onClick={onCalculate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Calculate GCUA Risk
          </button>
        )}
      </div>
    );
  }

  // Not eligible (from assessment)
  if (!assessment.isEligible) {
    return (
      <div className="bg-gray-50 rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <Users className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700">GCUA Risk Assessment</h3>
        </div>
        <p className="text-sm text-gray-600">
          {assessment.eligibilityReason || 'Patient is not eligible for GCUA assessment.'}
        </p>
      </div>
    );
  }

  const { phenotype, module1, module2, module3 } = assessment;
  const colors = getPhenotypeColors(phenotype.color);

  return (
    <div className={`${colors.bg} rounded-lg shadow-lg border ${colors.border} mb-6 overflow-hidden`}>
      {/* Header with Phenotype */}
      <div className={`px-6 py-4 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.badge}`}>
              {phenotype.type === 'I' && <AlertTriangle className="h-6 w-6" />}
              {phenotype.type === 'II' && <Activity className="h-6 w-6" />}
              {phenotype.type === 'III' && <Heart className="h-6 w-6" />}
              {phenotype.type === 'IV' && <Brain className="h-6 w-6" />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${colors.text}`}>
                Phenotype {phenotype.type}: {phenotype.name}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                {phenotype.tag}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {getConfidenceIcon(assessment.confidenceLevel)}
            <span className="capitalize">{assessment.confidenceLevel} Confidence</span>
          </div>
        </div>
        <p className={`mt-3 text-sm ${colors.text}`}>{phenotype.description}</p>
      </div>

      {/* Risk Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
        {/* Module 1: Renal Risk */}
        <div
          className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setExpandedModule(expandedModule === 'module1' ? null : 'module1')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Renal Risk</span>
            </div>
            {expandedModule === 'module1' ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className={`text-3xl font-bold ${getRiskColor(module1.riskCategory)}`}>
            {module1.fiveYearRisk}%
          </div>
          <div className="text-xs text-gray-500">5-Year Incident CKD Risk</div>
          <div className={`text-xs mt-1 capitalize ${getRiskColor(module1.riskCategory)}`}>
            {module1.riskCategory.replace('_', ' ')} Risk
          </div>
          {expandedModule === 'module1' && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">Nelson/CKD-PC (2019)</p>
              <p className="text-gray-500">C-statistic: {module1.cStatistic}</p>
              <p className="mt-2">{module1.interpretation}</p>
              <div className="mt-2">
                <p className="font-medium text-gray-700 mb-1">Risk Factors:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {module1.components.slice(0, 5).map((comp, i) => (
                    <li key={i} className="text-gray-600">{comp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: CVD Risk */}
        <div
          className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setExpandedModule(expandedModule === 'module2' ? null : 'module2')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-gray-700">CVD Risk</span>
            </div>
            {expandedModule === 'module2' ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className={`text-3xl font-bold ${getRiskColor(module2.riskCategory)}`}>
            {module2.tenYearRisk}%
          </div>
          <div className="text-xs text-gray-500">10-Year CVD Event Risk</div>
          <div className={`text-xs mt-1 capitalize ${getRiskColor(module2.riskCategory)}`}>
            {module2.riskCategory} Risk
          </div>
          {module2.heartAge && (
            <div className="text-xs text-gray-500 mt-1">
              Heart Age: {module2.heartAge} years
            </div>
          )}
          {expandedModule === 'module2' && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">AHA PREVENT (2024)</p>
              <p className="text-gray-500">C-statistic: {module2.cStatistic}</p>
              <p className="mt-2">{module2.interpretation}</p>
              <div className="mt-2">
                <p className="font-medium text-gray-700 mb-1">Risk Factors:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {module2.components.slice(0, 5).map((comp, i) => (
                    <li key={i} className="text-gray-600">{comp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Module 3: Mortality Risk */}
        <div
          className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setExpandedModule(expandedModule === 'module3' ? null : 'module3')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Mortality</span>
            </div>
            {expandedModule === 'module3' ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className={`text-3xl font-bold ${getRiskColor(module3.riskCategory)}`}>
            {module3.fiveYearMortalityRisk}%
          </div>
          <div className="text-xs text-gray-500">5-Year Mortality Risk</div>
          <div className={`text-xs mt-1 capitalize ${getRiskColor(module3.riskCategory)}`}>
            {module3.riskCategory.replace('_', ' ')} (Competing Risk)
          </div>
          {expandedModule === 'module3' && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">Bansal Geriatric Score (2015)</p>
              <p className="text-gray-500">Points: {module3.points}</p>
              <p className="mt-2">{module3.interpretation}</p>
              <div className="mt-2">
                <p className="font-medium text-gray-700 mb-1">Contributing Factors:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {module3.components.slice(0, 5).map((comp, i) => (
                    <li key={i} className="text-gray-600">{comp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefit Ratio */}
      <div className="px-6 pb-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-700">Benefit Ratio: {assessment.benefitRatio}</span>
          </div>
          <p className="text-sm text-gray-600">{assessment.benefitRatioInterpretation}</p>
        </div>
      </div>

      {/* Treatment Recommendations */}
      <div className={`px-6 pb-4 border-t ${colors.border} pt-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Pill className={`h-5 w-5 ${colors.icon}`} />
          <h4 className={`font-semibold ${colors.text}`}>Treatment Recommendations</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className={`p-2 rounded-lg text-center ${phenotype.treatmentRecommendations.sglt2i ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            <div className="text-xs font-medium">SGLT2i</div>
            <div className="text-lg">{phenotype.treatmentRecommendations.sglt2i ? <CheckCircle className="h-5 w-5 mx-auto" /> : '-'}</div>
          </div>
          <div className={`p-2 rounded-lg text-center ${phenotype.treatmentRecommendations.rasInhibitor ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            <div className="text-xs font-medium">RAS Inhibitor</div>
            <div className="text-lg">{phenotype.treatmentRecommendations.rasInhibitor ? <CheckCircle className="h-5 w-5 mx-auto" /> : '-'}</div>
          </div>
          <div className={`p-2 rounded-lg text-center ${phenotype.treatmentRecommendations.statin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            <div className="text-xs font-medium">Statin</div>
            <div className="text-lg">{phenotype.treatmentRecommendations.statin ? <CheckCircle className="h-5 w-5 mx-auto" /> : '-'}</div>
          </div>
          <div className="p-2 rounded-lg text-center bg-blue-50 text-blue-800">
            <div className="text-xs font-medium">BP Target</div>
            <div className="text-xs mt-1">{phenotype.treatmentRecommendations.bpTarget}</div>
          </div>
          <div className="p-2 rounded-lg text-center bg-blue-50 text-blue-800">
            <div className="text-xs font-medium">Monitoring</div>
            <div className="text-xs mt-1">{phenotype.treatmentRecommendations.monitoringFrequency}</div>
          </div>
        </div>

        {/* Clinical Strategy */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-700">Clinical Strategy</h5>
            {phenotype.clinicalStrategy.length > 3 && (
              <button
                onClick={() => setShowAllStrategies(!showAllStrategies)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showAllStrategies ? 'Show less' : `Show all (${phenotype.clinicalStrategy.length})`}
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {(showAllStrategies ? phenotype.clinicalStrategy : phenotype.clinicalStrategy.slice(0, 3)).map((strategy, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className={`h-4 w-4 mt-0.5 ${colors.icon} flex-shrink-0`} />
                {strategy}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Data Quality & KDIGO */}
      <div className={`px-6 py-3 border-t ${colors.border} bg-white/50 flex flex-wrap items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            Data: {assessment.dataCompleteness}% complete
          </span>
          {assessment.missingData.length > 0 && (
            <span className="text-orange-600">
              Missing: {assessment.missingData.slice(0, 2).join(', ')}
              {assessment.missingData.length > 2 && ` +${assessment.missingData.length - 2}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {assessment.cystatinCRecommended && (
            <span className="text-blue-600 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Consider Cystatin C
            </span>
          )}
          <span className="text-gray-400">
            Assessed: {new Date(assessment.assessedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* KDIGO Screening Recommendation */}
      <div className={`px-6 py-3 border-t ${colors.border} bg-gray-50`}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{assessment.kdigoScreeningRecommendation}</span>
        </div>
      </div>
    </div>
  );
};

export default GCUARiskCard;
