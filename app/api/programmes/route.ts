import { prisma } from "@/app/lib/db";
export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const school=searchParams.get("school")?.trim();
  const programmes=await prisma.programme.findMany({
    where:school?{school:{contains:school}}:{isActive:true},
    select:{slug:true,title:true,school:true,degree:true,durationYears:true,isActive:true,feeSchedules:{
      where:{session:"2026/27",isPublished:true,approvalStatus:"APPROVED",bursarSignedAt:{not:null},bursarSignature:{not:null}},
      select:{session:true,tuition:true,hostel:true,feeding:true,total:true,currency:true,effectiveFrom:true,bursarSignature:true,bursarSignedAt:true,version:true},
      orderBy:{version:"desc"},take:1,
    }},
    orderBy:{title:"asc"},
  });
  return Response.json({data:programmes,meta:{count:programmes.length,source:"Programme catalogue; fees only from approved Bursary FeeSchedule"}},{headers:{"Cache-Control":"no-store"}});
}
