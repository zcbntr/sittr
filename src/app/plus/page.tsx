import Link from "next/link";
import { getBasicLoggedInUser } from "~/server/queries/users";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find the plan that's right for you",
};

export default async function PlusUpgradeSuccess() {
  const user = await getBasicLoggedInUser();

  if (user?.plusMembership) {
    redirect("/plus-upgrade-success");
  }

  return (
    <main className="mx-auto max-w-2xl p-4 py-5 text-center sm:flex sm:grow sm:flex-col sm:place-content-center md:max-w-3xl">
      <div className="flex h-min w-full grow flex-col gap-7">
        <h3 className="text-3xl font-medium">
          <span className="font-bold">
            sittr
            <sup className="text-violet-600">+</sup>
          </span>{" "}
          gives you access to all the features of sittr.
        </h3>

        <div className="mx-auto -mt-3 flex max-w-xl flex-row place-content-center text-left">
          <ul className="list-disc space-y-1.5 text-pretty pl-10 pr-6 text-xl tracking-wide text-zinc-500">
            <li>Create unlimited pets</li>
            <li>Create unlimited groups</li>
            <li>Create unlimited tasks per week</li>
            <li>Upload up to 10 images per task to help instruct sitters</li>
            <li>Your sitters can upload up to 10 images per task</li>
            <li>
              Upload pictures of your pets to show their personalities (coming
              soon)
            </li>
            <li>And many more features...</li>
          </ul>
        </div>

        <div className="flex flex-row place-content-center">
          <Link
            href="/plus/get-plus"
            className={cn(
              buttonVariants({ variant: "default" }),
              "mx-3 w-full max-w-xl sm:max-w-48",
            )}
          >
            <span className="text-lg">Get Plus</span>
          </Link>
        </div>

        <div>
          <div className="border-1 flex flex-col rounded-md border">
            <Table className="text-lg">
              <TableHeader>
                <TableRow>
                  <TableHead className="max-w-64 font-bold">
                    Compare Limits
                  </TableHead>
                  <TableHead className="text-center font-bold">Free</TableHead>
                  <TableHead className="text-center font-bold">
                    <span className="font-bold">
                      sittr
                      <sup className="text-violet-600">+</sup>
                    </span>
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    <span className="font-bold">
                      sittr <span className="text-violet-600">Pro</span>
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Tasks per week{" "}
                      <div className="text-sm text-muted-foreground">
                        Resets every Monday at 00:00:00 UTC
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    5
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    Unlimited
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Total Groups
                      <div className="text-sm text-muted-foreground">
                        Maximum groups you can create
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    2
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    Unlimited
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Total Group Members{" "}
                      <div className="text-sm text-muted-foreground">
                        Number of group members, excluding you
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    5
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    Unlimited
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Total Pets per Group{" "}
                      <div className="text-sm text-muted-foreground">
                        The number of pets a single group can sit for
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    1
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    5
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    Unlimited
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Total Pets
                      <div className="text-sm text-muted-foreground">
                        Maximum pets you can create
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    2
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    Unlimited
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Recuring Tasks
                      <div className="text-sm text-muted-foreground">
                        Set a frequency and final date for tasks to repeat until
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    ❌
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    ✔️
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    ✔️
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Instructional Images
                      <div className="text-sm text-muted-foreground">
                        Per task, show sitters what to do
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    ❌
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    20
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Completion images
                      <div className="text-sm text-muted-foreground">
                        Per task, uploaded by sitter
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    ❌
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    20
                  </TableCell>
                </TableRow>

                <TableRow className="border-b-1 border">
                  <TableCell className="text-left">
                    <div className="flex max-w-52 flex-col">
                      Pet Pictures
                      <div className="text-sm text-muted-foreground">
                        Per pet, displayed on pet profile
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    ❌
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    10
                  </TableCell>
                  <TableCell className="text-center sm:min-w-32 md:min-w-44">
                    20
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-row place-content-center px-4 pt-4 text-sm text-muted-foreground">
            <div className="max-w-lg">
              Rate limits may apply separately to the above listed limits. If
              this occurs you may need to come back later to try again.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
