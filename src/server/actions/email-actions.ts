"use server";

import { Resend } from "resend";
import { createServerAction } from "zsa";
import { SupportEmailTemplate } from "~/components/email-templates/support-template";
import { supportRequestInputSchema } from "~/lib/schemas";
import { getBasicLoggedInUser } from "../queries/users";
import { supportRequestRateLimit } from "../ratelimit";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendSupportEmailAction = createServerAction()
  .input(supportRequestInputSchema)
  .handler(async ({ input }) => {
    // Check if user is logged in
    const user = await getBasicLoggedInUser();

    if (user) {
      // Limit to two support requests per hour
      const { success } = await supportRequestRateLimit.limit(user.id);

      if (!success) {
        throw new Error("You are sending support requests too fast");
      }
    } else {
      throw new Error("User is not logged in");
    }

    if (input) {
      try {
        const { data, error } = await resend.emails.send({
          from: "Sittr <no-reply@support.sittr.pet>",
          to: ["zbenattar@gmail.com"],
          subject: `${input.category} - ${input.fullName}`,
          react: SupportEmailTemplate({
            ...input,
            userId: user.id,
          }),
        });

        if (error) {
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        console.log(error);
        throw new Error("Unknown error");
      }
    } else {
      throw new Error("No notification provided");
    }
  });
