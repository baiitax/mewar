export default function Page(){return <section className="py-8"><div className="container"><div className="kicker">Life @ MIU</div><h1 className="text-2xl font-bold">Sports Facilities</h1><p className="text-sm text-slate-600 mt-1">These activities appear in historical public descriptions. Confirm which facilities currently operate, access conditions and safety arrangements with MIU before relying on the list.</p><div className="grid md:grid-cols-3 gap-3 mt-4">
{["Swimming Pool","Cricket Ground","Squash Courts","Football Pitch","Horse-Riding Arena","Boating","Tennis Courts","Gaming Centre & Gym"].map(s=>(
  <div key={s} className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold text-sm">{s}</h3><p className="text-xs text-slate">Illustrative historic listing; current availability and eligibility need confirmation.</p></div>
))}
</div></div></section>}
