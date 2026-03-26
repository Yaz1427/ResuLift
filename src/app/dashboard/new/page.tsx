'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ResumeUploader } from '@/components/analysis/resume-uploader'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, Zap, FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/components/shared/language-provider'
import { buttonVariants } from '@/lib/button-variants'

type Step = 1 | 2 | 3

export default function NewAnalysisPage() {
  const router = useRouter()
  const { T } = useLang()

  const [step, setStep] = useState<Step>(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [analysisType, setAnalysisType] = useState<'basic' | 'premium'>('basic')
  const [targetCountry, setTargetCountry] = useState('')
  const [seniorityLevel, setSeniorityLevel] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [freeEligible, setFreeEligible] = useState(false)
  const [freeLoading, setFreeLoading] = useState(false)

  useEffect(() => {
    fetch('/api/analysis/free/check')
      .then(r => r.json())
      .then(d => setFreeEligible(d.eligible))
      .catch(() => {})
  }, [])

  async function handleFreeAnalysis() {
    if (!resumeUrl || !jobDescription || !resumeFile) {
      toast.error(T.fillRequired)
      return
    }
    setFreeLoading(true)
    try {
      const res = await fetch('/api/analysis/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType: 'basic',
          resumeUrl,
          resumeFilename: resumeFile.name,
          jobDescription,
          jobTitle: jobTitle || undefined,
          company: company || undefined,
          targetCountry: targetCountry || undefined,
          seniorityLevel: seniorityLevel || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      router.push(`/dashboard/analysis/${data.analysisId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setFreeLoading(false)
    }
  }

  async function uploadResume(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setResumeUrl(data.url)
      toast.success(T.uploadedSuccess)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileAccepted(file: File) {
    setResumeFile(file)
    uploadResume(file)
  }

  async function handleCheckout() {
    if (!resumeUrl || !jobDescription || !resumeFile) {
      toast.error(T.fillRequired)
      return
    }

    setRedirecting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType,
          resumeUrl,
          resumeFilename: resumeFile.name,
          jobDescription,
          jobTitle: jobTitle || undefined,
          company: company || undefined,
          targetCountry: targetCountry || undefined,
          seniorityLevel: seniorityLevel || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')

      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setRedirecting(false)
    }
  }

  const steps = [
    { num: 1, label: T.uploadResume },
    { num: 2, label: T.jobDetails },
    { num: 3, label: T.choosePlan },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">{T.newAnalysisTitle}</h1>
        <p className="text-muted-foreground">{T.newAnalysisSubtitle}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                step > s.num ? 'bg-violet-600 text-white' :
                step === s.num ? 'bg-violet-600 text-white' :
                'bg-muted text-muted-foreground'
              )}>
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span className={cn(
                'text-sm hidden sm:block',
                step >= s.num ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px',
                step > s.num ? 'bg-violet-600' : 'bg-border/50'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Étape 1 */}
      {step === 1 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{T.uploadTitle}</CardTitle>
            <CardDescription>{T.uploadDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResumeUploader onFileAccepted={handleFileAccepted} uploading={uploading} />
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => setStep(2)}
              disabled={!resumeUrl || uploading}
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {T.uploading}</>
              ) : (
                <>{T.continue} <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2 */}
      {step === 2 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{T.jobDescriptionTitle}</CardTitle>
            <CardDescription>{T.jobDescriptionSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">{T.jobTitle} <span className="text-muted-foreground">(facultatif)</span></Label>
                <Input
                  id="jobTitle"
                  placeholder={T.jobTitlePlaceholder}
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{T.company} <span className="text-muted-foreground">(facultatif)</span></Label>
                <Input
                  id="company"
                  placeholder={T.companyPlaceholder}
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetCountry">{T.targetCountry} <span className="text-muted-foreground">(facultatif)</span></Label>
                <select
                  id="targetCountry"
                  value={targetCountry}
                  onChange={e => setTargetCountry(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{T.targetCountryPlaceholder}</option>
                  <option value="fr">🇫🇷 France</option>
                  <option value="be">🇧🇪 Belgique</option>
                  <option value="ch">🇨🇭 Suisse</option>
                  <option value="ca">🇨🇦 Canada</option>
                  <option value="ma">🇲🇦 Maroc</option>
                  <option value="dz">🇩🇿 Algérie</option>
                  <option value="tn">🇹🇳 Tunisie</option>
                  <option value="us">🇺🇸 États-Unis</option>
                  <option value="gb">🇬🇧 Royaume-Uni</option>
                  <option value="de">🇩🇪 Allemagne</option>
                  <option value="es">🇪🇸 Espagne</option>
                  <option value="ae">🇦🇪 Émirats arabes unis</option>
                  <option value="sa">🇸🇦 Arabie saoudite</option>
                </select>
                <p className="text-xs text-muted-foreground">{T.targetCountryHint}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seniorityLevel">{T.seniorityLevel} <span className="text-muted-foreground">(facultatif)</span></Label>
                <select
                  id="seniorityLevel"
                  value={seniorityLevel}
                  onChange={e => setSeniorityLevel(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{T.seniorityPlaceholder}</option>
                  <option value="intern">{T.seniorityIntern}</option>
                  <option value="junior">{T.seniorityJunior}</option>
                  <option value="mid">{T.seniorityMid}</option>
                  <option value="senior">{T.senioritySenior}</option>
                  <option value="lead">{T.seniorityLead}</option>
                  <option value="manager">{T.seniorityManager}</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jd">{T.jobDescriptionLabel}</Label>
              <Textarea
                id="jd"
                placeholder={T.jobDescriptionPlaceholder}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{jobDescription.length} {T.characters}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> {T.back}
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={() => setStep(3)}
                disabled={jobDescription.length < 50}
              >
                {T.continue} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 */}
      {step === 3 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{T.choosePlanTitle}</CardTitle>
            <CardDescription>{T.choosePlanSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Basique */}
              <button
                type="button"
                onClick={() => setAnalysisType('basic')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  analysisType === 'basic' ? 'border-violet-600 bg-violet-600/5' : 'border-border/50 hover:border-violet-600/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileSearch className="h-5 w-5 text-violet-400" />
                  {analysisType === 'basic' && <CheckCircle2 className="h-4 w-4 text-violet-400" />}
                </div>
                <div className="font-semibold mb-1">Basique</div>
                <div className="text-2xl font-bold mb-2">5€</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Score ATS & détail</li>
                  <li>• Analyse des mots-clés</li>
                  <li>• Recommandations</li>
                  <li>• Rapport PDF</li>
                </ul>
              </button>

              {/* Premium */}
              <button
                type="button"
                onClick={() => setAnalysisType('premium')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all relative',
                  analysisType === 'premium' ? 'border-violet-600 bg-violet-600/5' : 'border-border/50 hover:border-violet-600/30'
                )}
              >
                <Badge className="absolute -top-2 -right-2 bg-violet-600 text-white text-xs">Populaire</Badge>
                <div className="flex items-center justify-between mb-2">
                  <Zap className="h-5 w-5 text-violet-400" />
                  {analysisType === 'premium' && <CheckCircle2 className="h-4 w-4 text-violet-400" />}
                </div>
                <div className="font-semibold mb-1">Premium</div>
                <div className="text-2xl font-bold mb-2">12€</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Tout le Basique</li>
                  <li>• Réécriture IA des bullets</li>
                  <li>• Guide d&apos;intégration mots-clés</li>
                  <li>• Analyse des lacunes</li>
                </ul>
              </button>
            </div>

            {freeEligible && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 mb-2">
                <p className="text-sm font-medium text-violet-300 mb-1">🎁 1 analyse gratuite disponible</p>
                <p className="text-xs text-muted-foreground mb-3">Essayez ResuLift gratuitement avec une analyse Basique offerte.</p>
                <button
                  type="button"
                  onClick={handleFreeAnalysis}
                  disabled={freeLoading}
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full border-violet-500/30 text-violet-300 hover:bg-violet-500/10')}
                >
                  {freeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lancement...</> : '🎁 Utiliser mon essai gratuit'}
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> {T.back}
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleCheckout}
                disabled={redirecting}
              >
                {redirecting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {T.redirecting}</>
                ) : (
                  <>{T.payAndAnalyze} <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
