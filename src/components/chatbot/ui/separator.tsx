'use client';

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import cn from 'mxcn';

const Separator = React.forwardRef<
	React.ElementRef<typeof SeparatorPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
	(
		{className, orientation = 'horizontal', decorative = true, ...props},
		ref
	) => (
		<SeparatorPrimitive.Root
			ref={ref}
			decorative={decorative}
			orientation={orientation}
			className={cn(
				'shrink-0 bg-border',
				orientation === 'horizontal'
					? 'h-[2px] w-full border-0 border-b-[1px] border-light-border-2 bg-light-bg dark:border-dark-border dark:bg-dark-bg'
					: 'h-full w-[1px]',
				className
			)}
			{...props}
		/>
	)
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export {Separator};
