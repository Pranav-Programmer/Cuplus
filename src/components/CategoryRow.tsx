// src/components/CategoryRow.tsx
import React, { useRef } from "react";

interface CategoryRowProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ categories, selectedCategory, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="relative mb-6">
      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Categories
      </h4>
      <div className="flex items-center gap-4">
        <button
          onClick={scrollLeft}
          className="p-2 bg-surface-dark-lighter rounded-lg hover:bg-primary/20 text-primary transition-colors"
        >
          <span className="material-icons text-sm">chevron_left</span>
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <button
            onClick={() => onSelect(null)}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              !selectedCategory
                ? "bg-primary/20 text-primary font-medium"
                : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white"
            }`}
          >
            All Projects
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <button
          onClick={scrollRight}
          className="p-2 bg-surface-dark-lighter rounded-lg hover:bg-primary/20 text-primary transition-colors"
        >
          <span className="material-icons text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default CategoryRow;