interface PlusBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASS: Record<NonNullable<PlusBadgeProps['size']>, string> = {
  sm: 'h-[16px] px-1.5 text-[9px]',
  md: 'h-[20px] px-2 text-[10px]',
  lg: 'h-[24px] px-2.5 text-[11px]',
}

export function PlusBadge({ size = 'sm', className = '' }: PlusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-[#6555B8] font-bold uppercase tracking-wide text-white ${SIZE_CLASS[size]} ${className}`}
    >
      Plus
    </span>
  )
}