export default function ResearchPage(){
  return (
    <section className="py-8"><div className="container">
      <div className="kicker">Research & Innovation</div><h1 className="text-2xl font-bold">Research, Innovation & Incubation</h1>
      <p className="text-sm text-slate-600 max-w-[700px] mt-1">MIU supports skill-oriented research with policies, collaborations, publications, and a dedicated innovation incubation programme.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold">Research</h3><ul className="text-sm mt-2 space-y-1 list-disc pl-5"><li><b>Research Policies</b> — ethics, integrity, IP</li><li><b>Research Collaboration</b> — global partners</li><li><b>Research Publications</b> — faculty & student output</li><li><b>University Journal</b> — peer-reviewed</li></ul></div>
        <div className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold">Innovation Incubation @ MIU</h3><ul className="text-sm mt-2 space-y-1 list-disc pl-5"><li>About Innovation Incubation</li><li>Advisory Board</li><li>On-going Projects</li><li><a href="/research/incubation" className="font-bold text-navy">Apply for Incubation →</a></li></ul></div>
      </div>
      <div className="bg-slate-50 border border-line rounded-xl p-4 mt-6 text-xs text-slate"><b>Note:</b> Detailed research pages are being populated as the University scales — contact Academic Planning for current publications list.</div>
    </div></section>
  );
}
