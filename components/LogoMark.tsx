export default function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/10 shadow-[0_0_26px_rgba(199,173,117,0.12)] ${
        small ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-hidden="true"
    >
      <div
        className={`absolute rounded-full bg-[#f5f0e8]/70 ${
          small ? "left-2 top-2 h-1.5 w-4" : "left-2 top-2 h-1.5 w-5"
        }`}
      />

      <div
        className={`absolute rounded-full bg-[#f5f0e8]/45 ${
          small ? "left-2 top-[14px] h-1.5 w-3.5" : "left-2 top-[15px] h-1.5 w-4"
        }`}
      />

      <div
        className={`absolute rounded-full bg-[#c7ad75] shadow-[0_0_12px_rgba(199,173,117,0.35)] ${
          small ? "bottom-2 right-2 h-2.5 w-2.5" : "bottom-2 right-2 h-3 w-3"
        }`}
      />

      <div
        className={`absolute rounded-full border border-[#c7ad75]/35 ${
          small
            ? "bottom-[7px] right-[7px] h-4 w-4"
            : "bottom-[7px] right-[7px] h-5 w-5"
        }`}
      />
    </div>
  );
}