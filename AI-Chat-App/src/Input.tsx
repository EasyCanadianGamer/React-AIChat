import React, { useState } from 'react';

// Define the props type for the Input component
interface InputProps {
  onSubmit: (value: string) => void; // onSubmit is a function that takes a string
  disabled?: boolean; // Optional disabled prop
}

function Input({ onSubmit, disabled = false }: InputProps) {
  const [inputValue, setInputValue] = useState('');

  // Explicitly type the event parameter
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Explicitly type the event parameter
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (!disabled) {
      onSubmit(inputValue); // Pass the input value back to the parent component
      setInputValue(''); // Clear the input field after submission
    }
  };

  return (
    <div>
      <div className="mt-2">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="inputname"
            value={inputValue}
            onChange={handleChange}
            disabled={disabled} // Pass the disabled prop to the input
            className={`block w-56 rounded-md py-1.5 px-2 ring-1 ring-inset ring-gray-400 focus:text-white-800 ${
              disabled ? 'bg-gray-200 cursor-not-allowed' : ''
            }`}
            placeholder="Talk to Jarvis"
          />
        </form>
      </div>
    </div>
  );
}

export default Input;