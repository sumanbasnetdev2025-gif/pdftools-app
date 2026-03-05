import Link from "next/link";
import { Tool } from "@/config/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={tool.route} className="group block">
      <div className="relative bg-white border border-gray-100 rounded-2xl p-5 h-full hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
        {/* Hover linear bg */}
        <div className={`absolute inset-0 bg-linear-to-br ${tool.linear} opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-2xl`} />

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
          <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${tool.linear} flex items-center justify-center shadow-sm`}>
            <span className="text-sm">{tool.emoji}</span>
          </div>
        </div>

        {/* Text */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1.5 group-hover:text-red-500 transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}