import { type NextRequest, NextResponse } from "next/server";
import { requestGroupInviteCodeFormInputSchema } from "~/lib/schema";
import { getNewGroupInviteCode } from "~/server/queries";

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = requestGroupInviteCodeFormInputSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Create New Group Invite Form Data Parse Error: \n" +
          formData.error.toString(),
      );
    }

    const invite = await getNewGroupInviteCode(formData.data);

    return NextResponse.json(invite);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

// export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
//   try {
//     const json: unknown = await req.json();

//     const formData = petSchema.safeParse(json);

//     if (!formData.success) {
//       console.log(
//         "Edit Pet Form Data Parse Error: \n" + formData.error.toString(),
//       );
//       throw new Error("Invalid form data");
//     }

//     const pgRow = await updatePet(formData.data);

//     return NextResponse.json(pgRow);
//   } catch (error) {
//     return NextResponse.json({ error });
//   }
// }

// export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
//   try {
//     const json: unknown = await req.json();

//     const formData = deleteAPIFormSchema.safeParse(json);

//     if (!formData.success) {
//       console.log(
//         "Delete Pet Form Data Parse Error: \n" + formData.error.toString(),
//       );
//       throw new Error("Invalid form data");
//     }

//     const pgRow = await deletePet(formData.data.id);

//     return NextResponse.json(pgRow);
//   } catch (error) {
//     return NextResponse.json({ error });
//   }
// }
