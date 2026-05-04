import React from "react";

function useOutsideAlerter(
  ref: React.RefObject<HTMLElement | null>,
  setX: React.Dispatch<React.SetStateAction<boolean>>
) {
  React.useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setX(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setX]);
}

type DropdownProps = {
  button: React.ReactNode;
  children: React.ReactNode;
  classNames?: string;
  animation?: string;
};

const Dropdown = (props: DropdownProps) => {
  const { button, children, classNames, animation } = props;
  const wrapperRef = React.useRef(null);
  const [openWrapper, setOpenWrapper] = React.useState(false);
  useOutsideAlerter(wrapperRef, setOpenWrapper);

  return (
    <div ref={wrapperRef} className="relative flex">
      <div onMouseDown={() => setOpenWrapper(!openWrapper)}>{button}</div>
      <div
        className={`${classNames} absolute z-10 ${
          animation
            ? animation
            : "origin-top transition-all duration-300 ease-in-out mt-2"
        } ${openWrapper ? "scale-100" : "scale-0"}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Dropdown;
