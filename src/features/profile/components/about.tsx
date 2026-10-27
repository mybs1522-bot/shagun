import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Markdown } from "@/components/markdown";
import { Prose } from "@/components/ui/typography";
import { USER } from "@/data/user";

import { Panel, PanelContent, PanelHeader, PanelTitle } from "./panel";

export function About() {
  return (
    <Panel id="about" className="scroll-mt-22">
      <PanelHeader className="flex items-center justify-between">
        <PanelTitle>About</PanelTitle>
        <Link
          href="/about"
          className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <span>Read more</span>
          <ArrowRight className="size-3" />
        </Link>
      </PanelHeader>

      <PanelContent>
        <Prose className="prose-p:text-[13px] prose-p:leading-snug sm:prose-p:text-sm sm:prose-p:leading-normal">
          <Markdown>{USER.about}</Markdown>
        </Prose>
      </PanelContent>
    </Panel>
  );
}
