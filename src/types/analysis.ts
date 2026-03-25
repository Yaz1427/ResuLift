export type AnalysisType = 'basic' | 'premium'
export type ImpactLevel = 'high' | 'medium' | 'low'

export interface CategoryResult {
  score: number // 0-100
  found: string[]
  missing: string[]
  feedback: string
}

export interface Recommendation {
  id: string
  impact: ImpactLevel
  category: string
  title: string
  description: string
  actionItem: string
}

export interface OptimizedBullet {
  original: string
  optimized: string
  reasoning: string
}

export interface KeywordSuggestion {
  keyword: string
  relevance: 'critical' | 'important' | 'nice-to-have'
  suggestedPlacement: string
  exampleUsage: string
}

export interface AnalysisResult {
  overallScore: number
  categories: {
    keywordsMatch: CategoryResult
    formatStructure: CategoryResult
    experienceRelevance: CategoryResult
    skillsAlignment: CategoryResult
    impactStatements: CategoryResult
  }
  recommendations: Recommendation[]
  summary: string
  // Premium only
  optimizedBulletPoints?: OptimizedBullet[]
  missingKeywordsIntegration?: KeywordSuggestion[]
  profileGapAnalysis?: string
}

export interface AnalysisRequest {
  resumeText: string
  jobDescription: string
  jobTitle?: string
  company?: string
  analysisType: AnalysisType
}

export interface CVContactInfo {
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
}

export interface CVExperience {
  company: string
  position: string
  dates: string
  bullets: string[]
}

export interface CVEducation {
  degree: string
  school: string
  year?: string
}

export interface GeneratedCV {
  fullName: string
  contact: CVContactInfo
  summary: string
  experience: CVExperience[]
  education: CVEducation[]
  skills: string[]
}
