import LeftovrLogo from "./LeftovrLogo";

export default function LogoMark({ small = false }: { small?: boolean }) {
  return <LeftovrLogo variant="mark" size={small ? "small" : "medium"} />;
}