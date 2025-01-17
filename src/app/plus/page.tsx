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

export default async function PlusUpgradeSuccess() {
  const user = await getBasicLoggedInUser();

  if (user?.plusMembership) {
    redirect("/plus-upgrade-success");
  }

  return (
    <main className="mx-auto max-w-2xl p-4 py-5 text-center sm:flex sm:grow sm:flex-col sm:place-content-center">
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

        <div className="flex flex-col gap-2">
          <div className="flex flex-row px-4 text-center text-3xl font-light sm:text-left">
            Feature Comparison
          </div>
          <Table className="text-lg">
            <TableCaption>
              Rate limits may apply to certain actions separately from
              weekly/montly limits
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold">Action</TableHead>
                <TableHead className="text-center font-bold">Free</TableHead>
                <TableHead className="text-center font-bold">Plus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    Tasks per week{" "}
                    <div className="text-center text-sm text-muted-foreground">
                      (resets Mon 00:00 UTC)
                    </div>
                  </div>
                </TableCell>
                <TableCell>5</TableCell>
                <TableCell className="text-center">Unlimited</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">Total groups</TableCell>
                <TableCell>5</TableCell>
                <TableCell className="text-center">Unlimited</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">Max group size</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    5
                    <div className="text-center text-sm text-muted-foreground">
                      (excluding you)
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">Unlimited</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">Total pets</TableCell>
                <TableCell>2</TableCell>
                <TableCell className="text-center">Unlimited</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">
                  Set up recuring tasks
                </TableCell>
                <TableCell>❌</TableCell>
                <TableCell className="text-center">✔️</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    Instructional images
                    <div className="text-center text-sm text-muted-foreground">
                      (per task)
                    </div>
                  </div>
                </TableCell>
                <TableCell>❌</TableCell>
                <TableCell className="text-center">10</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    Completion images
                    <div className="text-center text-sm text-muted-foreground">
                      (per task, uploaded by sitter)
                    </div>
                  </div>
                </TableCell>
                <TableCell>❌</TableCell>
                <TableCell className="text-center">10</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    Pictures of pet
                    <div className="text-center text-sm text-muted-foreground">
                      (displayed on pet profile)
                    </div>
                  </div>
                </TableCell>
                <TableCell>❌</TableCell>
                <TableCell className="text-center">10</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
