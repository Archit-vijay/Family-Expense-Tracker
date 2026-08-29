import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
} from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface AnimatedDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

function AnimatedDropdown({
  value,
  options,
  onChange,
  className = "",
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find(
      (option) => option.value === value,
    ) ?? options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function determinePosition() {
      if (
        !dropdownRef.current ||
        !menuRef.current
      ) {
        return;
      }

      const trigger =
        dropdownRef.current.getBoundingClientRect();

      const menuHeight =
        Math.min(
          menuRef.current.scrollHeight,
          224,
        );

      const spaceBelow =
        window.innerHeight - trigger.bottom;

      const spaceAbove = trigger.top;

      // Open upward when there isn't enough
      // room below and there is more room above.
      setOpenUpward(
        spaceBelow < menuHeight + 16 &&
          spaceAbove > spaceBelow,
      );
    }

    // Wait for the menu to be rendered.
    requestAnimationFrame(determinePosition);

    window.addEventListener(
      "resize",
      determinePosition,
    );

    window.addEventListener(
      "scroll",
      determinePosition,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        determinePosition,
      );

      window.removeEventListener(
        "scroll",
        determinePosition,
        true,
      );
    };
  }, [isOpen, options.length]);

  function handleSelect(
    optionValue: string,
  ) {
    onChange(optionValue);
    setIsOpen(false);
  }

  function toggleDropdown() {
    setIsOpen((open) => !open);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`
          flex h-11 w-full
          items-center justify-between
          gap-3
          rounded-xl
          border
          px-4
          text-sm
          outline-none
          transition-all duration-200
          ${
            isOpen
              ? `
                border-violet-400
                bg-white
                text-slate-700
                ring-4
                ring-violet-500/10
              `
              : `
                border-slate-200
                bg-slate-50
                text-slate-600
                hover:border-slate-300
                hover:bg-white
              `
          }
        `}
      >
        <span className="truncate">
          {selectedOption?.label}
        </span>

        <ChevronDown
          size={17}
          strokeWidth={2}
          className={`
            shrink-0
            text-slate-400
            transition-all
            duration-200
            ${
              isOpen
                ? "rotate-180 text-violet-500"
                : ""
            }
          `}
        />
      </button>

      {/* Dropdown */}
      <div
        ref={menuRef}
        className={`
          absolute
          left-0
          right-0
          z-[100]
          origin-bottom
          transition-all
          duration-200
          ease-out

          ${
            openUpward
              ? "bottom-full top-auto mb-2 origin-bottom"
              : "top-full mt-2 origin-top"
          }

          ${
            isOpen
              ? "visible translate-y-0 scale-100 opacity-100"
              : `
                pointer-events-none
                invisible
                ${
                  openUpward
                    ? "translate-y-1"
                    : "-translate-y-1"
                }
                scale-[0.98]
                opacity-0
              `
          }
        `}
      >
        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-xl
            shadow-slate-900/10
          "
        >
          <div
            className="
              dropdown-options
              max-h-56
              overflow-y-auto
              overscroll-contain
              p-1.5
            "
          >
            {options.map((option) => {
              const isSelected =
                option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handleSelect(
                      option.value,
                    )
                  }
                  className={`
                    flex w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    transition-all
                    duration-150

                    ${
                      isSelected
                        ? `
                          bg-violet-50
                          font-semibold
                          text-violet-600
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-50
                          hover:text-slate-900
                        `
                    }
                  `}
                >
                  <span className="truncate">
                    {option.label}
                  </span>

                  {isSelected && (
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="
                        ml-3
                        shrink-0
                        text-violet-600
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedDropdown;