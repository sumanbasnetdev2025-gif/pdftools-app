"use client";
import { categories, ToolCategory } from "@/config/tools";

interface Props {
  active: ToolCategory;
  onChange: (cat: ToolCategory) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id as ToolCategory)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            active === cat.id
              ? "bg-gray-900 text-white shadow-md scale-105"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}