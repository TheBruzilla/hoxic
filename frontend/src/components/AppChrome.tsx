"use client";

import { Column, Flex } from "@once-ui-system/core";
import { usePathname } from "next/navigation";
import { Footer, Header, RouteGuard } from "@/components";

interface AppChromeProps {
  children: React.ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname() ?? "";
  const isConsoleRoute = pathname.startsWith("/app");

  if (isConsoleRoute) {
    return (
      <Flex zIndex={0} fillWidth flex={1} style={{ minHeight: "100vh" }}>
        <RouteGuard>{children}</RouteGuard>
      </Flex>
    );
  }

  return (
    <>
      <Flex fillWidth minHeight="16" hide="s" />
      <Header />
      <Flex zIndex={0} fillWidth padding="l" horizontal="center" flex={1} className="pageContentShell">
        <Flex horizontal="center" fillWidth minHeight="0">
          <RouteGuard>{children}</RouteGuard>
        </Flex>
      </Flex>
      <Footer />
    </>
  );
}
