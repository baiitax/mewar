"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return <button type="button" onClick={()=>signOut({ callbackUrl: "/" })} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-navy hover:border-navy">Sign out</button>;
}
