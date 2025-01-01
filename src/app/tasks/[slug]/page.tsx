import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { markNotificationAsReadAction } from "~/server/actions/notification-actions";
import { getOwnedTaskById, getVisibleTaskById } from "~/server/queries/tasks";
import type { SelectBasicTask } from "~/lib/schemas/tasks";
import { redirect } from "next/navigation";
import { getBasicLoggedInUser } from "~/server/queries/users";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import TaskOwnerPage from "~/app/_components/tasks/task-owner-page";
import TaskNonOwnerPage from "~/app/_components/tasks/task-non-owner-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Get the data for the pet from the slug
  const slug = (await params).slug;
  let ownsTask = false;
  let task: SelectBasicTask | null = await getOwnedTaskById(slug);
  ownsTask = true;
  if (!task) {
    task = await getVisibleTaskById(slug);
    if (!task) {
      task = null;
    }
  }

  if (task == null) {
    // No such task exists, return task does not exist page

    return <TaskDoesNotExistPage />;
  } else {
    // Clear the notification about task that possibly refered the user to this page
    const notification = (await searchParams).notification;

    if (notification) {
      if (
        Array.isArray(notification) &&
        notification.every((item) => typeof item === "string")
      ) {
        // Mark each notification as read
        for (const n of notification) {
          await markNotificationAsReadAction(n);
        }
      } else if (typeof notification === "string") {
        await markNotificationAsReadAction(notification);
      }

      // Redirect to the same page without the notification query
      redirect(`/tasks/${slug}`);
    }

    const user = await getBasicLoggedInUser();

    if (!user) {
      throw new Error("User not found. Contact support.");
    }

    if (ownsTask) {
      const userGroups = await getGroupsUserIsIn();

      return <TaskOwnerPage task={task} user={user} userGroups={userGroups} />;
    } else {
      return <TaskNonOwnerPage task={task} user={user} />;
    }
  }
}

function TaskDoesNotExistPage() {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">Task Not Found</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The task you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
