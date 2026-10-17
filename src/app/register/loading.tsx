import React from "react";
import { InitialLoader } from "@/components/ui/initial-loader";

export default function RegisterLoading() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center w-screen h-screen min-h-dvh bg-[#F2F2EB]">
      <InitialLoader fullscreen />
    </div>
  );
}
