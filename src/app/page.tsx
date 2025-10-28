"use client";

import dynamic from "next/dynamic";

const StagesManagement = dynamic(() => import("@/components/stages-management"), { ssr: false });

export default function Home() {
  return <StagesManagement />;
}
