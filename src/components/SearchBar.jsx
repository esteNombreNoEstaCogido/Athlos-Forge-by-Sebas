import { useState } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <i className="bi bi-search"></i>
        <input
          type="text"
          placeholder="Buscar productos o entrenamientos..."
          value={searchTerm}
          onChange={handleInputChange}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-button" onClick={handleClear}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>
    </div>
  );
}
