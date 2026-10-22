import Link from "next/link";
export default function Page(){
  return <section className="py-8"><div className="container max-w-4xl">
    <div className="kicker">Academics • Registry source</div><h1 className="text-2xl font-bold">Academic Calendar — 2026/27</h1>
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4"><b>Current approved calendar not available in this preview.</b><p className="text-sm mt-1">The public evidence register only confirmed an older 2021 calendar. No dates or signed document have been supplied for the current session, so this page does not invent dates or present an unverified PDF as Registry-approved.</p></div>
    <div className="bg-white border border-line rounded-xl p-4 mt-4"><h2 className="font-bold">Calendar publication controls</h2><ul className="text-sm text-slate-700 mt-2 list-disc pl-5 space-y-1"><li>Registry supplies the approved session schedule and document reference.</li><li>Every publication records an owner, approver, effective date and review date.</li><li>Updates are versioned; superseded calendars remain archived and clearly labelled.</li></ul><Link href="/contact" className="inline-block mt-4 bg-navy text-white px-4 py-2 rounded-full text-sm font-bold">Request the current calendar from Registry →</Link></div>
  </div></section>;
}
