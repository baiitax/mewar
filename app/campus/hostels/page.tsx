import Link from "next/link";
export default function Page(){
  return <section className="py-8"><div className="container max-w-4xl"><div className="kicker">Life @ MIU</div><h1 className="text-2xl font-bold">Hostels & Mess</h1>
    <p className="text-sm text-slate-600 mt-2">MIU’s public materials describe on-campus accommodation and dining. Current availability, capacity, charges and residence rules require confirmation directly with Student Affairs.</p>
    <div className="grid md:grid-cols-2 gap-4 mt-5"><div className="bg-white border border-line rounded-xl p-4"><h2 className="font-bold">Before arranging accommodation</h2><ul className="text-sm mt-2 list-disc pl-5 space-y-2"><li>Confirm that a room is available for your session and programme.</li><li>Request the current, approved hostel and feeding charges from Bursary.</li><li>Ask Student Affairs for check-in requirements, residence rules and support contacts.</li><li>Do not rely on older online amenity lists as confirmation of current operations.</li></ul></div>
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><h2 className="font-bold">Online allocation is not live in this preview</h2><p className="text-sm mt-2">Hostel booking, inventory, check-in/out and automatic clearance are planned platform modules; no resident data or clearance status is processed here.</p><Link href="/contact" className="inline-block mt-3 bg-navy text-white px-4 py-2 rounded-full text-sm font-bold">Contact MIU →</Link></div></div>
  </div></section>;
}
