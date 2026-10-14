"use client";

/**
 * Opens the shared video modal when JS is available, and degrades to a plain
 * YouTube link when it is not. The anchor keeps a real href so the row stays
 * crawlable and usable without hydration.
 */
export function WatchLink({
  id,
  title,
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noreferrer"
      title={title}
      onClick={(event) => {
        // Modifier-clicks and middle-clicks should keep native link behaviour.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("melodi:watch", { detail: { id, title } }));
      }}
      className={className}
    >
      {children}
    </a>
  );
}