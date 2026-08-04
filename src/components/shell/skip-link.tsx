type SkipLinkProps = {
  label: string;
};

export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a
      href="#main-content"
      className="bg-primary text-on-primary fixed top-3 left-3 z-50 -translate-y-20 rounded-md px-4 py-3 font-semibold focus:translate-y-0"
    >
      {label}
    </a>
  );
}
