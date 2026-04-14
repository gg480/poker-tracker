"use client";

import type { Award } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";

interface AwardsProps {
  awards: Award[];
}

export function Awards({ awards }: AwardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {awards.map((award) => (
        <Card key={award.key} className="border-border/50 bg-card/80 backdrop-blur overflow-hidden group hover:border-primary/30 transition-colors">
          <CardContent className="p-5 text-center">
            <div className="text-3xl mb-2">{award.icon}</div>
            <div className="text-sm font-bold text-foreground mb-1">{award.title}</div>
            <div className="text-[11px] text-muted-foreground mb-3">{award.description}</div>
            <div className="py-2 px-3 bg-primary/10 rounded-lg">
              <div className="text-lg font-bold text-primary">{award.winner}</div>
              <div className="text-xs font-mono text-primary/70">{award.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
