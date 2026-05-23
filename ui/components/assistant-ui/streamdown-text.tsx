"use client";

import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import { code } from "@streamdown/code";
import { createMathPlugin } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";

export const StreamdownText = () => (
  <StreamdownTextPrimitive
    plugins={{ code, math: createMathPlugin({ singleDollarTextMath: true }), mermaid, cjk }}
    caret="circle"
  />
);

export const UserStreamdownText = () => (
  <StreamdownTextPrimitive
    plugins={{ code }}
    mode="static"
  />
);
