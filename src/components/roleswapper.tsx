"use client";

import { create } from "zustand";
import { combine } from "zustand/middleware";
import { Button } from "./ui/button";

const useRoleStore = create(
  combine({ role: "owner" }, (set) => ({
    set: (roleName: string) => set(() => ({ role: roleName })),
    swap: () =>
      set((state) => ({ role: state.role === "sitter" ? "owner" : "sitter" })),
    swapToSitter: () => set(() => ({ role: "sitter" })),
    swapToOwner: () => set(() => ({ role: "owner" })),
  })),
);

export default function RoleSwapper() {
  const role = useRoleStore((state) => state.role);

  return <Button className="w-16" onClick={useRoleStore((state) => state.swap)}>{role}</Button>;
}
