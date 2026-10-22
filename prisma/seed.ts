import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

// The project catalog is seeded from the build-plan inventory only.
// Accreditation references and fee amounts are deliberately NULL/absent until Registry/Bursary supplies authoritative records.
const programmes = [
  { slug:"software-engineering", title:"BSc Software Engineering", school:"Computing", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"cyber-security", title:"BSc Cyber Security", school:"Computing", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"computer-science", title:"BSc Computer Science", school:"Computing", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"industrial-chemistry", title:"BSc Industrial Chemistry", school:"Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"biotechnology", title:"BSc Biotechnology", school:"Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"physics-with-electronics", title:"BSc Physics with Electronics", school:"Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"accounting", title:"BSc Accounting", school:"Management & Social Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"banking-finance", title:"BSc Banking & Finance", school:"Management & Social Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"economics", title:"BSc Economics", school:"Management & Social Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"public-administration", title:"BSc Public Administration", school:"Management & Social Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"entrepreneurship", title:"BSc Entrepreneurship", school:"Management & Social Sciences", durationYears:4, degree:"BSc", nucRef:null },
  { slug:"law", title:"LLB (Bachelor of Laws)", school:"Faculty of Law", durationYears:5, degree:"LLB", nucRef:null },
];

async function main(){
  console.log("Seeding MIU platform reference data…");
  for(const programme of programmes){
    await prisma.programme.upsert({
      where:{ slug:programme.slug },
      update:programme,
      create:programme,
    });
  }
  console.log(`+ ${programmes.length} programme catalogue entries (accreditation references unverified; no synthetic refs inserted)`);

  // Bootstrap credentials are injected at run-time and never committed to source.
  const email = process.env.MIU_BOOTSTRAP_ADMIN_EMAIL || "admin@miu.local";
  const password = process.env.MIU_BOOTSTRAP_ADMIN_PASSWORD;
  if(password){
    if(password.length < 16) throw new Error("MIU_BOOTSTRAP_ADMIN_PASSWORD must be at least 16 characters");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where:{ email:email.toLowerCase() },
      update:{ passwordHash, role:"SUPER_ADMIN", isActive:true },
      create:{ email:email.toLowerCase(), name:"Platform Admin", role:"SUPER_ADMIN", passwordHash, emailVerified:new Date() },
    });
    console.log(`+ Bootstrap admin updated: ${email.toLowerCase()} (password supplied by environment)`);
  } else {
    console.log("! Bootstrap admin not changed; set MIU_BOOTSTRAP_ADMIN_PASSWORD to create/update it securely.");
  }

  console.log("No fee schedules seeded. Public fee API exposes only Bursary-signed, published records.");
}

main().catch(error=>{ console.error(error); process.exitCode=1; }).finally(()=>prisma.$disconnect());
