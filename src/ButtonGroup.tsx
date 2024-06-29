import React from 'react';

interface ButtonOption<T> {
  value: T;
  label: string;
}

interface ButtonGroupProps<T> {
  options: ButtonOption<T>[];
  selected?: T;
  onSelect: (value: T) => void;
}

const ButtonGroup = <T extends React.Key,>({ options, selected, onSelect }: ButtonGroupProps<T>) => {
  const handleClick = (value: T) => {
    onSelect(value);
  };

  return (
    <div className="flex-none">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          className={`
            py-1 px-2 inline-flex justify-center items-center gap-2
            ${index === 0 ? 'rounded-l-lg' : ''}
            ${index === options.length - 1 ? 'rounded-r-lg' : ''}
            ${index > 0 ? '-ml-px' : ''}
            border font-medium
            ${selected === option.value ? 'bg-indigo-500 text-white' : 'bg-white text-gray-900'}
            align-middle hover:bg-indigo-600 hover:text-white focus:z-10 focus:outline-none
            transition-all text-sm
          `}
          onClick={() => handleClick(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ButtonGroup;
