import { Navbar } from "@/components/general/Navbar";
import { Analytics } from "@vercel/analytics/react";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-w-7xl mx-auto  pb-12">
      <Navbar />
      {children}
      <Analytics/>
    </div>
  );
};

export default MainLayout;
