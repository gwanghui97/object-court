type Props = { name: 'sound' | 'muted' | 'restart' | 'arrow' | 'chevron' | 'scales' | 'camera' | 'check' | 'document'; className?: string };

export function UiIcon({ name, className }: Props) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {(name === 'sound' || name === 'muted') && <path d="M11 5 6 9H3v6h3l5 4z" />}
      {name === 'sound' && <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
      {name === 'muted' && <path d="m16 9 6 6m0-6-6 6" />}
      {name === 'restart' && <><path d="M4 10a8 8 0 1 1 1.5 7" /><path d="M4 4v6h6" /></>}
      {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
      {name === 'scales' && <><path d="M12 3v17M7 21h10M4 7h16M5 7l-4 8h8L5 7Zm14 0-4 8h8l-4-8Z" /><path d="M1 15a4 4 0 0 0 8 0m6 0a4 4 0 0 0 8 0" /></>}
      {name === 'camera' && <><path d="M4 7h4l2-3h4l2 3h4v13H4z" /><circle cx="12" cy="13" r="4" /></>}
      {name === 'check' && <path d="m5 12 4 4L19 6" />}
      {name === 'document' && <><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5" /></>}
    </svg>
  );
}
