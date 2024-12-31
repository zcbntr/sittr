import Link from "next/link";
import { getLoggedInUser } from "~/server/queries/users";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { redirect } from "next/navigation";

export default async function PlusUpgradeSuccess() {
  const user = await getLoggedInUser();

  if (user?.plusMembership) {
    redirect("/plus-upgrade-success");
  }

  return (
    <main className="m-4 mx-auto w-full max-w-xl p-4 text-center">
      <div className="mb-10 flex flex-col gap-5">
        <h3 className="mb-2 text-2xl font-medium">
          <span className="font-bold">
            sittr
            <sup className="text-violet-600">+</sup>
          </span>{" "}
          gives you access to all the features of sittr and more.
        </h3>
        <div className="mx-auto flex flex-row place-content-center text-pretty pl-12 pr-6 text-left sm:pl-16">
          <ul className="list-disc space-y-1 text-xl tracking-wide text-zinc-500">
            <li>Create unlimited pets</li>
            <li>Create unlimited groups</li>
            <li>Create unlimited tasks per week</li>
            <li>
              Upload up to 10 images to help sitters per task (coming soon)
            </li>
            <li>
              Your sitters can upload up to 10 images upon task completion
              (coming soon)
            </li>
            <li>And many more features.</li>
          </ul>
        </div>

        <div className="mt-2 flex flex-row place-content-center">
          <Link
            href="/plus/get-plus"
            className={cn(buttonVariants({ variant: "default" }), "max-w-36")}
          >
            <span className="text-lg">Get Plus</span>
          </Link>
        </div>

        <div className="mt-2 flex flex-row place-content-center">
          <div className="max-w-96 align-middle text-sm text-zinc-500">
            <span className="font-medium">Your feedback matters.</span> Please{" "}
            <Link href="/support" className="underline">
              contact support
            </Link>{" "}
            if you encounter any issues, want to suggest additional features, or
            are not satisfied with{" "}
            <span className="font-bold text-black">
              sittr
              <sup className="text-violet-600">+</sup>
            </span>
            . You have 14 days to request a refund.
          </div>
        </div>
      </div>
    </main>
  );
}
