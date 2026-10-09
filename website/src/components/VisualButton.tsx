import { ArrowRight } from 'lucide-react';

type VisualButtonProps = {
  label: string;
  className?: string;
};

export default function VisualButton({ label, className = '' }: VisualButtonProps) {
  return (
    <span role="presentation" className={`btn-forest select-none px-5 py-3 text-sm ${className}`}>
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}
