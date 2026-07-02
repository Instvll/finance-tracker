export default function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/10 shadow-[0_0_26px_rgba(199,173,117,0.12)] ${
        small ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-hidden="true"
    >
      <div
        className={`absolute rounded-full bg-[#f5f0e8]/85 ${
          small
            ? "left-[11px] top-[7px] h-[16px] w-[3px]"
            : "left-[13px] top-[8px] h-[18px] w-[3px]"
        }`}
      />

      <div
        className={`absolute rounded-full bg-[#c7ad75] shadow-[0_0_12px_rgba(199,173,117,0.45)] ${
          small
            ? "left-[18px] top-[15px] h-[4px] w-[4px]"
            : "left-[21px] top-[17px] h-[4px] w-[4px]"
        }`}
      />
    </div>
  );
}
