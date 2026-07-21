import Image from "next/image";

import ImgAvatar from "@/../public/images/avatar.jpg";
import { USER } from "@/data/user";
import { cn } from "@/lib/cn";

export function ChanhDaiAvatar({
  className,
  size,
  priority = true,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      className={cn("object-cover", className)}
      alt={`${USER.displayName}'s avatar`}
      src={ImgAvatar}
      width={size}
      height={size}
      placeholder="blur"
      quality={100}
      priority={priority}
    />
  );
}
