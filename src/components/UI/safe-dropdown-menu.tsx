import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"
import { useSafePositioning } from "@/hooks/useHeaderHeight"

/**
 * A dropdown menu content component that automatically positions itself
 * to avoid being hidden behind the app header
 */
const SafeDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    avoidHeader?: boolean;
  }
>(({ className, sideOffset, avoidHeader = true, ...props }, ref) => {
  const { safeSideOffset, safeTop } = useSafePositioning();
  
  // Calculate the appropriate sideOffset
  const calculatedSideOffset = sideOffset ?? (avoidHeader ? safeSideOffset : 4);
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={calculatedSideOffset}
        className={cn(
          "z-[60] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        style={{
          // Ensure dropdown doesn't go above the header when avoidHeader is true
          ...(avoidHeader && {
            '--radix-dropdown-menu-content-transform-origin': 'var(--radix-dropdown-menu-trigger-width) 0',
            maxHeight: `calc(100vh - ${safeTop}px - 20px)`, // 20px bottom margin
          }),
          ...props.style,
        }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

SafeDropdownMenuContent.displayName = "SafeDropdownMenuContent";

export { SafeDropdownMenuContent };