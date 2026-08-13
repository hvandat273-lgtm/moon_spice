"use client";

import { useT } from "@/lib/i18n/LocaleProvider";

interface SocialLinksProps {
  facebookUrl?: string;
  instagramUrl?: string;
  amazonUrl?: string;
  tone?: "light" | "dark";
}

function FacebookMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7.03.084C5.753.144 4.881.348 4.119.647c-.789.308-1.458.72-2.123 1.388C1.331 2.703.921 3.372.616 4.162.321 4.926.121 5.799.064 7.076.008 8.354-.005 8.764.001 12.023c.007 3.259.021 3.667.083 4.947.061 1.277.264 2.149.564 2.911.308.789.72 1.457 1.388 2.123.668.665 1.337 1.074 2.129 1.38.763.295 1.636.496 2.913.552 1.277.056 1.688.069 4.946.063 3.258-.006 3.668-.021 4.948-.081 1.28-.061 2.147-.266 2.91-.564.789-.308 1.458-.72 2.123-1.388.665-.668 1.074-1.338 1.379-2.128.296-.764.497-1.636.552-2.913.056-1.28.069-1.69.063-4.948-.006-3.258-.021-3.667-.082-4.946-.061-1.28-.264-2.149-.563-2.912-.309-.789-.72-1.457-1.388-2.123C21.298 1.33 20.628.921 19.838.617 19.074.321 18.202.12 16.924.065 15.647.009 15.236-.005 11.977.001 8.718.008 8.31.022 7.03.084ZM12 5.838a6.162 6.162 0 1 1 0 12.324 6.162 6.162 0 0 1 0-12.324Zm0 2.162a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.516-3.856a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88Z" />
    </svg>
  );
}

function AmazonMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" role="img">
      <text x="4.3" y="16.5" fill="currentColor" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700">a</text>
      <path d="M5.4 18c3.6 2.1 8.7 2.3 13.1.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="m16.9 17.3 1.8 1.1-1.5 1.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function SocialLinks({ facebookUrl, instagramUrl, amazonUrl, tone = "light" }: SocialLinksProps) {
  const t = useT();
  const links = [
    { href: facebookUrl, label: "Facebook", mark: <FacebookMark /> },
    { href: instagramUrl, label: "Instagram", mark: <InstagramMark /> },
    { href: amazonUrl, label: "Amazon", mark: <AmazonMark /> },
  ];

  return (
    <div aria-label={t("social.label")} className={`social-links social-links--${tone}`} role="group">
      {links.map((link) => (
        link.href ? (
          <a
            aria-label={t("social.follow", { network: link.label })}
            href={link.href}
            key={link.label}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.mark}
          </a>
        ) : (
          <span
            className="social-links__inactive"
            key={link.label}
            title={t("social.pending", { network: link.label })}
          >
            {link.mark}
          </span>
        )
      ))}
    </div>
  );
}
