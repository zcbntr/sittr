import Link from "next/link";
import { MdGroups, MdPets } from "react-icons/md";
import { auth } from "~/auth";

export async function TopNav() {
  const session = await auth();

  if (!session)
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
  else
    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-2 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            sittr
          </Link>
          <nav className="items-center space-x-6 md:flex">
            <div className="flex place-content-center">
              <UserButton
                userProfileMode="navigation"
                userProfileUrl="/user-profile"
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Groups"
                    labelIcon={
                      <div className="flex flex-row place-content-center">
                        <MdGroups size="1.5em" />
                      </div>
                    }
                    href="/my-groups"
                  ></UserButton.Link>
                  <UserButton.Link
                    label="My Pets"
                    labelIcon={
                      <div className="flex flex-row place-content-center">
                        <MdPets size="1.5em" />
                      </div>
                    }
                    href="/my-pets"
                  ></UserButton.Link>
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </nav>
        </div>
      </header>
    );
}
