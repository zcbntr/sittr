import { getGroupsUserIsIn } from "~/server/queries";

export default async function GroupList() {
  const groups = await getGroupsUserIsIn();

  console.log(groups);

  return (
    <div>
      <h1 className="text-xl">Groups</h1>
      {groups && (
        <ul>
          {groups.map((group) => (
            <li key={group.id}>{group.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
