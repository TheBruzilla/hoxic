import React from "react";
import { Button, Column, Flex, Heading, RevealFx, Text } from "@once-ui-system/core";
import { home, person } from "@/resources";
import styles from "./home.module.scss";

export default function Home() {
  return (
    <Column maxWidth="xl" gap="xl" horizontal="center" className={styles.homeRoot}>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} />
        <Column gap="l" className={styles.heroCopy}>
          <RevealFx translateY={6}>
            <Text variant="label-default-s" className={styles.kicker}>
              {home.kicker}
            </Text>
          </RevealFx>
          <RevealFx translateY={8} delay={0.05}>
            <Heading wrap="balance" variant="display-strong-l" className={styles.heroTitle}>
              {home.headline}
            </Heading>
          </RevealFx>
          <RevealFx translateY={8} delay={0.1}>
            <Text wrap="balance" onBackground="neutral-medium" className={styles.heroText}>
              {home.subline}
            </Text>
          </RevealFx>
          <RevealFx delay={0.16}>
            <Flex gap="12" wrap className={styles.heroActions}>
              <Button href="/app" variant="primary" size="l">
                Open Console
              </Button>
              <Button href="/auth/login" variant="secondary" size="l">
                Sign In With Discord
              </Button>
            </Flex>
          </RevealFx>
          <RevealFx delay={0.22}>
            <div className={styles.heroStats}>
              {home.stats.map(stat => (
                <article key={stat.label} className={styles.statCard}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </article>
              ))}
            </div>
          </RevealFx>
        </Column>
        <div className={styles.heroPanel}>
          <div className={styles.panelGlow} />
          <div className={styles.panelHeader}>
            <span className={styles.panelBadge}>Platform Overview</span>
            <span className={styles.panelHost}>{person.name}</span>
          </div>
          <div className={styles.topologyGrid}>
            {home.topology.map(node => (
              <article key={node.title} className={styles.topologyCard}>
                <span className={styles.topologyLabel}>{node.label}</span>
                <h3>{node.title}</h3>
                <p>{node.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <Text variant="label-default-s" className={styles.kicker}>
            Core Flows
          </Text>
          <Heading variant="heading-strong-l">Provisioning and controls in one place</Heading>
        </div>
        <div className={styles.featureGrid}>
          {home.features.map(feature => (
            <article key={feature.title} className={styles.featureCard}>
              <span className={styles.featureEyebrow}>{feature.eyebrow}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </Column>
  );
}
