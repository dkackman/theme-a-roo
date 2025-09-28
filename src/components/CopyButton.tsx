import { CopyCheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface CopyButtonProps {
  value: string;
  className?: string;
  onCopy?: () => void;
  'aria-label'?: string;
}

export function CopyButton({
  value,
  className,
  onCopy,
  'aria-label': ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <Button
      size='icon'
      variant='outline'
      onClick={async () => await copyAddress()}
      className={className}
      aria-label={ariaLabel || (copied ? `Copied!` : `Copy ${value}`)}
      title={copied ? `Copied!` : `Copy ${value}`}
    >
      {copied ? (
        <CopyCheckIcon
          className='h-4 w-4 text-emerald-500'
          aria-hidden='true'
        />
      ) : (
        <CopyIcon
          className='h-4 w-4 text-muted-foreground'
          aria-hidden='true'
        />
      )}
    </Button>
  );
}
