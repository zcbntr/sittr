"use server";

import { Resend } from "resend";
import { createServerAction } from "zsa";
import { SupportEmailTemplate } from "~/components/email-templates/support-template";
import { supportEmailSchema } from "~/lib/schemas";
import { getLoggedInUser } from "../queries/users";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendSupportEmailAction = createServerAction()
  .input(supportEmailSchema)
  .handler(async ({ input }) => {
    // Check if user is logged in
    const user = await getLoggedInUser();

    if (user) {
      input.loggedIn = true;
      input.userId = user.id;
    }

    if (input) {
      try {
        const { data, error } = await resend.emails.send({
          from: "Acme <support@sittr.pet>",
          to: ["zbenattar@gmail.com"],
          subject: "Support request",
          react: SupportEmailTemplate({
            ...input,
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
