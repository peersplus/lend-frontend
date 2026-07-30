type CenteredLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

export function CenteredLoader({
  label = "Loading...",
  fullScreen = false,
  className = "",
}: CenteredLoaderProps) {
  const containerClass = fullScreen ? "min-h-screen" : "min-h-[220px]";

  return (
    <div className={`grid ${containerClass} place-items-center ${className}`.trim()}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}