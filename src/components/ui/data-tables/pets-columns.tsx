"use client";

import { ColumnDef } from "@tanstack/react-table";
import { type Pet } from "~/lib/schema";

export const columns: ColumnDef<Pet>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "species",
    header: "Species",
  },
  {
    accessorKey: "breed",
    header: "Breed",
  },
];
