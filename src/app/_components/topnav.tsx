import Link from "next/link";
import { MdGroups, MdPets } from "react-icons/md";
import { auth } from "~/auth";
import SignIn from "~/components/sign-in-button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getCurrentLoggedInUser } from "~/server/queries/users";

export async function TopNav() {
  const userId = (await auth())?.user?.id;

  if (!userId) {
    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-2 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            sittr
          </Link>
          <nav className="items-center space-x-6 md:flex">
            <div className="flex place-content-center">
              <SignIn />
            </div>
          </nav>
        </div>
      </header>
    );
  } else {
    const user = await getCurrentLoggedInUser();

    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-2 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            sittr
          </Link>
          <nav className="items-center space-x-6 md:flex">
            <div className="flex place-content-center">
              <Link href={`/profile/${user.id}`}>
                <Avatar>
                  <AvatarImage
                    src={user.image ? user.image : undefined}
                    alt={`${user.name}'s avatar`}
                  />
                  {/* Make this actually be the initials rather than first letter */}
                  <AvatarFallback>{user.name?.substring(0, 1)}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </nav>
        </div>
      </header>
    );
  }
}
