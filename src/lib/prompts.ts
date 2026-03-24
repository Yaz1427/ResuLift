import type { AnalysisType } from '@/types/analysis'

export function buildAnalysisPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle: string | undefined,
  company: string | undefined,
  analysisType: AnalysisType
): string {
  const basePrompt = `You are an expert ATS (Applicant Tracking System) analyst and professional resume coach with 15+ years of experience. Analyze the resume against the job description and provide a comprehensive, actionable report.

## Job Details
${jobTitle ? `Job Title: ${jobTitle}` : ''}
${company ? `Company: ${company}` : ''}

## Job Description
${jobDescription}

## Resume
${resumeText}

## Your Task
Perform a thorough ATS compatibility analysis. Be specific, honest, and actionable.

### Scoring Weights:
- Keywords Match: 30%
- Skills Alignment: 25%
- Experience Relevance: 20%
- Format & Structure: 15%
- Impact Statements: 10%

### Category Analysis Instructions:
1. **keywordsMatch**: Extract ALL keywords from the JD (hard skills, soft skills, tools, methodologies, certifications). List which are found vs missing in the resume.
2. **formatStructure**: Check for ATS-problematic elements (tables, columns, headers/footers, graphics, unusual fonts, missing sections like summary/experience/education/skills).
3. **experienceRelevance**: Evaluate how well the candidate's experience matches the JD requirements.
4. **skillsAlignment**: Compare technical and soft skills mentioned in JD vs resume.
5. **impactStatements**: Assess quality of bullet points — are they quantified? Do they use strong action verbs? Are they achievement-focused?

### Recommendations:
Generate 5-8 specific, actionable recommendations. Prioritize by impact (high/medium/low).

IMPORTANT: Write ALL text content in French — summaries, feedback, recommendations, titles, descriptions, action items, bullet points, and explanations. Only the JSON keys must stay in English.

You MUST respond with ONLY valid JSON matching this exact schema — no markdown, no explanation, no code blocks, just raw JSON:

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary of the analysis>",
  "categories": {
    "keywordsMatch": {
      "score": <number 0-100>,
      "found": [<array of keyword strings found in resume>],
      "missing": [<array of keyword strings missing from resume>],
      "feedback": "<specific feedback about keyword coverage>"
    },
    "formatStructure": {
      "score": <number 0-100>,
      "found": [<array of good formatting elements detected>],
      "missing": [<array of missing or problematic elements>],
      "feedback": "<specific feedback about ATS format compatibility>"
    },
    "experienceRelevance": {
      "score": <number 0-100>,
      "found": [<array of relevant experience points>],
      "missing": [<array of experience gaps>],
      "feedback": "<specific feedback about experience match>"
    },
    "skillsAlignment": {
      "score": <number 0-100>,
      "found": [<array of matching skills>],
      "missing": [<array of missing required skills>],
      "feedback": "<specific feedback about skills match>"
    },
    "impactStatements": {
      "score": <number 0-100>,
      "found": [<array of strong impact statements or quantified achievements>],
      "missing": [<array of weak bullet points that need improvement>],
      "feedback": "<specific feedback about bullet point quality>"
    }
  },
  "recommendations": [
    {
      "id": "<unique string id>",
      "impact": "<'high' | 'medium' | 'low'>",
      "category": "<category name>",
      "title": "<short recommendation title>",
      "description": "<why this matters>",
      "actionItem": "<specific action to take>"
    }
  ]
}`

  const premiumAddition = `

${analysisType === 'premium' ? `,
  "optimizedBulletPoints": [
    {
      "original": "<original bullet point from resume>",
      "optimized": "<rewritten version with keywords integrated, stronger verbs, quantified if possible>",
      "reasoning": "<brief explanation of changes made>"
    }
  ],
  "missingKeywordsIntegration": [
    {
      "keyword": "<missing keyword>",
      "relevance": "<'critical' | 'important' | 'nice-to-have'>",
      "suggestedPlacement": "<where in the resume to add this>",
      "exampleUsage": "<example sentence showing natural integration>"
    }
  ],
  "profileGapAnalysis": "<2-3 paragraph analysis of the gap between current profile and ideal candidate profile, with specific suggestions to close the gap>"` : ''}

IMPORTANT for Premium: Rewrite ALL bullet points from the Experience section of the resume. Integrate missing keywords naturally. Every rewrite must be stronger, more specific, and more impactful than the original.

Respond with ONLY the JSON object. The JSON must be complete and valid.`

  if (analysisType === 'premium') {
    // Replace last closing brace to add premium fields
    return basePrompt.replace(/\}$/, `${premiumAddition}\n}`)
  }

  return basePrompt
}
