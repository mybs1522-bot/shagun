import { Clock } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { Prose } from "@/components/ui/typography";
import { USER } from "@/data/user";

import { Panel, PanelContent, PanelHeader, PanelTitle } from "./panel";

export function About() {
  return (
    <Panel id="about" className="scroll-mt-22">
      <PanelHeader>
        <PanelTitle>About</PanelTitle>
      </PanelHeader>

      <PanelContent>
        <Prose className="prose-p:text-[13px] prose-p:leading-relaxed sm:prose-p:text-sm sm:prose-p:leading-relaxed">
          <Markdown>{USER.about}</Markdown>
        </Prose>

        <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 sm:p-4 transition-colors">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="size-4.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-foreground">
                  Studio Working Hours
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Available for 1-on-1 consultations & architectural reviews
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs sm:self-auto">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-mono font-semibold">{USER.workingHours}</span>
            </div>
          </div>
        </div>
      </PanelContent>
    </Panel>
  );
}
