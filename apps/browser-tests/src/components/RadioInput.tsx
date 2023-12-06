import { useId } from "react";

type Option = { name: string; value: string };
type RadioInputOptionProps = {
  name: string;
  option: Option;
  onChange: (value: Option) => void;
  disabled?: boolean;
  checked?: boolean;
};

function RadioInputOption({
  name,
  option,
  checked,
  onChange,
  disabled,
}: RadioInputOptionProps) {
  const controlId = useId();
  return (
    <label htmlFor={controlId}>
      <input
        id={controlId}
        type="radio"
        value={option.value}
        name={name}
        checked={checked}
        onChange={() => onChange(option)}
        disabled={disabled}
      />
      {option.name}
    </label>
  );
}

type RadioInputProps = {
  name: string;
  options: Option[];
  onChange: (value: Option) => void;
  disabled?: boolean;
  value: string;
};

function RadioInput({
  name,
  onChange,
  options,
  value,
  disabled,
}: RadioInputProps) {
  return (
    <div>
      {options.map((option: { name: string; value: any }) => (
        <RadioInputOption
          key={option.value}
          name={name}
          onChange={onChange}
          option={option}
          checked={option.value === value}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export { RadioInput };
