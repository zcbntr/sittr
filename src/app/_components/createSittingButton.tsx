"use client"

import { Button } from "~/components/ui/button"
import CreateSittingDialogue from "./createsittingdialog"
import React from "react"

export default function CreateSittingButton() {
    const [open, setOpen] = React.useState(false)

    return (
        <>
            <CreateSittingDialogue isOpen={open} onCloseClick={() => setOpen(false)}>
                <Button variant="outline" onClick={() => setOpen(true)}>New Sitting</Button>
            </CreateSittingDialogue>
        </>
    )
}