import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";

// Publish only a draft reviewed by an authenticated Bursar. The public read API filters on all approval fields.
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user) return Response.json({error:"Authentication required"},{status:401});
  if((session.user as any).role!=="BURSAR") return Response.json({error:"Only an authorised Bursar can publish a fee schedule."},{status:403});
  let body:any;
  try{body=await req.json();}catch{return Response.json({error:"Invalid JSON"},{status:400});}
  const signature=String(body.signature||"").trim();
  if(signature.length<3 || signature.length>120 || body.confirm!==true) return Response.json({error:"Enter the Bursary signatory name and explicitly confirm publication."},{status:400});
  const {id}=await params;
  const draft=await prisma.feeSchedule.findUnique({where:{id},include:{programme:true}});
  if(!draft) return Response.json({error:"Schedule not found"},{status:404});
  if(draft.approvalStatus!=="DRAFT" || draft.isPublished) return Response.json({error:"Only a private draft can be published."},{status:409});
  const signedAt=new Date();
  const updated=await prisma.$transaction(async tx=>{
    await tx.feeSchedule.updateMany({
      where:{programmeId:draft.programmeId,session:draft.session,isPublished:true},
      data:{isPublished:false,approvalStatus:"SUPERSEDED"},
    });
    const published=await tx.feeSchedule.update({where:{id},data:{
      isPublished:true,approvalStatus:"APPROVED",bursarSignature:signature,bursarSignedAt:signedAt,
      publishedAt:signedAt,publishedById:(session.user as any).id||null,
    }});
    await tx.auditLog.create({data:{
      userId:(session.user as any).id||null,action:"fee.schedule.publish",entity:"FeeSchedule",entityId:id,
      before:JSON.stringify({status:draft.approvalStatus,isPublished:draft.isPublished}),
      after:JSON.stringify({status:"APPROVED",isPublished:true,signature,session:draft.session,programme:draft.programme.slug,total:draft.total}),
    }});
    return published;
  });
  return Response.json({data:{id:updated.id,status:updated.approvalStatus,session:updated.session,signedAt:updated.bursarSignedAt?.toISOString()},message:"Signed fee schedule published."});
}
