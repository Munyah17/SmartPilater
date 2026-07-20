import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-xl bg-[linear-gradient(110deg,var(--color-muted)_35%,color-mix(in_oklab,var(--color-muted)_55%,var(--color-card))_50%,var(--color-muted)_65%)] bg-[length:200%_100%] [animation:shimmer_1.8s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
