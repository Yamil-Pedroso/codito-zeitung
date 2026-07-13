import { HiOutlineArrowNarrowRight, HiOutlineClock } from 'react-icons/hi'
import assets from '../assets'
export default function LeadStory() { return <article className="lead-story">
  <div className="lead-art"><img src={assets.panorama} alt="Stich einer Schweizer Stadt am See mit den Alpen und einem Zug" /><span className="image-caption">Von den Alpen in die Welt · Redaktionelle Illustration</span></div>
  <div className="lead-copy"><span className="eyebrow"><i /> Die Geschichte des Tages</span><h2>Die Schweiz verbindet ihre Regionen mit Blick auf die Zukunft</h2><p>Eine neue Generation von Infrastrukturen soll Städte, Täler und Gemeinden näher zusammenbringen, ohne die Landschaft aufzugeben, die sie prägt.</p><div className="story-meta"><span>SRF News</span><span><HiOutlineClock /> 8 Min. Lesezeit</span></div><a href="#artikel">Die ganze Reportage lesen <HiOutlineArrowNarrowRight /></a></div>
</article> }
