interface Props {
  emoji: string;
  title: string;
  description: string;
  linear: string;
}

export default function ToolHeader({ emoji, title, description, linear }: Props) {
  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      <div className="inline-flex mb-5">
        <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${linear} flex items-center justify-center shadow-lg`}>
          <span className="text-2xl">{emoji}</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
        {title}
      </h1>

      {/* Description */}
      <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}