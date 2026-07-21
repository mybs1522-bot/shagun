import { cn } from "@/lib/cn";

export function ChanhDaiCoverHello() {
  return (
      <div
        className={cn(
          "relative border-x border-grid select-none overflow-hidden",
          "screen-line-before screen-line-after before:-top-px after:-bottom-px"
        )}
      >
        {/* Video aspect ratio: 2992x692 = 23.13% */}
        <div style={{ position: "relative", paddingTop: "23.13%" }}>
          <iframe
            src="https://iframe.mediadelivery.net/embed/494628/f357bc04-9b65-4bbf-97f0-0a5c4c78c8e3?autoplay=true&loop=true&muted=true&preload=true&responsive=true"
            loading="lazy"
            style={{
              border: 0,
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
            }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          />
        </div>
    </div>
  );
}
