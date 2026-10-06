import { cn } from "@/lib/utils";

/** A pixel-TV character shown in a little framed screen. */
export function TvArt({
  src,
  size = 120,
  className,
  alt = "",
}: {
  src: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <div className={cn("tv-frame", className)} style={{ width: size, height: size }}>
      <img className="pixel" src={src} alt={alt} width={size} height={size} />
    </div>
  );
}
