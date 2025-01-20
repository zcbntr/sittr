import Link from "next/link";
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
import { getBasicLoggedInUser } from "~/server/queries/users";
import {
  MdNotificationImportant,
  MdNotifications,
  MdOutlineCalendarMonth,
  MdOutlineGroup,
  MdOutlinePets,
  MdOutlineSettings,
  MdPerson,
} from "react-icons/md";
import { getUserNotifications } from "~/server/queries/notifications";
import { getTimeSinceDateAsString, initials } from "~/lib/utils";

export async function TopNav() {
  const user = await getBasicLoggedInUser();

  if (!user) {
    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-3 md:px-6">
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
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-3 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          {user.plan === "Free" && (
            <Link href="/" className="text-4xl font-bold">
              sittr
            </Link>
          )}
          {user.plan === "Plus" && (
            <Link href="/" className="text-4xl font-bold">
              sittr
              <sup className="font-bold text-violet-500">+</sup>
            </Link>
          )}
          {user.plan === "Pro" && (
            <Link href="/" className="text-4xl font-bold">
              sittr <span className="font-bold text-violet-500">Pro</span>
            </Link>
          )}
          <nav className="flex flex-row items-center space-x-3">
            <div className="flex flex-col place-content-center">
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
                <DropdownMenuContent className="ml-1 mr-auto w-4/5 min-w-[260px] md:max-w-96">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id}>
                      <Link
                        href={
                          notification.associatedGroupId
                            ? `/groups/${notification.associatedGroupId}?notification=${notification.id}`
                            : notification.associatedPetId
                              ? `/pets/${notification.associatedPetId}?notification=${notification.id}`
                              : notification.associatedTaskId
                                ? `/tasks/${notification.associatedTaskId}?notification=${notification.id}`
                                : "/"
                        }
                        className="flex flex-row place-content-start gap-2"
                      >
                        <div className="flex flex-row place-content-start gap-1">
                          {!notification.read && (
                            <div className="flex flex-col place-content-center">
                              <MdNotificationImportant size={"1.2rem"} />
                            </div>
                          )}
                          <div className="flex flex-row flex-wrap place-content-start gap-1">
                            <div className="underline">
                              {notification.message.substring(0, 40)}
                            </div>
                            {/* Show how long since notification created */}
                            {notification.createdAt && (
                              <div className="text-xs text-gray-500">
                                {getTimeSinceDateAsString(
                                  notification.createdAt,
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length === 0 && (
                    <DropdownMenuItem>No notifications</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col place-content-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="relative inline-block">
                    <Avatar className="border-2 border-opacity-50">
                      <AvatarImage
                        src={user.image ? user.image : undefined}
                        alt={`${user.name}'s avatar`}
                      />
                      <AvatarFallback>
                        {user.name ? initials(user.name) : <MdPerson />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mx-1.5 min-w-[200px] max-w-full md:max-w-96">
                  <DropdownMenuItem>
                    <Link
                      href="/"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlineCalendarMonth />
                      </div>
                      Dashboard
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
