export default function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-stone-100/20 bg-stone-100/10 shadow-[0_0_22px_rgba(245,240,232,0.08)] ${
        small ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-hidden="true"
    >
      <div
        className={`absolute rounded-full border border-stone-100/45 ${
          small ? "left-2 top-2 h-4 w-4" : "left-2 top-2 h-5 w-5"
        }`}
      />

      <div
        className={`absolute rounded-full bg-stone-100/55 ${
          small ? "bottom-2 right-2 h-2.5 w-2.5" : "bottom-2 right-2 h-3 w-3"
        }`}
      />
    </div>
  );
}