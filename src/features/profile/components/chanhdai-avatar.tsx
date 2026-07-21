import { cn } from "@/lib/cn";

export function ChanhDaiAvatar({
  className,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: "1 / 1" }}
    >
      <iframe
        src="https://iframe.mediadelivery.net/embed/494628/04e7e854-582f-46aa-b328-2f770d406610?autoplay=true&loop=true&muted=true&preload=true&responsive=true"
        loading="lazy"
        style={{
          border: 0,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
      />
    </div>
  );
}
