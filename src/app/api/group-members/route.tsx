import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schema";
import { getGroupMembers } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: req.nextUrl.searchParams.get("id"),
      ids: req.nextUrl.searchParams.get("ids"),
      all: req.nextUrl.searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      console.log(
        "Group Members Form Data Parse Error: \n" + requestParams.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    if (requestParams.data.id) {
      const members = await getGroupMembers(requestParams.data.id);

      return NextResponse.json(members);
    }

    return NextResponse.json({ error: "Invalid request params" });
  } catch (error) {
    return NextResponse.json({ error });
  }
}

// export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
//   try {
//     const json: unknown = await req.json();

//     const formData = createPetFormSchema.safeParse(json);

//     if (!formData.success) {
//       console.log(
//         "Create Pet Form Data Parse Error: \n" + formData.error.toString(),
//       );
//       throw new Error("Invalid form data");
//     }

//     const pet = await createPet(formData.data);

//     return NextResponse.json(pet);
//   } catch (error) {
//     return NextResponse.json({ error });
//   }
// }

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
