import Ornament from './Ornament'
export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title"><Ornament compact /><h2>{children}</h2><Ornament compact /></div>
}
