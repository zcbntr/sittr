import Link from "next/link";
// import { MdGroups, MdPets } from "react-icons/md";
import SignInButton from "~/components/sign-in-button";
import SignOutButton from "~/components/sign-out-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getLoggedInUser } from "~/server/queries/users";
import {
  MdNotificationImportant,
  MdNotifications,
  MdOutlineGroup,
  MdOutlinePerson,
  MdOutlinePets,
  MdOutlineSettings,
} from "react-icons/md";
import { getUserNotifications } from "~/server/queries/notifications";

export async function TopNav() {
  const user = await getLoggedInUser();

  if (!user) {
    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-2 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            sittr
          </Link>
          <nav className="items-center space-x-6 md:flex">
            <div className="flex place-content-center">
              <SignInButton />
            </div>
          </nav>
        </div>
      </header>
    );
  } else {
    const notifications = await getUserNotifications();
    const hasUnreadNotifications = notifications.some((n) => !n.read);

    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-2 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            sittr
          </Link>
          <nav className="items-center space-x-5 md:flex">
            <div className="flex place-content-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex flex-col place-content-center">
                    {hasUnreadNotifications && (
                      <MdNotificationImportant size={"1.7rem"} />
                    )}
                    {!hasUnreadNotifications && (
                      <MdNotifications size={"1.7rem"} />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[260px]">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id}>
                      <Link
                        href={
                          notification.associatedGroup
                            ? `/groups/${notification.associatedGroup.id}`
                            : notification.associatedPet
                              ? `/pets/${notification.associatedPet.id}`
                              : notification.associatedTask
                                ? `/tasks/${notification.associatedTask.taskId}`
                                : "/"
                        }
                        className="flex flex-row place-content-start gap-2"
                      >
                        {notification.read && (
                          <div className="flex flex-col place-content-center">
                            <MdNotificationImportant />
                          </div>
                        )}
                        {notification.message.substring(0, 40)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length === 0 && (
                    <DropdownMenuItem>No notifications</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex place-content-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
                    <AvatarImage
                      src={user.image ? user.image : undefined}
                      alt={`${user.name}'s avatar`}
                    />
                    {/* Make this actually be the initials rather than first letter */}
                    <AvatarFallback>
                      {user.name?.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[200px]">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link
                      href="/my-profile"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlinePerson />
                      </div>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href="/my-pets"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlinePets />
                      </div>
                      My Pets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href="/my-groups"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlineGroup />
                      </div>
                      My Groups
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href="/settings"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlineSettings />
                      </div>
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SignOutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </header>
    );
  }
}
