import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Marca Maprix — território geométrico navy com malha de georreferenciamento
 * cyan e a borda cyan deslocada (assinatura da marca). Cores fixas da marca,
 * legível em light e dark.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  const clip = `mrx-body-${id}`;
  const shape = 'M11 16 L18 11 L25 14 L28 11 L37 17 L33 27 L26 40 L16 28 Z';
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Maprix"
      className={className}
    >
      <clipPath id={clip}>
        <path d={shape} />
      </clipPath>
      <path d={shape} transform="translate(-2.6 2.6)" fill="#3FB8E0" />
      <path d={shape} fill="#1A2847" />
      <g
        clipPath={`url(#${clip})`}
        stroke="#3FB8E0"
        strokeWidth={0.55}
        strokeLinecap="round"
        opacity={0.9}
        fill="none"
      >
        <path d="M13 17 L26 40" />
        <path d="M18.5 12.5 L26 40" />
        <path d="M25 15 L26 40" />
        <path d="M30 13 L26 40" />
        <path d="M35.5 18 L26 40" />
        <path d="M12 20 Q24 23 36 21" />
        <path d="M13 26 Q24 29.5 34 27" />
        <path d="M16 32 Q24 35 31 33" />
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
}

/** Lockup horizontal: mark + wordmark. Wordmark usa a cor do texto do contexto. */
export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={cn('h-7 w-7 shrink-0', markClassName)} />
      {showWordmark && (
        <span
          className={cn(
            'text-lg font-semibold tracking-tight text-foreground',
            wordmarkClassName,
          )}
        >
          Maprix
        </span>
      )}
    </span>
  );
}
