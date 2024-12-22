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
    <main className="m-10 mx-auto w-full max-w-lg p-10 text-center">
      <div className="mb-10">
        <h1 className="mb-2 text-5xl font-extrabold">Thank you!</h1>
        <h3 className="text-2xl">
          You can now access all the features of Sittr<span>+</span>.
        </h3>
        <div className="mx-auto my-4 text-left">
          <ul className="list-disc text-xl">
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
          Try it out
        </Link>
      </div>
    </main>
  );
}
