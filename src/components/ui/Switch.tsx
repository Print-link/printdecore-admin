export const Switch = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    className={`relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
      checked ? 'bg-ios-green' : 'bg-ios-gray5'
    }`}
  >
    <span
      className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
      }`}
    />
  </button>
);
