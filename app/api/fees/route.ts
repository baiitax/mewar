import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";

// Public read: a schedule is visible only after Bursary sign-off.
export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const session = searchParams.get("session") || "2026/27";
  const slug = searchParams.get("programme");
  const fees = await prisma.feeSchedule.findMany({
    where:{
      session,
      isPublished:true,
      approvalStatus:"APPROVED",
      bursarSignedAt:{not:null},
      bursarSignature:{not:null},
      ...(slug ? { programme:{slug} } : {}),
    },
    include:{programme:true},
    orderBy:[{programme:{title:"asc"}},{version:"desc"}],
  });
  const latest = new Map<string, (typeof fees)[number]>();
  for(const fee of fees) if(!latest.has(fee.programmeId)) latest.set(fee.programmeId, fee);
  const data = [...latest.values()].map(f=>({
    programme:f.programme.slug,
    title:f.programme.title,
    school:f.programme.school,
    session:f.session,
    tuition:f.tuition,
    hostel:f.hostel,
    feeding:f.feeding,
    total:f.total,
    currency:f.currency,
    effectiveFrom:f.effectiveFrom.toISOString(),
    signedBy:f.bursarSignature,
    signedAt:f.bursarSignedAt?.toISOString() ?? null,
    version:f.version,
  }));
  return Response.json({
    meta:{session, count:data.length, source:"Bursary-approved FeeSchedule", published:data.length>0},
    data,
  }, {headers:{"Cache-Control":"no-store"}});
}

// Create a private draft. Publication is a separate Bursar-only signing action.
export async function POST(req: Request){
  const session = await auth();
  if(!session?.user) return Response.json({error:"Authentication required"},{status:401});
  const role = (session.user as any).role;
  if(!["SUPER_ADMIN","BURSAR"].includes(role)) return Response.json({error:"Insufficient role"},{status:403});

  let body:any;
  try { body=await req.json(); } catch { return Response.json({error:"Invalid JSON"},{status:400}); }
  const programmeId=String(body.programmeId||"");
  const academicSession=String(body.session||"");
  const tuition=Number(body.tuition), hostel=Number(body.hostel||0), feeding=Number(body.feeding||0);
  const effectiveFrom=new Date(String(body.effectiveFrom||""));
  if(!programmeId || !/^\d{4}\/\d{2}$/.test(academicSession) || !Number.isSafeInteger(tuition) || tuition<=0 || !Number.isSafeInteger(hostel) || hostel<0 || !Number.isSafeInteger(feeding) || feeding<0 || Number.isNaN(effectiveFrom.getTime())){
    return Response.json({error:"Provide programme, session, positive tuition, non-negative optional charges, and a valid effective date."},{status:400});
  }
  const programme=await prisma.programme.findUnique({where:{id:programmeId}});
  if(!programme) return Response.json({error:"Programme not found"},{status:404});
  const prior=await prisma.feeSchedule.findFirst({where:{programmeId,session:academicSession},orderBy:{version:"desc"}});
  const version=(prior?.version||0)+1;
  const total=tuition+hostel+feeding;
  const draft=await prisma.$transaction(async tx=>{
    const created=await tx.feeSchedule.create({data:{
      programmeId,session:academicSession,tuition,hostel,feeding,total,
      isPublished:false,approvalStatus:"DRAFT",version,effectiveFrom,
      createdById:(session.user as any).id||null,
    }});
    await tx.auditLog.create({data:{
      userId:(session.user as any).id||null,action:"fee.draft.create",entity:"FeeSchedule",entityId:created.id,
      after:JSON.stringify({programme:programme.slug,session:academicSession,version,total}),
    }});
    return created;
  });
  return Response.json({data:{id:draft.id,programme:programme.slug,session:draft.session,version:draft.version,total:draft.total,status:draft.approvalStatus},message:"Private draft created. A Bursar must review and sign before publication."},{status:201});
}
