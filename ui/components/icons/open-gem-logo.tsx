import type * as React from "react";

export function OpenGemLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="512"
      height="512"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="OpenGem logo"
      {...props}
    >
      <defs>
        <linearGradient
          id="left"
          x1="104"
          y1="180"
          x2="256"
          y2="388"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff006e" />
          <stop offset="1" stopColor="#ffb703" />
        </linearGradient>

        <linearGradient
          id="center"
          x1="180"
          y1="128"
          x2="332"
          y2="388"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>

        <linearGradient
          id="right"
          x1="256"
          y1="128"
          x2="408"
          y2="388"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      <polygon
        points="104,208 176,136 336,136 408,208 256,392"
        fill="none"
      />

      <polygon points="104,208 176,136 256,392" fill="url(#left)" />
      <polygon points="176,136 336,136 256,392" fill="url(#center)" />
      <polygon points="336,136 408,208 256,392" fill="url(#right)" />
    </svg>
  );
}
