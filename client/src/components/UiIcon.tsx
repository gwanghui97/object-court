type Props = { name: 'sound' | 'muted' | 'restart' | 'arrow' | 'chevron'; className?: string };

export function UiIcon({ name, className }: Props) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {(name === 'sound' || name === 'muted') && <path d="M11 5 6 9H3v6h3l5 4z" />}
      {name === 'sound' && <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
      {name === 'muted' && <path d="m16 9 6 6m0-6-6 6" />}
      {name === 'restart' && <><path d="M4 10a8 8 0 1 1 1.5 7" /><path d="M4 4v6h6" /></>}
      {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}
