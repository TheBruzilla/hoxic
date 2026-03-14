import { Flex, SmartLink, Text } from "@once-ui-system/core";
import { person, social } from "@/resources";
import styles from "./Footer.module.scss";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Flex as="footer" fillWidth padding="8" horizontal="center" mobileDirection="column" className={styles.footerWrap}>
      <Flex
        className={`${styles.mobile} ${styles.footerPanel}`}
        maxWidth="m"
        paddingY="8"
        paddingX="16"
        gap="16"
        horizontal="space-between"
        vertical="center"
      >
        <Text variant="body-default-s" onBackground="neutral-strong" className={styles.footerMeta}>
          <Text onBackground="neutral-weak">© {currentYear}</Text>
          <Text paddingX="4">{person.name}</Text>
          <Text onBackground="neutral-weak">Discord bot provisioning, controls, and support contact.</Text>
        </Text>
        <Flex gap="16" className={styles.footerLinks}>
          {social.map(item => (
            <SmartLink key={item.name} href={item.link}>
              {item.name}
            </SmartLink>
          ))}
        </Flex>
      </Flex>
      <Flex height="80" show="s"></Flex>
    </Flex>
  );
};
