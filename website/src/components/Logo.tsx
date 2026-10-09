export default function Logo() {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="flex items-center gap-2">
        <span className="gold-rule hidden h-px w-6 sm:block" aria-hidden="true" />
        <span className="font-label text-xl font-semibold tracking-[0.18em] text-steel sm:text-2xl">
          IRON <span className="text-goldmetal">MILES</span>
        </span>
        <span className="gold-rule hidden h-px w-6 sm:block" aria-hidden="true" />
      </span>
      <span className="mt-1 font-body text-[0.6rem] italic tracking-wide text-steel/80 sm:text-[0.68rem]">
        Fitness Journey for Truck Drivers
      </span>
    </span>
  );
}
