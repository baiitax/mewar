const base=process.env.SMOKE_BASE_URL||"http://localhost:3001";
const fail=message=>{console.error(`FAIL: ${message}`);process.exitCode=1;};
async function get(path,options){
  try{return await fetch(`${base}${path}`,options)}catch(error){fail(`${path} unreachable: ${error.message}`);return null;}
}

const health=await get("/api/health");
if(!health||health.status!==200){fail(`health expected 200, got ${health?.status}`)}else{
  const json=await health.json();if(!json.ok)fail("health payload not ok");else console.log("PASS health/database");
}

const programmesRes=await get("/api/programmes");
if(!programmesRes||programmesRes.status!==200){fail(`programmes expected 200, got ${programmesRes?.status}`)}else{
  const json=await programmesRes.json();
  if(json.data?.length!==12)fail(`expected 12 programme catalogue entries, got ${json.data?.length}`);
  else console.log("PASS programme catalogue (12 entries)");
}

const feesRes=await get("/api/fees?session=2026%2F27");
if(!feesRes||feesRes.status!==200){fail(`fees expected 200, got ${feesRes?.status}`)}else{
  const json=await feesRes.json();
  const invalid=(json.data||[]).some(f=>!f.signedAt||!f.signedBy);
  if(invalid)fail("public fee API returned an unsigned schedule");
  else console.log(`PASS fee API exposes ${json.data?.length||0} signed schedule(s) only`);
}

const feePage=await get("/admissions/fees");
if(!feePage||feePage.status!==200)fail(`public fees page expected 200, got ${feePage?.status}`);
else {const text=await feePage.text();if(!text.includes("Official fee schedule not yet published")&&!text.includes("Approved schedule"))fail("public fee page did not show a schedule status");else console.log("PASS public fees page and publication status");}

const login=await get("/login");
if(!login||login.status!==200)fail(`login page expected 200, got ${login?.status}`);
else {const text=await login.text();if(/try\s+admin@|default\s+password|demo\s+credentials/i.test(text))fail("embedded demo credential appears in login page");else console.log("PASS login page has no embedded demo credential");}

const admin=await get("/admin",{redirect:"manual"});
if(!admin||![302,303,307,308].includes(admin.status))fail(`unauthenticated admin should redirect; got ${admin?.status}`);
else console.log("PASS admin route is protected");

const applicantRegister=await get("/applicant/register");
if(!applicantRegister||applicantRegister.status!==200)fail(`applicant registration page expected 200, got ${applicantRegister?.status}`);
else console.log("PASS applicant registration page is available in preview");

const applicantPortal=await get("/portal",{redirect:"manual"});
if(!applicantPortal||![302,303,307,308].includes(applicantPortal.status))fail(`unauthenticated applicant portal should redirect; got ${applicantPortal?.status}`);
else console.log("PASS applicant portal is protected");

const staffApplications=await get("/admin/applications",{redirect:"manual"});
if(!staffApplications||![302,303,307,308].includes(staffApplications.status))fail(`unauthenticated staff application review should redirect; got ${staffApplications?.status}`);
else console.log("PASS admissions review route is protected");

const registryStudents=await get("/admin/students",{redirect:"manual"});
if(!registryStudents||![302,303,307,308].includes(registryStudents.status))fail(`unauthenticated Registry student records should redirect; got ${registryStudents?.status}`);
else console.log("PASS Registry student records route is protected");

const financePage=await get("/admin/finance",{redirect:"manual"});
if(!financePage||![302,303,307,308].includes(financePage.status))fail(`unauthenticated Bursary finance workspace should redirect; got ${financePage?.status}`);
else console.log("PASS Bursary finance workspace is protected");

const financeApi=await get("/api/admin/finance");
if(!financeApi||financeApi.status!==401)fail(`unauthenticated Bursary finance API should return 401; got ${financeApi?.status}`);
else console.log("PASS Bursary finance API requires authentication");

const fakeReceipt=await get(`/finance/verify/${"0".repeat(48)}`);
if(!fakeReceipt||fakeReceipt.status!==404)fail(`unknown receipt token should return 404; got ${fakeReceipt?.status}`);
else console.log("PASS public receipt verification rejects unknown tokens");

const governancePage=await get("/admin/governance",{redirect:"manual"});
if(!governancePage||![302,303,307,308].includes(governancePage.status))fail(`unauthenticated governance tracker should redirect; got ${governancePage?.status}`);
else console.log("PASS governance decision tracker is protected");

const governanceApi=await get("/api/admin/governance");
if(!governanceApi||governanceApi.status!==401)fail(`unauthenticated governance API should return 401; got ${governanceApi?.status}`);
else console.log("PASS governance decision API requires authentication");

if(process.exitCode)process.exit(process.exitCode);
console.log("Foundation smoke checks complete.");
