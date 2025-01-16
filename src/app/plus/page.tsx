import Link from "next/link";
import { getBasicLoggedInUser } from "~/server/queries/users";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { redirect } from "next/navigation";

export default async function PlusUpgradeSuccess() {
  const user = await getBasicLoggedInUser();

  if (user?.plusMembership) {
    redirect("/plus-upgrade-success");
  }

  return (
    <main className="mx-auto max-w-xl p-4 text-center sm:flex sm:grow sm:flex-col sm:place-content-center">
      <div className="flex h-min w-full grow flex-col gap-2">
        <h3 className="mb-2 text-2xl font-medium">
          <span className="font-bold">
            sittr
            <sup className="text-violet-600">+</sup>
          </span>{" "}
          gives you access to all the features of sittr.
        </h3>
        <div className="mx-auto flex flex-row place-content-center pl-12 pr-6 text-left sm:pl-16">
          <ul className="list-disc space-y-1 text-pretty text-xl tracking-wide text-zinc-500">
            <li>Create unlimited pets</li>
            <li>Create unlimited groups</li>
            <li>Create unlimited tasks per week</li>
            <li>Upload up to 10 images to help sitters per task</li>
            <li>
              Your sitters can upload up to 10 images upon task completion
            </li>
            <li>And many more features.</li>
          </ul>
        </div>

        <div className="mt-2 flex flex-row place-content-center">
          <Link
            href="/plus/get-plus"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full max-w-xl sm:max-w-48 mx-3",
            )}
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
