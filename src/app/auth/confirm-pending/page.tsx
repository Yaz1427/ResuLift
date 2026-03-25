import Link from 'next/link'
import { FileText, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

export default function ConfirmPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <FileText className="h-7 w-7 text-violet-500" />
            <span className="text-xl font-bold">ResuLift</span>
          </Link>
        </div>

        <Card className="border-border/50 text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Mail className="h-7 w-7 text-violet-400" />
              </div>
            </div>
            <CardTitle>Vérifiez votre email</CardTitle>
            <CardDescription>
              Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si vous ne voyez pas l&apos;email, vérifiez votre dossier spam.
            </p>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
              Aller à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
