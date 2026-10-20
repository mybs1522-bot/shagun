import { ToggleTheme } from "@/components/toggle-theme";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { USER } from "@/data/user";
import { FlipSentences } from "@/registry/flip-sentences";

import { ChanhDaiAvatar } from "./chanhdai-avatar";
import { ChanhDaiCoverHello } from "./chanhdai-cover-hello";
import { Nav } from "./nav/nav";
import { NavDropdown } from "./nav/nav-dropdown";
import { VerifiedIcon } from "./verified-icon";

export function Header() {
  return (
    <header className="relative mt-2">
      <div className="screen-line-before flex h-12 items-center justify-end gap-4 border-x border-grid px-2">
        <Nav className="max-sm:hidden" />

        <div className="flex items-center gap-2">
          <ToggleTheme />
          <NavDropdown className="sm:hidden" />
        </div>
      </div>

      <ChanhDaiCoverHello />

      <div className="screen-line-after flex border-x border-grid">
        <div className="relative shrink-0 border-r border-grid">
          <div className="mx-[2px] my-[3px]">
            <ChanhDaiAvatar className="size-32 rounded-full ring-1 ring-border ring-offset-2 ring-offset-background sm:size-40" />
          </div>
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex grow"></div>

          <div className="border-t border-grid">
            <h1 className="flex items-center gap-1.5 pl-3 sm:pl-4 pr-2 font-heading text-xl sm:text-2xl md:text-3xl font-medium leading-tight">
              <span className="truncate">{USER.displayName}</span>
              <SimpleTooltip
                content={`Official website of ${USER.displayName}`}
              >
                <span className="inline-flex shrink-0 items-center">
                  <VerifiedIcon className="size-5 sm:size-6 text-[#155dfc] dark:text-[#3b82f6] shrink-0 translate-y-px" />
                </span>
              </SimpleTooltip>
            </h1>

            <div className="h-12 border-t border-grid py-1 pl-3 sm:pl-4 sm:h-auto">
              <FlipSentences sentences={[USER.bio, ...USER.flipSentences]} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
