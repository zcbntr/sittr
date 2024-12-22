import Link from "next/link";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "~/server/queries/users";
import { buttonVariants } from "~/components/ui/button";

export default async function PlusUpgradeSuccess({}) {
  const user = await getLoggedInUser();

  if (!user || !user.plusMembership) {
    redirect("/get-plus");
  }

  return (
    <main className="m-5 mx-auto w-full max-w-xl p-5 text-center">
      <div className="mb-10">
        <h1 className="mb-2 text-5xl font-extrabold">Thank you!</h1>
        <h3 className="text-2xl font-medium">
          You can now access all the features of{" "}
          <span className="font-bold">
            sittr
            <sup className="text-violet-600">+</sup>
          </span>
        </h3>
        <div className="mx-auto mb-6 mt-4 flex flex-row place-content-center text-pretty pl-12 pr-6 text-left sm:pl-16">
          <ul className="list-disc space-y-1 text-xl tracking-wide text-zinc-500">
            <li>Create unlimited pets</li>
            <li>Create unlimited groups</li>
            <li>Create unlimited tasks per week</li>
            <li>Upload up to 10 images to help sitters per task</li>
            <li>
              Your sitters can upload up to 10 images upon task completion
            </li>
          </ul>
        </div>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          <span className="text-lg">Try it out</span>
        </Link>
      </div>
    </main>
  );
}
