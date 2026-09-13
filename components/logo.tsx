export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="93" stroke="currentColor" strokeWidth="9" />
      <g
        stroke="currentColor"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M58 118 L58 62" />
        <path d="M58 62 L79 118" />
        <path d="M79 118 L100 62" />
        <path d="M100 62 L100 118" />
        <path d="M100 118 L100 158" />
        <path d="M100 118 L142 158" />
        <path d="M142 118 L142 158" />
      </g>
      <g className="text-rust" fill="currentColor">
        <circle cx="58" cy="62" r="10.5" />
        <circle cx="100" cy="62" r="10.5" />
        <circle cx="58" cy="118" r="10.5" />
        <circle cx="79" cy="118" r="10.5" />
        <circle cx="100" cy="118" r="10.5" />
        <circle cx="142" cy="118" r="10.5" />
        <circle cx="100" cy="158" r="10.5" />
        <circle cx="142" cy="158" r="10.5" />
      </g>
    </svg>
  );
}

export default function Logo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={`flex items-center gap-[11px] ${className ?? ""}`}>
      <LogoMark className={markClassName ?? "h-[30px] w-[30px] shrink-0"} />
      {wordmark && (
        <span className="whitespace-nowrap font-serif text-[21px] leading-none tracking-[-0.01em]">
          Mind Nexus
        </span>
      )}
    </span>
  );
}
