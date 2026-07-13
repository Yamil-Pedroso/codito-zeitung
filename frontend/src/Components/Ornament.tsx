export default function Ornament({ compact = false }: { compact?: boolean }) {
  return <span className={`ornament ${compact ? 'ornament--compact' : ''}`} aria-hidden="true"><i /><b>✦</b><i /></span>
}
