// src/components/ui/Icon.tsx
import { IconProps as PhosphorIconProps } from '@phosphor-icons/react';

export type IconContext = 'public' | 'dashboard' | 'auth' | 'cta' | 'decorative';

interface IconWrapperProps extends Omit<PhosphorIconProps, 'weight'> {
    icon: React.ElementType;
    context?: IconContext;
    weight?: PhosphorIconProps['weight'];
}

const CONTEXT_DEFAULTS: Record<IconContext, { weight: PhosphorIconProps['weight']; size: number }> = {
    public: { weight: 'light', size: 20 },
    dashboard: { weight: 'regular', size: 16 },
    auth: { weight: 'light', size: 16 },
    cta: { weight: 'regular', size: 18 },
    decorative: { weight: 'thin', size: 40 },
};

export function Icon({ icon: IconComponent, context = 'dashboard', weight, size, ...props }: IconWrapperProps) {
    const defaults = CONTEXT_DEFAULTS[context];
    return (
        <IconComponent
            size={size ?? defaults.size}
            weight={weight ?? defaults.weight}
            {...props}
        />
    );
}
