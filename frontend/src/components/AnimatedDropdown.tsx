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

      setOpenUpward(
        spaceBelow < menuHeight + 16 &&
          spaceAbove > spaceBelow,
      );
    }

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
          font-medium
          outline-none
          transition-all
          duration-200

          ${
            isOpen
              ? `
                border-[#ffb3c3]
                bg-white
                text-[#2a234f]
                ring-4
                ring-[#ffb3c3]/20
              `
              : `
                border-[#e8e5ef]
                bg-[#f8f7fb]
                text-[#77738a]
                hover:border-[#d9d5e3]
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
            text-[#9a96a8]
            transition-all
            duration-200

            ${
              isOpen
                ? "rotate-180 text-[#2a234f]"
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
            border-[#e8e5ef]
            bg-white
            shadow-xl
            shadow-[#2a234f]/10
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
                          bg-[#ffb3c3]/20
                          font-semibold
                          text-[#2a234f]
                        `
                        : `
                          font-medium
                          text-[#77738a]
                          hover:bg-[#f8f7fb]
                          hover:text-[#2a234f]
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
                        text-[#2a234f]
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