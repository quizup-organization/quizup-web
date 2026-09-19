import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

/** Tuile de statistique — shadcn natif (Card + CardContent). */
interface StatCardProps {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
    return (
        <Card size="sm" className="gap-0 py-4">
            <CardContent className="flex flex-col gap-1 px-4">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="font-heading text-2xl font-bold leading-tight" style={accent ? { color: accent } : undefined}>
                    {value}
                </span>
                {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </CardContent>
        </Card>
    );
}
