import { Resend } from "resend";
import { createServerAction } from "zsa";
import { SupportEmailTemplate } from "~/components/email-templates/support-template";
import { supportEmailSchema } from "~/lib/schemas";
import { getLoggedInUser } from "../queries/users";

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
          return Response.json({ error }, { status: 500 });
        }

        return Response.json(data);
      } catch (error) {
        return Response.json({ error }, { status: 500 });
      }
    } else {
      throw new Error("No notification provided");
    }
  });
