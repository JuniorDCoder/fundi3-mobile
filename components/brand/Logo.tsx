import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { fonts } from "../../lib/theme/brand";

// Mirrors frontend/components/brand/Logo.tsx — same F3 mark geometry
// (44×44 viewBox), ported to react-native-svg. Keep both in sync.

interface BlocksProps {
  fill: string;
}

function Blocks({ fill }: BlocksProps) {
  return (
    <>
      <Rect x="0" y="4" width="24" height="8" rx="1.5" fill={fill} />
      <Rect x="0" y="18" width="16" height="8" rx="1.5" fill={fill} />
      <Rect x="30" y="4" width="14" height="8" rx="1.5" fill={fill} />
      <Rect x="30" y="18" width="14" height="8" rx="1.5" fill={fill} />
      <Rect x="0" y="32" width="44" height="8" rx="1.5" fill={fill} />
    </>
  );
}

interface LogoMarkProps {
  size?: number;
  fill?: string;
}

export function LogoMark({ size = 44, fill = "#0F6E56" }: LogoMarkProps) {
  return (
    <Svg viewBox="0 0 44 44" width={size} height={size} fill="none">
      <Blocks fill={fill} />
    </Svg>
  );
}

interface LogoFullBaseProps {
  height?: number;
  markFill: string;
  wordmarkFill: string;
}

function LogoFullBase({ height = 44, markFill, wordmarkFill }: LogoFullBaseProps) {
  const width = (148 / 44) * height;
  return (
    <Svg viewBox="0 0 148 44" width={width} height={height} fill="none">
      <Blocks fill={markFill} />
      <SvgText
        x="58"
        y="28"
        fontFamily={fonts.headingSemibold}
        fontSize="22"
        fontWeight="600"
        letterSpacing="-0.4"
        fill={wordmarkFill}
      >
        Fundi3
      </SvgText>
    </Svg>
  );
}

interface LogoFullProps {
  height?: number;
}

// Default — green mark, off-white wordmark. For dark backgrounds.
export function LogoFull({ height }: LogoFullProps) {
  return <LogoFullBase height={height} markFill="#0F6E56" wordmarkFill="#F5FAF7" />;
}

// Fully white — for dark or colored backgrounds (navbars, hero).
export function LogoFullLight({ height }: LogoFullProps) {
  return <LogoFullBase height={height} markFill="#FFFFFF" wordmarkFill="#FFFFFF" />;
}

// Dark wordmark — for light backgrounds (certificates, light docs).
export function LogoFullDark({ height }: LogoFullProps) {
  return <LogoFullBase height={height} markFill="#0F6E56" wordmarkFill="#0A0F0E" />;
}
