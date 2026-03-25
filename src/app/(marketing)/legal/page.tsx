import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — ResuLift',
  description: "Conditions d'utilisation et politique de confidentialité de ResuLift.",
}

export default function LegalPage() {
  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold mb-12">Mentions légales</h1>

        <div className="space-y-12 text-muted-foreground leading-relaxed">

          {/* Éditeur */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Éditeur du site</h2>
            <p>
              ResuLift est un service en ligne exploité en tant qu&apos;activité indépendante.<br />
              Contact : <a href="mailto:support@resulift.cv" className="text-violet-400 hover:underline">support@resulift.cv</a><br />
              Site web : <a href="https://resulift.cv" className="text-violet-400 hover:underline">https://resulift.cv</a>
            </p>
          </section>

          {/* CGU */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Conditions générales d&apos;utilisation</h2>
            <div className="space-y-4">
              <p><strong className="text-foreground/80">Objet.</strong> ResuLift est un service d&apos;analyse de CV assisté par intelligence artificielle. En utilisant le service, vous acceptez les présentes conditions.</p>
              <p><strong className="text-foreground/80">Utilisation du service.</strong> Le service est destiné à un usage personnel. Toute utilisation commerciale, automatisée ou abusive est interdite. Vous êtes responsable du contenu que vous uploadez (CV, descriptions de poste).</p>
              <p><strong className="text-foreground/80">Paiements.</strong> Les paiements sont traités par Stripe. ResuLift ne stocke aucune donnée bancaire. Les analyses payées ne sont pas remboursables une fois l&apos;analyse générée.</p>
              <p><strong className="text-foreground/80">Disponibilité.</strong> ResuLift s&apos;efforce d&apos;assurer la disponibilité du service mais ne garantit pas une disponibilité ininterrompue. Le service peut être modifié ou interrompu sans préavis.</p>
              <p><strong className="text-foreground/80">Responsabilité.</strong> ResuLift fournit des recommandations à titre indicatif. Les résultats générés par l&apos;IA peuvent contenir des imprécisions. ResuLift ne garantit pas l&apos;obtention d&apos;un emploi suite à l&apos;utilisation du service.</p>
              <p><strong className="text-foreground/80">Propriété intellectuelle.</strong> Le code, le design et les contenus du site sont la propriété de ResuLift. Les analyses générées appartiennent à l&apos;utilisateur.</p>
            </div>
          </section>

          {/* Confidentialité */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Politique de confidentialité</h2>
            <div className="space-y-4">
              <p><strong className="text-foreground/80">Données collectées.</strong> Nous collectons : votre adresse email (via Supabase Auth), les CV et descriptions de poste que vous uploadez, et les résultats d&apos;analyses générés.</p>
              <p><strong className="text-foreground/80">Utilisation des données.</strong> Vos données sont utilisées uniquement pour fournir le service. Vos CV sont transmis à l&apos;API Claude d&apos;Anthropic pour l&apos;analyse et ne sont pas utilisés pour entraîner des modèles.</p>
              <p><strong className="text-foreground/80">Stockage.</strong> Vos fichiers sont stockés sur Supabase Storage (hébergé sur AWS EU-West, Paris). Les données sont chiffrées en transit et au repos.</p>
              <p><strong className="text-foreground/80">Cookies.</strong> ResuLift utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
              <p><strong className="text-foreground/80">Vos droits.</strong> Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Pour exercer ces droits : <a href="mailto:support@resulift.cv" className="text-violet-400 hover:underline">support@resulift.cv</a></p>
              <p><strong className="text-foreground/80">Suppression des données.</strong> Vous pouvez supprimer vos analyses depuis votre tableau de bord. Pour supprimer votre compte et toutes vos données, contactez-nous par email.</p>
              <p><strong className="text-foreground/80">Sous-traitants.</strong> Nous utilisons Supabase (base de données & authentification), Stripe (paiements), Anthropic (IA), et Vercel (hébergement). Ces services disposent de leurs propres politiques de confidentialité.</p>
            </div>
          </section>

          <p className="text-sm text-muted-foreground/60">
            Dernière mise à jour : mars 2026
          </p>
        </div>
      </div>
    </div>
  )
}
