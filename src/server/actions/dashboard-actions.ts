"use server";

import { TaskTypeEnum } from "~/lib/schemas/tasks";
import { authenticatedProcedure } from "./zsa-procedures";
import { revalidatePath } from "next/cache";

export const revalidateData = authenticatedProcedure
  .createServerAction()
  .input(TaskTypeEnum)
  .handler(async ({ input, ctx }) => {
    revalidatePath("/");
  });
