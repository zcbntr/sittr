"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import { useServerAction } from "zsa-react";
import { Button } from "~/components/ui/button";
import { DialogFooter } from "~/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Form,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { SupportCategoryEnum, supportRequestInputSchema } from "~/lib/schemas";
import { SelectUser } from "~/lib/schemas/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useState } from "react";
import { deleteAccount } from "~/server/actions/account-actions";
import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SettingsPanel({
  user,
}: {
  user: SelectUser | undefined;
}) {
  const [alertState, setAlertState] = useState("");

  return (
    <div className="p-2">
      <div>
        <div className="flex flex-col gap-3 rounded-md border border-red-500 p-3">
          <div className="text-xl">Delete Account</div>
          <div className="">
            Permanently remove your account and all of its data from Sittr. This
            action cannot be undone, continue with caution.
          </div>
          {/* Open a dialog with confirmation, then call server action to delete all user data except user row, then log user out and delete user row */}
          <Button
            variant={"destructive"}
            onClick={() => {
              setAlertState(`confirm-delete-account`);
            }}
          >
            Delete Account
          </Button>
          <AlertDialog open={alertState === `confirm-delete-account`}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Account Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  This action deletes all of your data from Sittr. If you own
                  any groups all members will be removed without notice and the
                  group deleted. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={async () => setAlertState("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    // Delete user data via server action
                    // Destroy session token and redirect to home
                    await deleteAccount();
                    await signOut({
                      redirect: true,
                      redirectTo: "/",
                    });
                  }}
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
