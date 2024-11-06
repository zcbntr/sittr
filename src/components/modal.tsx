"use client";

import { useRouter } from "next/router";
import { Dialog, DialogContent, DialogOverlay } from "./ui/dialog";
import { useState } from "react";
import { AlertConfirmation } from "./alert-confirmation";

export function Modal({ children }: { children: React.ReactNode }) {
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const router = useRouter();

  const closeModal = () => {
    router.back();
  };

  const handleOpenChange = () => {
    const isUserFormModified = localStorage.getItem("userFormModified");
    if (isUserFormModified && JSON.parse(isUserFormModified)) {
      setShowExitConfirmation(true);
    } else {
      router.back();
    }
  };

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogOverlay>
        <DialogContent className="overflow-y-hidden">
          <AlertConfirmation
            open={showExitConfirmation}
            setOpen={setShowExitConfirmation}
            confirmationAction={closeModal}
            message="You have unsaved changes. Are you sure you want to leave?"
          />
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
