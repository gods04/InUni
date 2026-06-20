import { getAvatarInitials } from '../lib/profileIdentity';

type AvatarSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-xl',
};

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
}

export function UserAvatar({ name, src, size = 'md' }: UserAvatarProps) {
  return (
    <span
      aria-label={`${name} avatar`}
      className={[
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 font-bold text-brand-700 ring-1 ring-brand-100',
        sizeClasses[size],
      ].join(' ')}
    >
      {src ? (
        <img alt="" className="h-full w-full object-cover" src={src} />
      ) : (
        getAvatarInitials(name)
      )}
    </span>
  );
}
