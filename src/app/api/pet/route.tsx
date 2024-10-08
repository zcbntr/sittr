import { type NextRequest, NextResponse } from "next/server";
import {
  editSittingRequestFormSchema,
  dateRangeSchema,
  createPetFormSchema,
  deleteSittingRequestFormSchema,
} from "~/lib/schema";
import {
  createPet,
  createSittingRequest,
  deleteSittingRequest,
  getSittingRequestsStartingInRange,
  updateSittingRequest,
} from "~/server/queries";

// export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
//   try {
//     const requestParams = dateRangeSchema.safeParse({
//       from: req.nextUrl.searchParams.get("from"),
//       to: req.nextUrl.searchParams.get("to"),
//     });

//     if (!requestParams.success) {
//       console.log(
//         "Date Range Form Data Parse Error: \n" + requestParams.error.toString(),
//       );
//       throw new Error("Invalid form data");
//     }

//     const pgRows = await getSittingRequestsStartingInRange(
//       requestParams.data.from,
//       requestParams.data.to,
//     );

//     return NextResponse.json(pgRows);
//   } catch (error) {
//     return NextResponse.json({ error });
//   }
// }

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createPetFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await createPet(
      formData.data.name,
      formData.data.species,
      formData.data.birthdate,
      formData.data.breed,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

// export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
//   try {
//     const json: unknown = await req.json();

//     const formData = editSittingRequestFormSchema.safeParse(json);

//     if (!formData.success) {
//       console.log(
//         "Edit Sitting Request Form Data Parse Error: \n" +
//           formData.error.toString(),
//       );
//       throw new Error("Invalid form data");
//     }

//     const pgRow = await updateSittingRequest(
//       formData.data.id,
//       formData.data.name,
//       formData.data.sittingType,
//       formData.data.dateRange.from,
//       formData.data.dateRange.to,
//     );

//     return NextResponse.json(pgRow);
//   } catch (error) {
//     return NextResponse.json({ error });
//   }
// }

// export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
//   try {
//     const json: unknown = await req.json();

//     const formData = deleteSittingRequestFormSchema.safeParse(json);

//     if (!formData.success) {
//       console.log(
//         "Delete Sitting Request Form Data Parse Error: \n" +
//           formData.error.toString(),
//       );
//       throw new Error("Invalid form data");
//     }

//     const pgRow = await deleteSittingRequest(formData.data.id);

//     return NextResponse.json(pgRow);
//   } catch (error) {
//     return NextResponse.json({ error });
//   }
// }
