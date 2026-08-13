"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import styles from "./pages.module.css";

/**
 * The opening scene shared by the standalone pages: a full-bleed photograph
 * with the heading resting on it.
 *
 * This replaces the old `.pageHero` / `.contentHero` pair, which were two
 * near-identical centred bands with a 3px olive top rule and a decorative
 * vermilion underline — the same header language the chapters have shed.
 */
export function PageHero({
  label,
  title,
  lead,
  image,
  imageAlt,
  priority,
  children,
}: {
  label: string;
  title: string;
  lead?: string;
  image: string;
  imageAlt: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={styles.pageHero}>
      <div className={styles.pageHeroImage}>
        <Image
          alt={imageAlt}
          data-kenburns
          fetchPriority={priority ? "high" : "auto"}
          fill
          loading={priority ? "eager" : "lazy"}
          quality={75}
          sizes="100vw"
          src={image}
        />
      </div>
      <span aria-hidden="true" className={styles.pageHeroVeil} />
      <div className={styles.pageHeroCopy}>
        <p className={styles.pageLabel}>{label}</p>
        <h1 data-reveal="clip">{title}</h1>
        {lead ? <p className={styles.pageLead} data-reveal>{lead}</p> : null}
        {children}
      </div>
    </header>
  );
}
