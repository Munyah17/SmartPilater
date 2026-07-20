import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standalone-page counterpart to the "Back to Home" link built into
 * PageHeader — for screens outside the portal shells (login, verify, public
 * pay, terminal) that don't render a PageHeader.
 */
export function BackToHome({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <Link
        href="/"
        aria-label="Back to Home"
        title="Back to Home"
        className={cn(
          "inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <Home className="size-4" />
      </Link>
    );
  }
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-3.5" />
      Back to Home
    </Link>
  );
}
