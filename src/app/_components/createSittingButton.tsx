"use client";

import { Button } from "~/components/ui/button";
import CreateSittingDialogue from "./createsittingdialog";
import React from "react";

export default function CreateSittingButton() {
  return (
    <>
      <CreateSittingDialogue>
        <Button variant="outline">New Sitting</Button>
      </CreateSittingDialogue>
    </>
  );
}
