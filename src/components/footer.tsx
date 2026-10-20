import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="screen-line-before border-x border-grid py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 font-mono text-xs text-muted-foreground">
        <div>
          <span>© {new Date().getFullYear()} Ar. Shagun. All rights reserved.</span>
        </div>

        <div className="group flex items-center gap-1.5 opacity-80 transition-opacity hover:opacity-100 select-none">
          <span className="text-[11px] tracking-tight">built by</span>
          <div className="inline-flex items-center transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/images/connect-light.png"
              alt="Connect"
              width={987}
              height={195}
              unoptimized
              className="h-3.5 w-auto object-contain dark:hidden"
            />
            <Image
              src="/images/connect-dark.png"
              alt="Connect"
              width={987}
              height={195}
              unoptimized
              className="h-3.5 w-auto object-contain hidden dark:block"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/refund-policy"
            className="transition-colors hover:text-foreground underline underline-offset-4"
          >
            Refund Policy
          </Link>
          <span>•</span>
          <a
            href="mailto:hello@archbysha.com"
            className="transition-colors hover:text-foreground"
          >
            hello@archbysha.com
          </a>
        </div>
      </div>
    </footer>
  );
}
