import type { AnalysisType, AnalysisResult, SeniorityLevel } from '@/types/analysis'

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
  const countryNorm   = targetCountry   ? COUNTRY_NORMS[targetCountry]      : undefined
  const seniorityCtx  = seniorityLevel  ? SENIORITY_CONTEXT[seniorityLevel] : undefined

  const basePrompt = `You are an expert ATS (Applicant Tracking System) analyst and professional resume coach with 15+ years of experience. Analyze the resume against the job description and provide a comprehensive, actionable report.

## Job Details
${jobTitle ? `Job Title: ${jobTitle}` : ''}
${company ? `Company: ${company}` : ''}
${countryNorm  ? `Target Country/Market: ${countryNorm}`  : ''}
${seniorityCtx ? `Seniority Level: ${seniorityCtx}` : ''}

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
  analysisResult: AnalysisResult
): string {
  const optimizedBullets = analysisResult.optimizedBulletPoints
    ? analysisResult.optimizedBulletPoints.map(b => `ORIGINAL: ${b.original}\nOPTIMIZÉ: ${b.optimized}`).join('\n\n')
    : ''

  const missingKeywords = analysisResult.categories.keywordsMatch.missing.slice(0, 15).join(', ')

  return `Tu es un expert mondial en rédaction de CV et en optimisation ATS avec 15 ans d'expérience. Tu dois réécrire ce CV pour qu'il soit parfaitement optimisé pour ce poste, tout en étant percutant et professionnel.

## Poste visé
${jobTitle ? `Intitulé : ${jobTitle}` : ''}
${company ? `Entreprise : ${company}` : ''}

## Description du poste
${jobDescription}

## CV original (texte brut)
${resumeText}

## Bullet points déjà réécrits par l'analyse (utilise-les comme base)
${optimizedBullets || 'Aucun fourni — réécrire en te basant sur le CV original'}

## Mots-clés manquants à intégrer naturellement
${missingKeywords || 'Aucun'}

## Tes instructions STRICTES

### Contenu
1. GARDE les faits réels : entreprises, dates, diplômes, noms — NE JAMAIS inventer
2. RÉÉCRIS tous les bullet points avec des verbes d'action forts (Piloté, Développé, Optimisé, Déployé, Augmenté, Conçu, Implémenté, Managé, Réduit, Généré…)
3. QUANTIFIE au maximum : chiffres, pourcentages, volumes, délais, taille d'équipe
4. INTÈGRE les mots-clés manquants de façon naturelle dans les bullet points et le résumé
5. GÉNÈRE un résumé professionnel percutant de 2-3 phrases ciblé sur le poste
6. TRIE les compétences par pertinence pour ce poste (les plus importantes en premier)
7. EXTRAIS TOUTES les infos de contact du CV original (email, téléphone, ville, LinkedIn, site web)
8. EXTRAIS les langues parlées et leur niveau depuis le CV original (ex: Français — Natif, Anglais — Courant C1)
9. TOUT le contenu doit être en français

### Qualité des bullet points — FORMULE OBLIGATOIRE
Chaque bullet DOIT suivre : [Verbe d'action] + [quoi] + [résultat/impact chiffré si possible]
Exemples de qualité attendue :
- "Piloté la migration cloud de 15 micro-services, réduisant les coûts d'infrastructure de 32%"
- "Développé un moteur de recommandation ML augmentant le taux de conversion de 18%"
- "Managé une équipe de 8 développeurs sur un projet générant 2M€ de CA additionnel"
- "Optimisé le pipeline CI/CD réduisant le temps de déploiement de 45min à 8min"

### Contraintes de longueur (CV 1 page)
- Résumé : 2-3 phrases max
- Expérience : 4 postes max (les plus récents/pertinents), 3-4 bullet points par poste
- Chaque bullet point : 20 mots max, UNE SEULE LIGNE
- Formation : 3 entrées max
- Compétences : 12 mots-clés max
- Langues : toutes les langues mentionnées dans le CV original avec leur niveau
Si le contenu original est plus long, sélectionne et condense — ne jamais dépasser ces limites.

Réponds UNIQUEMENT avec du JSON valide correspondant exactement à ce schéma — aucun texte avant ou après :

{
  "fullName": "<nom complet du candidat extrait du CV>",
  "contact": {
    "email": "<email ou null>",
    "phone": "<téléphone ou null>",
    "location": "<ville/région ou null>",
    "linkedin": "<url LinkedIn ou null>",
    "website": "<site web ou null>"
  },
  "summary": "<résumé professionnel percutant de 2-3 phrases intégrant les keywords principaux du poste>",
  "experience": [
    {
      "company": "<nom de l'entreprise>",
      "position": "<intitulé du poste>",
      "dates": "<période ex: Jan 2022 – Déc 2023>",
      "bullets": [
        "<bullet point optimisé — verbe d'action + résultat chiffré>",
        "<bullet point optimisé>",
        "<bullet point optimisé>"
      ]
    }
  ],
  "education": [
    {
      "degree": "<diplôme>",
      "school": "<école/université>",
      "year": "<année d'obtention ou null>"
    }
  ],
  "skills": ["<compétence 1>", "<compétence 2>", "..."],
  "languages": [
    {
      "name": "<langue>",
      "level": "<niveau ex: Natif, Courant (C1), Intermédiaire (B1), Notions (A2)>"
    }
  ]
}`
}
