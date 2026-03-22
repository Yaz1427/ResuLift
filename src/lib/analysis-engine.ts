import Anthropic from '@anthropic-ai/sdk'
import { buildAnalysisPrompt } from './prompts'
import type { AnalysisRequest, AnalysisResult } from '@/types/analysis'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

function calculateWeightedScore(result: AnalysisResult): number {
  const weights = {
    keywordsMatch: 0.30,
    skillsAlignment: 0.25,
    experienceRelevance: 0.20,
    formatStructure: 0.15,
    impactStatements: 0.10,
  }

  return Math.round(
    result.categories.keywordsMatch.score * weights.keywordsMatch +
    result.categories.skillsAlignment.score * weights.skillsAlignment +
    result.categories.experienceRelevance.score * weights.experienceRelevance +
    result.categories.formatStructure.score * weights.formatStructure +
    result.categories.impactStatements.score * weights.impactStatements
  )
}

async function runAnalysis(request: AnalysisRequest, attempt = 1): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(
    request.resumeText,
    request.jobDescription,
    request.jobTitle,
    request.company,
    request.analysisType
  )

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: request.analysisType === 'premium' ? 8000 : 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  // Extract JSON — handle potential trailing text
  const text = content.text.trim()
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found in response')
  }

  const jsonStr = text.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonStr) as AnalysisResult

  // Recalculate weighted score for consistency
  parsed.overallScore = calculateWeightedScore(parsed)

  // Ensure recommendations have IDs
  parsed.recommendations = parsed.recommendations.map((rec, i) => ({
    ...rec,
    id: rec.id ?? `rec-${i}`,
  }))

  return parsed
}

export async function analyzeResume(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    return await runAnalysis(request)
  } catch (error) {
    // Retry once on failure
    if (error instanceof Error && error.message.includes('JSON')) {
      return await runAnalysis(request, 2)
    }
    throw error
  }
}
