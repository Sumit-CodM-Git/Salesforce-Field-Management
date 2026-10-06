"use client";

import { useState } from "react";
import Head from "./Head";
import LeftSideBar from "./LeftSideBar";
import RightSideSection from "./RightSideSection";
import { DEFAULT_NAV_ID } from "./navigation";        // ← value only
import type { NavId } from "./navigation";            // ← type only

export default function MainPage() {
  const [activePage, setActivePage] = useState<NavId>(DEFAULT_NAV_ID);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-[#111319]">
      <Head
        onOpenNav={() => setMobileNavOpen(true)}
        notificationCount={3}
        userName="Sumit"
        onBellClick={() => setActivePage("ApprovalQueue")}
      />

      <div className="flex min-h-0 flex-1">
        <LeftSideBar
          activePage={activePage}
          onNavigate={setActivePage}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <RightSideSection activePage={activePage} />
      </div>
    </div>
  );
}