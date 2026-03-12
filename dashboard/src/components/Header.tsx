"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fade, Flex, ToggleButton } from "@once-ui-system/core";
import { person } from "@/resources";
import styles from "./Header.module.scss";

export const Header = () => {
  const pathname = usePathname() ?? "";

  return (
    <>
      <Fade hide="s" fillWidth position="fixed" height="80" zIndex={9} />
      <Fade show="s" fillWidth position="fixed" bottom="0" to="top" height="80" zIndex={9} />
      <Flex
        fitHeight
        position="unset"
        className={styles.position}
        as="header"
        zIndex={9}
        fillWidth
        padding="8"
        horizontal="center"
        data-border="rounded"
      >
        <Flex paddingLeft="12" fillWidth vertical="center" textVariant="body-default-s" className={styles.brandSide}>
          <span className={styles.logoWrap}>
            <Image src="/hoxic-icon.png" alt="Hoxiq" width={34} height={34} className={styles.logoImage} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{person.name}</span>
            <span className={styles.brandMeta}>Discord bot platform</span>
          </span>
        </Flex>
        <Flex fillWidth horizontal="center">
          <Flex
            background="transparent"
            border="neutral-alpha-weak"
            radius="m-4"
            shadow="l"
            padding="4"
            horizontal="center"
            zIndex={1}
            className={styles.navGlass}
          >
            <Flex gap="4" vertical="center" textVariant="body-default-s" wrap>
              <ToggleButton prefixIcon="home" href="/" label="Home" selected={pathname === "/"} />
              <ToggleButton prefixIcon="grid" href="/app" label="Console" selected={pathname.startsWith("/app")} />
              <ToggleButton
                prefixIcon="discord"
                href="/auth/login"
                label="Sign In"
                selected={pathname.startsWith("/auth")}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex fillWidth horizontal="end" vertical="center" paddingRight="12" textVariant="body-default-s">
          <span className={styles.rolePill}>{person.role}</span>
        </Flex>
      </Flex>
    </>
  );
};
