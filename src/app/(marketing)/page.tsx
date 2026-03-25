'use client'

import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Upload, FileSearch, Zap, Star, ArrowRight,
  BarChart3, Target, Award, TrendingUp
} from 'lucide-react'
import { useLang } from '@/components/shared/language-provider'
import type { Locale } from '@/lib/i18n'

const content: Record<Locale, {
  badge: string
  hero: string[]
  heroSub: string
  cta1: string
  cta2: string
  heroNote: string
  stats: { value: string; label: string }[]
  howTitle: string
  howSub: string
  steps: { step: string; title: string; description: string }[]
  featuresTitle: string
  featuresSub: string
  features: { title: string; desc: string }[]
  pricingTitle: string
  pricingSub: string
  basicTitle: string
  basicDesc: string
  basicItems: string[]
  basicCta: string
  premiumTitle: string
  premiumDesc: string
  premiumItems: string[]
  premiumCta: string
  popular: string
  oneTime: string
  testimonialsTitle: string
  testimonials: { name: string; role: string; text: string }[]
  faqTitle: string
  faqs: { q: string; a: string }[]
  ctaTitle: string
  ctaSub: string
  ctaBtn: string
}> = {
  fr: {
    badge: 'Propulsé par Claude AI',
    hero: ['Votre CV est bon.', "L'ATS n'est pas d'accord."],
    heroSub: "73% des CV n'atteignent jamais un recruteur humain. ResuLift analyse le vôtre face à l'offre d'emploi et vous dit exactement quoi corriger — en 60 secondes.",
    cta1: 'Analyser mon CV',
    cta2: 'Voir les tarifs',
    heroNote: 'À partir de 5€ · Sans abonnement · Résultats en 60 secondes',
    stats: [
      { value: '73%', label: 'des CV filtrés avant qu\'un humain les lise' },
      { value: '2.3x', label: 'plus de rappels après optimisation' },
      { value: '60s', label: 'pour obtenir une analyse complète' },
      { value: '5K+', label: 'CV analysés' },
    ],
    howTitle: 'Trois étapes, c\'est tout',
    howSub: 'Pas de configuration. Pas d\'attente. Juste des résultats.',
    steps: [
      { step: '01', title: 'Déposez votre CV', description: 'PDF ou DOCX, peu importe. On le lit comme un ATS le ferait.' },
      { step: '02', title: "Collez l'offre d'emploi", description: "Copiez l'offre à laquelle vous postulez. Plus elle est précise, plus l'analyse est fine." },
      { step: '03', title: 'Obtenez votre score', description: "Voyez exactement où vous en êtes — mots-clés manquants, sections faibles, et quoi réécrire en premier." },
    ],
    featuresTitle: 'Pas juste un score — un plan d\'action',
    featuresSub: 'ResuLift vous dit ce qui ne va pas et comment le corriger.',
    features: [
      { title: 'Score ATS', desc: 'Un score de compatibilité 0–100 avec un détail par catégorie' },
      { title: 'Mots-clés manquants', desc: "Les mots exacts que l'ATS cherche — et que vous n'avez pas" },
      { title: 'Points faibles', desc: 'Les réalisations vagues détectées et signalées pour réécriture' },
      { title: 'Réécriture IA', desc: 'Premium : vos bullet points réécrits avec les bons mots-clés intégrés' },
    ],
    pricingTitle: 'Payez une fois. Gardez le rapport pour toujours.',
    pricingSub: 'Sans abonnement. Sans frais récurrents. Vous payez quand vous en avez besoin.',
    basicTitle: 'Basique',
    basicDesc: 'Analyse complète, cap sur la suite',
    basicItems: [
      'Score de compatibilité ATS (0–100)',
      'Analyse des mots-clés',
      'Vérification format & structure',
      'Score de pertinence de l\'expérience',
      'Rapport d\'alignement des compétences',
      'Liste de corrections priorisées',
      'Rapport PDF téléchargeable',
    ],
    basicCta: 'Obtenir l\'analyse Basique — 5€',
    premiumTitle: 'Premium',
    premiumDesc: 'Analyse + réécriture IA, prête à coller',
    premiumItems: [
      'Tout le Basique',
      'Bullet points réécrits par l\'IA avec mots-clés intégrés',
      'Guide d\'insertion des mots-clés manquants',
      'Analyse des lacunes du profil',
      'Évaluation de l\'adéquation culturelle',
      'Support prioritaire',
    ],
    premiumCta: 'Obtenir l\'analyse Premium — 12€',
    popular: 'LE PLUS POPULAIRE',
    oneTime: 'paiement unique',
    testimonialsTitle: 'Ça marche. La preuve.',
    testimonials: [
      { name: 'Sarah K.', role: 'Ingénieure logiciel', text: 'Mon score est passé de 42 à 87 après les corrections suggérées. J\'ai eu 3 appels de recruteurs la semaine suivante.' },
      { name: 'Marcus T.', role: 'Product Manager', text: "La réécriture premium m'a économisé des heures. J'ai juste collé les nouveaux bullets et mon CV ressemble enfin à quelque chose." },
      { name: 'Priya M.', role: 'Data Analyst', text: "Je postulais depuis des mois sans réponse. Il manquait 14 mots-clés que l'ATS cherchait. Une modification, deux entretiens." },
    ],
    faqTitle: 'Questions',
    faqs: [
      { q: "C'est quoi un ATS exactement ?", a: "Un Applicant Tracking System (système de suivi des candidatures) est le logiciel qu'utilisent la plupart des entreprises pour filtrer les CV automatiquement. Il analyse les mots-clés, la mise en forme et la pertinence avant qu'un recruteur ne vous lise. Si vous ne passez pas ce filtre, personne ne vous voit." },
      { q: 'Quels formats de fichiers acceptez-vous ?', a: 'PDF et DOCX, jusqu\'à 5 Mo. Ce sont aussi les formats que les ATS gèrent le mieux.' },
      { q: 'Le score est-il fiable ?', a: "Assez pour que ça compte. On utilise Claude AI pour analyser la densité de mots-clés, la structure et la pertinence — les mêmes signaux que les ATS. Aucun outil n'est un clone parfait de tous les ATS, mais nos recommandations améliorent concrètement les taux de rappel." },
      { q: 'Mon CV est-il en sécurité ?', a: "Oui. Vos fichiers sont chiffrés et stockés en privé — seul vous y avez accès. On ne partage pas, ne vend pas et n'entraîne pas nos modèles sur vos données. Vous pouvez tout supprimer depuis les paramètres." },
      { q: "Basique vs Premium — quelle est la vraie différence ?", a: "Le Basique vous donne le diagnostic complet : score, mots-clés manquants, sections faibles, et quoi corriger. Le Premium va plus loin — Claude réécrit réellement vos bullet points avec les mots-clés manquants intégrés, sans que vous ayez à chercher comment les formuler." },
      { q: "Et si l'analyse échoue ?", a: "Si c'est de notre faute, vous êtes remboursé intégralement — sans question. Comme l'IA génère une analyse unique par soumission, les analyses complétées ne sont pas remboursables." },
    ],
    ctaTitle: 'Arrêtez de deviner.\nCommencez à décrocher des entretiens.',
    ctaSub: 'Une analyse. Un plan d\'action clair. En moins d\'une minute.',
    ctaBtn: 'Analyser mon CV — à partir de 5€',
  },
  en: {
    badge: 'Powered by Claude AI',
    hero: ['Your resume is good.', 'The ATS disagrees.'],
    heroSub: '73% of resumes never reach a human recruiter. ResuLift scores yours against the job description and tells you exactly what to fix — in 60 seconds.',
    cta1: 'Check my resume',
    cta2: 'See pricing',
    heroNote: 'From $5 · No subscription · Results in 60 seconds',
    stats: [
      { value: '73%', label: 'of resumes filtered before a human sees them' },
      { value: '2.3x', label: 'more callbacks after optimization' },
      { value: '60s', label: 'to get a full analysis' },
      { value: '5K+', label: 'resumes analyzed' },
    ],
    howTitle: 'Done in three steps',
    howSub: 'No account setup. No waiting. Just results.',
    steps: [
      { step: '01', title: 'Drop your resume', description: 'PDF or DOCX — whatever you have. We read it the same way an ATS would.' },
      { step: '02', title: 'Paste the job posting', description: "Copy the job description you're applying to. The more specific, the sharper the analysis." },
      { step: '03', title: 'Get your score', description: 'See exactly where you stand — keyword gaps, weak sections, and what to rewrite first.' },
    ],
    featuresTitle: 'Not just a score — a plan',
    featuresSub: "ResuLift tells you what's wrong and how to fix it.",
    features: [
      { title: 'ATS Score', desc: 'A 0–100 compatibility score with a breakdown by category' },
      { title: 'Keyword gaps', desc: "The exact words the ATS is scanning for — that you're missing" },
      { title: 'Weak bullets', desc: 'Vague accomplishments spotted and flagged for rewrite' },
      { title: 'Rewritten copy', desc: 'Premium: your bullet points rewritten with the right keywords built in' },
    ],
    pricingTitle: 'Pay once. Keep the report forever.',
    pricingSub: 'No subscriptions. No recurring charges. You pay when you need it.',
    basicTitle: 'Basic',
    basicDesc: 'Full analysis, clear next steps',
    basicItems: [
      'ATS compatibility score (0–100)',
      'Keyword match analysis',
      'Format & structure check',
      'Experience relevance score',
      'Skills alignment report',
      'Prioritized fix list',
      'Downloadable PDF report',
    ],
    basicCta: 'Get Basic — $5',
    premiumTitle: 'Premium',
    premiumDesc: 'Analysis + AI rewrite, ready to paste',
    premiumItems: [
      'Everything in Basic',
      'AI-rewritten bullet points with keywords integrated',
      'Missing keyword insertion guide',
      'Profile gap analysis',
      'Cultural fit assessment',
      'Priority support',
    ],
    premiumCta: 'Get Premium — $12',
    popular: 'MOST POPULAR',
    oneTime: 'one-time',
    testimonialsTitle: "It works. Here's proof.",
    testimonials: [
      { name: 'Sarah K.', role: 'Software Engineer', text: 'Score went from 42 to 87 after I made the suggested changes. Had 3 recruiter calls the following week.' },
      { name: 'Marcus T.', role: 'Product Manager', text: "The premium rewrite saved me hours. I just pasted the new bullets in and my resume finally reads like I actually did something." },
      { name: 'Priya M.', role: 'Data Analyst', text: "I'd been applying for months with no response. Turns out I was missing 14 keywords the ATS was scanning for. One edit, two interviews." },
    ],
    faqTitle: 'Questions',
    faqs: [
      { q: 'What even is an ATS?', a: "An Applicant Tracking System is the software most companies use to filter resumes automatically. It scans for keywords, formatting, and relevance before a recruiter ever opens your file. If you don't pass it, no human sees you." },
      { q: 'What file formats do you support?', a: 'PDF and DOCX, up to 5MB. Those are also the formats ATS systems handle best.' },
      { q: 'How accurate is the score?', a: "Accurate enough to matter. We use Claude AI to analyze keyword density, structure, and relevance — the same signals ATS systems weight. No tool is a perfect replica of every ATS, but our recommendations have a real track record of improving callback rates." },
      { q: 'Is my resume safe?', a: "Yes. Your files are encrypted and stored privately — only you can access them. We don't share, sell, or train on your data. You can delete everything from settings at any time." },
      { q: "Basic vs Premium — what's the real difference?", a: "Basic gives you the full diagnosis: score, keyword gaps, weak sections, and what to fix. Premium goes further — Claude actually rewrites your bullet points with the missing keywords woven in." },
      { q: 'What if the analysis fails?', a: "If it fails on our end, you get a full refund — no questions asked. Completed analyses aren't refundable." },
    ],
    ctaTitle: 'Stop guessing.\nStart getting callbacks.',
    ctaSub: 'One analysis. One clear action plan. Under a minute.',
    ctaBtn: 'Analyze my resume — from $5',
  },
  ar: {
    badge: 'مدعوم بـ Claude AI',
    hero: ['سيرتك الذاتية جيدة.', 'لكن ATS لا يوافق.'],
    heroSub: '73% من السير الذاتية لا تصل أبدًا إلى مسؤول التوظيف. ResuLift يحلل سيرتك مقابل الوظيفة ويخبرك بالضبط ما يجب تصحيحه — في 60 ثانية.',
    cta1: 'تحليل سيرتي الذاتية',
    cta2: 'الأسعار',
    heroNote: 'ابتداءً من 5€ · بدون اشتراك · نتائج في 60 ثانية',
    stats: [
      { value: '73%', label: 'من السير الذاتية تُفلتر قبل أن يراها أحد' },
      { value: '2.3x', label: 'المزيد من المقابلات بعد التحسين' },
      { value: '60s', label: 'للحصول على تحليل كامل' },
      { value: '5K+', label: 'سيرة ذاتية تم تحليلها' },
    ],
    howTitle: 'ثلاث خطوات فقط',
    howSub: 'لا إعداد. لا انتظار. فقط نتائج.',
    steps: [
      { step: '01', title: 'ارفع سيرتك الذاتية', description: 'PDF أو DOCX — كما هي. نقرأها بنفس طريقة ATS.' },
      { step: '02', title: 'الصق إعلان الوظيفة', description: 'انسخ وصف الوظيفة التي تتقدم إليها. كلما كان أكثر تفصيلاً، كان التحليل أدق.' },
      { step: '03', title: 'احصل على نتيجتك', description: 'اعرف بالضبط أين تقف — الكلمات المفتاحية الناقصة، الأقسام الضعيفة، وما يجب إعادة كتابته أولاً.' },
    ],
    featuresTitle: 'ليس مجرد درجة — بل خطة عمل',
    featuresSub: 'ResuLift يخبرك بما هو خاطئ وكيف تصلحه.',
    features: [
      { title: 'درجة ATS', desc: 'درجة توافق من 0 إلى 100 مع تفصيل حسب الفئة' },
      { title: 'الكلمات المفتاحية الناقصة', desc: 'الكلمات التي يبحث عنها ATS تحديدًا — والتي لا تملكها' },
      { title: 'النقاط الضعيفة', desc: 'الإنجازات الغامضة يتم رصدها وتمييزها لإعادة الكتابة' },
      { title: 'إعادة كتابة بالذكاء الاصطناعي', desc: 'Premium: نقاطك تُعاد كتابتها مع الكلمات المفتاحية الصحيحة' },
    ],
    pricingTitle: 'ادفع مرة واحدة. احتفظ بالتقرير للأبد.',
    pricingSub: 'لا اشتراكات. لا رسوم متكررة. تدفع عند الحاجة.',
    basicTitle: 'أساسي',
    basicDesc: 'تحليل كامل وخطوات واضحة',
    basicItems: [
      'درجة التوافق مع ATS (0–100)',
      'تحليل الكلمات المفتاحية',
      'فحص التنسيق والهيكل',
      'درجة ملاءمة الخبرة',
      'تقرير توافق المهارات',
      'قائمة إصلاحات مرتبة بالأولوية',
      'تقرير PDF قابل للتنزيل',
    ],
    basicCta: 'الحصول على التحليل الأساسي — 5€',
    premiumTitle: 'مميز',
    premiumDesc: 'تحليل + إعادة كتابة بالذكاء الاصطناعي',
    premiumItems: [
      'كل ما في الأساسي',
      'إعادة كتابة النقاط بالذكاء الاصطناعي مع الكلمات المفتاحية',
      'دليل إدراج الكلمات المفتاحية الناقصة',
      'تحليل فجوات الملف الشخصي',
      'تقييم الملاءمة الثقافية',
      'دعم ذو أولوية',
    ],
    premiumCta: 'الحصول على التحليل المميز — 12€',
    popular: 'الأكثر شعبية',
    oneTime: 'دفعة واحدة',
    testimonialsTitle: 'إنه يعمل. والدليل هنا.',
    testimonials: [
      { name: 'سارة ك.', role: 'مهندسة برمجيات', text: 'ارتفع نتيجتي من 42 إلى 87 بعد التعديلات المقترحة. حصلت على 3 مكالمات توظيف الأسبوع التالي.' },
      { name: 'ماركوس ت.', role: 'مدير منتج', text: "وفّرت لي إعادة الكتابة ساعات. لصقت النقاط الجديدة وأصبحت سيرتي الذاتية أخيراً تعكس ما أنجزته فعلاً." },
      { name: 'بريا م.', role: 'محللة بيانات', text: "كنت أتقدم لشهور دون رد. اتضح أنني كنت أفتقد 14 كلمة مفتاحية كان ATS يبحث عنها. تعديل واحد، مقابلتان." },
    ],
    faqTitle: 'أسئلة شائعة',
    faqs: [
      { q: 'ما هو ATS بالضبط؟', a: 'نظام تتبع المتقدمين هو البرنامج الذي تستخدمه معظم الشركات لفلترة السير الذاتية تلقائيًا. يفحص الكلمات المفتاحية والتنسيق والملاءمة قبل أن يفتح المسؤول ملفك. إن لم تجتزه، لن يراك أحد.' },
      { q: 'ما صيغ الملفات المدعومة؟', a: 'PDF وDOCX، حتى 5 ميغابايت. وهي أيضاً الصيغ التي تعمل بشكل أفضل مع أنظمة ATS.' },
      { q: 'ما مدى دقة الدرجة؟', a: 'دقيقة بما يكفي لتحقيق فارق. نستخدم Claude AI لتحليل كثافة الكلمات المفتاحية والهيكل والملاءمة. لا يوجد أداة مثالية لكل ATS، لكن توصياتنا تحسّن معدلات الاستجابة فعليًا.' },
      { q: 'هل سيرتي الذاتية آمنة؟', a: 'نعم. ملفاتك مشفرة ومخزنة بشكل خاص — أنت فقط من يصل إليها. لا نشارك ولا نبيع ولا نستخدم بياناتك للتدريب. يمكنك حذف كل شيء من الإعدادات.' },
      { q: 'ما الفرق الحقيقي بين الأساسي والمميز؟', a: 'الأساسي يعطيك التشخيص الكامل: الدرجة، الكلمات الناقصة، الأقسام الضعيفة. المميز يذهب أبعد — Claude يعيد كتابة نقاطك مع الكلمات المفتاحية الناقصة مدمجة فيها.' },
      { q: 'ماذا لو فشل التحليل؟', a: 'إن فشل من طرفنا، نردّ لك المبلغ كاملاً دون أسئلة. التحليلات المكتملة غير قابلة للاسترداد.' },
    ],
    ctaTitle: 'توقف عن التخمين.\nابدأ في الحصول على مقابلات.',
    ctaSub: 'تحليل واحد. خطة عمل واضحة. في أقل من دقيقة.',
    ctaBtn: 'تحليل سيرتي — ابتداءً من 5€',
  },
}

export default function HomePage() {
  const { locale } = useLang()
  const c = content[locale]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-36 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-background/80 to-background pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-800/60 bg-violet-950/40 px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm text-violet-300 font-medium">{c.badge}</span>
          </div>
          <h1 className="text-5xl md:text-[5.5rem] font-extrabold mb-6 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent leading-[1.05]">
            {c.hero[0]}<br />{c.hero[1]}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            {c.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'bg-violet-600 hover:bg-violet-500 text-white h-12 px-8 text-base border-transparent font-semibold')}>
              {c.cta1} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="#pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 px-8 text-base border-white/10 text-white/70 hover:text-white hover:border-white/20')}>
              {c.cta2}
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground/60 tracking-wide">{c.heroNote}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/40 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {c.stats.map(stat => (
              <div key={stat.value}>
                <div className="text-3xl font-bold text-violet-400 mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">{c.howTitle}</h2>
            <p className="text-muted-foreground text-base">{c.howSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {c.steps.map((item, i) => {
              const icons = [
                <Upload key="u" className="h-6 w-6 text-violet-400" />,
                <FileSearch key="f" className="h-6 w-6 text-violet-400" />,
                <Zap key="z" className="h-6 w-6 text-violet-400" />,
              ]
              return (
                <div key={item.step} className="bg-card border border-border/50 rounded-xl p-6 h-full hover:border-violet-800/50 transition-colors">
                  <div className="text-5xl font-bold text-muted-foreground/20 mb-4 font-mono">{item.step}</div>
                  <div className="mb-3">{icons[i]}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-muted/10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">{c.featuresTitle}</h2>
            <p className="text-muted-foreground text-base">{c.featuresSub}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.features.map((f, i) => {
              const icons = [
                <BarChart3 key="b" className="h-5 w-5" />,
                <Target key="t" className="h-5 w-5" />,
                <TrendingUp key="tr" className="h-5 w-5" />,
                <Award key="a" className="h-5 w-5" />,
              ]
              return (
                <Card key={i} className="border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <div className="text-violet-400 mb-3">{icons[i]}</div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">{c.pricingTitle}</h2>
            <p className="text-muted-foreground text-base">{c.pricingSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">{c.basicTitle}</CardTitle>
                <CardDescription>{c.basicDesc}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">5€</span>
                  <span className="text-muted-foreground ml-2">{c.oneTime}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {c.basicItems.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn(buttonVariants({ variant: 'outline' }), 'w-full mt-4')}>
                  {c.basicCta}
                </Link>
              </CardContent>
            </Card>

            <Card className="border-violet-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                {c.popular}
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{c.premiumTitle}</CardTitle>
                <CardDescription>{c.premiumDesc}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">12€</span>
                  <span className="text-muted-foreground ml-2">{c.oneTime}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {c.premiumItems.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn(buttonVariants(), 'w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
                  {c.premiumCta}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              {locale === 'ar' ? 'قبل وبعد التحسين' : locale === 'en' ? 'Before & After Optimization' : 'Avant / Après l\'optimisation'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {locale === 'ar' ? 'هذا ما يفعله ResuLift بنقاط سيرتك الذاتية' : locale === 'en' ? 'This is what ResuLift does to your resume bullets' : 'Voilà ce que ResuLift fait à vos bullet points'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* BEFORE */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded">
                  {locale === 'ar' ? 'قبل' : locale === 'en' ? 'Before' : 'Avant'}
                </span>
                <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'CV original' : locale === 'en' ? 'Original resume' : 'CV original'}</span>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  locale === 'ar' ? 'عملت في مشاريع عديدة وساعدت الفريق' : locale === 'en' ? 'Worked on various projects and helped the team' : 'A travaillé sur différents projets et aidé l\'équipe',
                  locale === 'ar' ? 'مسؤول عن إدارة المبيعات' : locale === 'en' ? 'Responsible for managing sales' : 'Responsable de la gestion des ventes',
                  locale === 'ar' ? 'حسّن العمليات الداخلية' : locale === 'en' ? 'Improved internal processes' : 'A amélioré les processus internes',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted/50 rounded-full overflow-hidden">
                  <div className="h-2 w-[28%] bg-red-500 rounded-full" />
                </div>
                <span className="text-xs font-bold text-red-400">28/100</span>
              </div>
            </div>

            {/* AFTER */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded">
                  {locale === 'ar' ? 'بعد' : locale === 'en' ? 'After' : 'Après'}
                </span>
                <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'محسّن بالذكاء الاصطناعي' : locale === 'en' ? 'Optimized by AI' : 'Optimisé par l\'IA'}</span>
              </div>
              <ul className="space-y-3 text-sm text-foreground/80">
                {[
                  locale === 'ar' ? 'قاد 3 مشاريع عبر-وظيفية، مما أدى إلى تقليل وقت التسليم بنسبة 30%' : locale === 'en' ? 'Led 3 cross-functional projects, reducing delivery time by 30%' : 'Piloté 3 projets cross-fonctionnels, réduisant le délai de livraison de 30%',
                  locale === 'ar' ? 'حقّق نمواً في الإيرادات بنسبة 45% خلال عام واحد من خلال تحسين مسار التحويل' : locale === 'en' ? 'Drove 45% revenue growth in 12 months by optimizing the sales funnel' : 'Généré +45% de revenus en 12 mois en optimisant le pipeline de ventes',
                  locale === 'ar' ? 'أتمت 8 عمليات يدوية، مما وفّر 15 ساعة أسبوعياً للفريق' : locale === 'en' ? 'Automated 8 manual processes, saving the team 15h/week' : 'Automatisé 8 processus manuels, économisant 15h/semaine à l\'équipe',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted/50 rounded-full overflow-hidden">
                  <div className="h-2 w-[87%] bg-green-500 rounded-full" />
                </div>
                <span className="text-xs font-bold text-green-400">87/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-muted/10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">{c.testimonialsTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {c.testimonials.map(t => (
              <Card key={t.name} className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <Separator className="mb-4" />
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">{c.faqTitle}</h2>
          </div>
          <Accordion className="space-y-2">
            {c.faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50 px-4 rounded-lg border">
                <AccordionTrigger className="text-left hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-950/20 via-background to-background">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 whitespace-pre-line">{c.ctaTitle}</h2>
          <p className="text-muted-foreground text-base mb-10">{c.ctaSub}</p>
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'bg-violet-600 hover:bg-violet-700 text-white h-12 px-10 text-base border-transparent')}>
            {c.ctaBtn} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
