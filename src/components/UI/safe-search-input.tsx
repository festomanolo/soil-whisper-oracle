import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { useSafePositioning } from "@/hooks/useHeaderHeight"

interface SafeSearchInputProps extends React.ComponentProps<typeof Input> {
  /**
   * Whether to add top margin to avoid the header
   */
  avoidHeader?: boolean;
  /**
   * Show search icon
   */
  showIcon?: boolean;
}

/**
 * A search input component that automatically positions itself
 * to avoid being hidden behind the app header
 */
const SafeSearchInput = React.forwardRef<HTMLInputElement, SafeSearchInputProps>(
  ({ className, avoidHeader = true, showIcon = true, ...props }, ref) => {
    const { safeTop } = useSafePositioning();
    
    const containerStyle = avoidHeader ? {
      marginTop: `${safeTop}px`
    } : {};

    if (showIcon) {
      return (
        <div 
          className="relative w-full"
          style={containerStyle}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={ref}
            className={cn("pl-10", className)}
            {...props}
          />
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <Input
          ref={ref}
          className={className}
          {...props}
        />
      </div>
    );
  }
);

SafeSearchInput.displayName = "SafeSearchInput";

export { SafeSearchInput };