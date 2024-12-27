import { SelectBasicTask } from "~/lib/schemas/tasks";
import { SelectUser } from "~/lib/schemas/users";

export default function TaskNonOwnerPage({ task, user }: { task: SelectBasicTask; user: SelectUser; }) {
  return (
    <div>
      <h1>Task Non Owner Page</h1>
    </div>
  );
}