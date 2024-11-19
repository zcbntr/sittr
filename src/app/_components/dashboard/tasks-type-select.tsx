"use client";

import { useState } from "react";
import { useServerAction } from "zsa-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TaskTypeEnum } from "~/lib/schemas/tasks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function TaskTypeSelect({
  initialType,
}: {
  initialType: TaskTypeEnum;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showTaskTypes, setShowTaskTypes] = useState<TaskTypeEnum>(initialType);

  return (
    <Select
      defaultValue={TaskTypeEnum.Enum.All}
      onValueChange={async (taskType: TaskTypeEnum) => {
        setShowTaskTypes(TaskTypeEnum.enum[taskType]);
        // Add (task)type to the URL query params
        const params = new URLSearchParams(searchParams);
        params.set("type", taskType.toString());
        router.replace(`${pathname}?${params.toString()}`);
      }}
    >
      <SelectTrigger className="max-w-48">
        <SelectValue>{showTaskTypes.toString()}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-w-48">
        {Object.values(TaskTypeEnum.Values).map((taskType) => (
          <SelectItem value={taskType} key={taskType}>
            {taskType.toString()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
