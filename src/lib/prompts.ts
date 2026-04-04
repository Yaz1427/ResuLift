import type { AnalysisType, AnalysisResult, SeniorityLevel } from '@/types/analysis'

/**
 * Sanitizes user-supplied text before injecting it into Claude prompts.
 * Prevents prompt injection by stripping control characters and sequences
 * that could override the system instructions.
 */
function sanitizeForPrompt(input: string, maxLength: number): string {
  return input
    // Remove null bytes and other control characters (except \n and \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse more than 3 consecutive newlines to avoid prompt flooding
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove sequences commonly used for prompt injection
    .replace(/\]\s*\[/g, ' ')
    .replace(/#+\s*(system|assistant|user|instruction|ignore|override|prompt)/gi, '')
    .trim()
    .slice(0, maxLength)
}

// Country-specific CV norms (Claude already knows these, but explicit context improves accuracy)
const COUNTRY_NORMS: Record<string, string> = {
  fr: 'France — CV 1-2 pages, photo bienvenue, coordonnées complètes, structure chronologique inversée, compétences linguistiques importantes.',
  be: 'Belgique — similaire France, 1-2 pages, photo recommandée, bilingue FR/NL valorisé.',
  ch: 'Suisse — 1-2 pages, photo standard, multilinguisme très valorisé (FR/DE/EN), très structuré.',
  ca: 'Canada — 1-2 pages, PAS de photo, PAS d\'âge ni date de naissance, bilinguisme FR/EN valorisé.',
  ma: 'Maroc — 1-2 pages, photo courante, trilinguisme AR/FR/EN valorisé.',
  dz: 'Algérie — 1-2 pages, trilinguisme AR/FR/EN attendu.',
  tn: 'Tunisie — 1-2 pages, compétences multilingues valorisées.',
  us: 'United States — Resume 1 page (junior/mid) or 1-2 pages (senior+), NO photo, NO date of birth/age/marital status, focus on quantified results, strong action verbs.',
  gb: 'United Kingdom — CV max 2 pages, no photo, no personal information (age, marital status), focus on achievements.',
  de: 'Deutschland — Lebenslauf 2 Seiten, professionelles Foto obligatorisch, vollständige Personalien, Bildungsabschlüsse sehr wichtig.',
  es: 'España — CV 2 páginas, foto habitual, información personal estándar.',
  ae: 'UAE — 1-2 pages, professional photo recommended, English essential, multinational experience highly valued.',
  sa: 'Saudi Arabia — 2 pages, nationality mentioned, Arabic/English bilingual, professional tone.',
}

const SENIORITY_CONTEXT: Record<SeniorityLevel, string> = {
  intern:  'INTERN/APPRENTICE profile: prioritize academic projects, coursework, extracurriculars, and potential over experience. Be lenient on work experience gaps.',
  junior:  'JUNIOR profile (0-2 years): recent graduate or career starter. Value education, personal projects, and first jobs. Less demanding on years of experience.',
  mid:     'MID-LEVEL profile (2-5 years): concrete domain experience, demonstrated autonomy, visible career progression between positions.',
  senior:  'SENIOR profile (5-10 years): deep technical or functional expertise, technical/functional leadership, measurable impact on significant projects.',
  lead:    'LEAD/EXPERT profile (10+ years): technical/business vision, team mentoring, significant contributions (open source, publications, talks).',
  manager: 'MANAGER/DIRECTOR profile: team management skills, budget ownership, stakeholder relations, measurable business outcomes, strategy.',
}

export function buildAnalysisPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle: string | undefined,
  company: string | undefined,
  analysisType: AnalysisType,
  targetCountry?: string,
  seniorityLevel?: SeniorityLevel
): string {
  // Sanitize all user-controlled inputs before injection into the prompt
  const safeResume      = sanitizeForPrompt(resumeText, 12_000)
  const safeJobDesc     = sanitizeForPrompt(jobDescription, 8_000)
  const safeJobTitle    = jobTitle  ? sanitizeForPrompt(jobTitle, 150)  : undefined
  const safeCompany     = company   ? sanitizeForPrompt(company, 150)   : undefined

  const countryNorm   = targetCountry   ? COUNTRY_NORMS[targetCountry]      : undefined
  const seniorityCtx  = seniorityLevel  ? SENIORITY_CONTEXT[seniorityLevel] : undefined

  const basePrompt = `You are an expert ATS (Applicant Tracking System) analyst and professional resume coach with 15+ years of experience. Analyze the resume against the job description and provide a comprehensive, actionable report.

## Job Details
${safeJobTitle ? `Job Title: ${safeJobTitle}` : ''}
${safeCompany ? `Company: ${safeCompany}` : ''}
${countryNorm  ? `Target Country/Market: ${countryNorm}`  : ''}
${seniorityCtx ? `Seniority Level: ${seniorityCtx}` : ''}

## Job Description
${safeJobDesc}

## Resume
${safeResume}

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

LANGUE: Tu dois écrire TOUT le contenu textuel en français. Sans exception. Les champs "summary", "feedback", "title", "description", "actionItem", "reasoning", "suggestedPlacement", "exampleUsage", "profileGapAnalysis" et tous les éléments des tableaux "found", "missing", "recommendations" doivent être rédigés en français. Seules les clés JSON restent en anglais.

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

export function buildGenerateCVPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle: string | undefined,
  company: string | undefined,
  analysisResult: AnalysisResult,
  language: 'fr' | 'en' | 'unknown' = 'fr'
): string {
  // Sanitize all user-controlled inputs
  const safeResume   = sanitizeForPrompt(resumeText, 12_000)
  const safeJobDesc  = sanitizeForPrompt(jobDescription, 8_000)
  const safeJobTitle = jobTitle ? sanitizeForPrompt(jobTitle, 150) : undefined
  const safeCompany  = company  ? sanitizeForPrompt(company, 150)  : undefined

  const optimizedBullets = analysisResult.optimizedBulletPoints
    ? analysisResult.optimizedBulletPoints.map(b => `ORIGINAL: ${b.original}\nOPTIMIZÉ: ${b.optimized}`).join('\n\n')
    : ''

  const missingKeywords = analysisResult.categories.keywordsMatch.missing.slice(0, 15).join(', ')

  const langRule = language === 'en'
    ? 'Write ALL text content in English. JSON keys stay in English.'
    : 'Écris TOUT le contenu textuel en français. Les clés JSON restent en anglais.'

  return `Tu es un extracteur de données de CV. Restructure le CV original en JSON pour rendu PDF A4 automatique.

## CONTRAINTE — LONGUEUR DES LIGNES
Police proportionnelle : ~75 caractères ≈ 1 ligne affichée.
- Bullet point : 75 CARACTÈRES MAX. UNE ligne. Sois concis.
- Résumé (summary) : 280 caractères MAX.
- Chaque skill : 1-3 mots (ex: "Python", "Deep Learning", "FastAPI")

BON (concis, impactant) :
- "Développé un système IA de supervision pour 15+ automates industriels" (70 chars)
- "Implémenté une API REST FastAPI gérant 10K+ requêtes/seconde" (62 chars)
- "Réduit les temps d'intervention de 40% via optimisation backend" (64 chars)

MAUVAIS (trop long) :
- "Développé un système d'automatisation par IA pour supervision d'automates industriels, intégrant des algorithmes de machine learning..." (>130 chars)

## Poste visé
${safeJobTitle ? `Intitulé : ${safeJobTitle}` : ''}${safeCompany ? `\nEntreprise : ${safeCompany}` : ''}

## Description du poste
${safeJobDesc}

## CV original
${safeResume}

## Bullets optimisés (analyse précédente)
${optimizedBullets || 'Aucun'}

## Mots-clés manquants
${missingKeywords || 'Aucun'}

## Règles
1. GARDE TOUTES les expériences, formations, certifications, langues du CV original — ne supprime rien
2. Chaque bullet : [Verbe d'action] + [quoi] + [impact chiffré si possible] — MAX 75 CARACTÈRES
3. 5 bullets max par expérience — si le CV original en a moins, garde-les tous ; si plus, sélectionne les 5 plus percutants
4. NE JAMAIS inventer de faits, entreprises, dates ou chiffres
5. Compétences : 20 max, triées par pertinence pour le poste
6. ${langRule}
7. Inclus dans "certifications" toutes les certifications et licences professionnelles du CV original
8. Inclus dans "additionalInfo" les récompenses, prix, activités notables, et associations du CV original
9. Vérifie CHAQUE bullet : si >75 caractères → raccourcis au mot complet le plus proche

JSON UNIQUEMENT :

{
  "fullName": "string",
  "title": "string|null (titre professionnel ou poste ciblé, ex: 'Financial Analyst' ou 'Ingénieur Data/IA')",
  "contact": {
    "email": "string|null",
    "phone": "string|null",
    "location": "string|null",
    "linkedin": "string|null",
    "website": "string|null"
  },
  "summary": "string ≤280 chars",
  "experience": [
    {
      "company": "string",
      "position": "string",
      "dates": "string",
      "bullets": ["≤75 chars", "≤75 chars", "max 5 bullets"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "school": "string (avec précisions ex: programme en anglais)",
      "year": "string|null"
    }
  ],
  "skills": ["1-3 mots", "max 20"],
  "certifications": ["string — certification ou licence professionnelle", "null si aucune"],
  "additionalInfo": ["string — prix, récompense, activité notable", "null si aucune"],
  "languages": [
    { "name": "string", "level": "string" }
  ]
}`
}
