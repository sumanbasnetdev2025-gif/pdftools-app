import { Tool } from "@/config/tools";
import ToolCard from "./ToolCard";

interface Props {
  tools: Tool[];
  title?: string;
}

export default function ToolGrid({ tools, title }: Props) {
  return (
    <section className="w-full">
      {title && (
        <h2 className="text-xl font-bold text-gray-800 mb-5">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}