import { Link } from "react-router-dom"
import { LegalSection, LegalShell } from "../components/LegalShell"

const UPDATED_AT = "19 octobre 2026"
const CONTACT = "quizup.contacts@gmail.com"

/**
 * Procédure publique de suppression des données.
 * URL utilisée dans Meta App Dashboard > Settings > Basic > User Data Deletion.
 */
export function DataDeletionPage() {
  return (
    <LegalShell title="Suppression de tes données" updatedAt={UPDATED_AT}>
      <p>
        Tu peux demander à tout moment la suppression de ton compte QuizUp et des
        données personnelles associées. Cette page décrit la procédure et ce qui
        est effacé.
      </p>

      <LegalSection title="1. Comment faire la demande">
        <p>
          Envoie un email à{" "}
          <a className="underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          avec :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            l&apos;objet <strong>« Suppression de compte »</strong> ;
          </li>
          <li>
            l&apos;adresse email utilisée pour te connecter à QuizUp (email ou
            compte Google/Facebook associé).
          </li>
        </ul>
        <p>
          Nous pouvons te demander une confirmation depuis cette adresse afin de
          vérifier que la demande provient bien du titulaire du compte.
        </p>
      </LegalSection>

      <LegalSection title="2. Délai de traitement">
        <p>
          Après vérification, nous supprimons le compte et les données associées
          dans un délai maximal de <strong>30 jours</strong>. Tu recevras un
          email de confirmation une fois la suppression effectuée.
        </p>
      </LegalSection>

      <LegalSection title="3. Données supprimées">
        <ul className="list-disc space-y-1 pl-5">
          <li>compte et adresse email ;</li>
          <li>profil (pseudonyme, bio, pays, langue, avatar, bannière) ;</li>
          <li>
            activité de jeu (parties, réponses, scores, expérience, badges,
            titres, historique) ;
          </li>
          <li>
            interactions sociales (abonnements, abonnés, défis, salons,
            notifications) ;
          </li>
          <li>contenus et images que tu as créés, lorsque cela est possible.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Données pouvant être conservées">
        <p>
          Certaines données peuvent être conservées après la suppression du
          compte lorsque la loi l&apos;exige ou pour la constatation, l&apos;exercice
          ou la défense de droits en justice. Les statistiques agrégées et
          anonymisées (classements, compteurs globaux) peuvent également être
          conservées : elles ne permettent plus de t&apos;identifier.
        </p>
      </LegalSection>

      <LegalSection title="5. Comptes Google et Facebook">
        <p>
          La suppression de ton compte QuizUp ne supprime pas ton compte Google
          ou Facebook. Pour révoquer l&apos;accès de QuizUp à ces comptes,
          utilise les paramètres de sécurité du fournisseur concerné :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Google : Compte Google → Sécurité → Applications et services tiers.
          </li>
          <li>
            Facebook : Paramètres → Applications et sites web → QuizUp →
            Supprimer.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Autres droits">
        <p>
          Tu peux également demander l&apos;accès à tes données, leur
          rectification, la limitation du traitement ou leur portabilité en
          écrivant à la même adresse. Plus d&apos;informations dans la{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  )
}
