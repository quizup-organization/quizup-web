import { PageContainer } from "@/features/shell/components/PageContainer";
import { Card } from "@/components/ui/card";
import { ToBuildTag } from "@/components/to-build-tag";

/** Écran d'attente pour les surfaces prévues dans un lot ultérieur. */
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageContainer>
      <Card className="items-center gap-3 py-14 text-center">
        <div className="text-2xl">{title}</div>
        <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <ToBuildTag />
      </Card>
    </PageContainer>
  );
}
