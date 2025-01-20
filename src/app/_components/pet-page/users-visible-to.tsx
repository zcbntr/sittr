import { type SelectBasicUser } from "~/lib/schemas/users";
import { type SelectPet } from "~/lib/schemas/pets";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { MdPerson } from "react-icons/md";
import { initials } from "~/lib/utils";

export default function UsersVisibleTo({
  users,
}: {
  pet: SelectPet;
  users: SelectBasicUser[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {users.map((user) => (
        <div className="flex flex-row gap-2" key={user.id}>
          <div className="flex flex-col place-content-center">
            <div className="relative inline-block">
              <Avatar>
                <AvatarImage
                  src={user.image ? user?.image : undefined}
                  alt={`${user?.name}'s avatar`}
                />
                <AvatarFallback>
                  {user?.name ? initials(user?.name) : <MdPerson />}
                </AvatarFallback>
              </Avatar>
              {user?.plan === "Plus" && (
                <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-2xl font-bold text-violet-500">
                  +
                </div>
              )}
              {user?.plan === "Pro" && (
                <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-xl font-bold text-violet-500">
                  Pro
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col place-content-center text-lg">
            {user.name}
          </div>
        </div>
      ))}
      {users.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No one else can see this pet
        </div>
      )}
    </div>
  );
}
