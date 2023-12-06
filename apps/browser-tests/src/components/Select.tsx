import { useState } from "react";

type Option = { name: string; value: string };

type SelectProps = {
  options: Option[];
  defaultValue: string;
  name: string;
  id: string;
  className?: string;
  style?: any;
  onChange?: (value: string) => void;
};

function Select({
  options,
  defaultValue,
  name,
  id,
  className,
  style,
  onChange,
}: SelectProps) {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  return (
    <select
      name={name}
      id={id}
      value={selectedValue}
      onChange={(e) => {
        setSelectedValue(e.target.value);
        onChange?.(e.target.value);
      }}
      className={className}
      style={style}
    >
      {options.map((option: { name: string; value: any }) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

export { Select };
