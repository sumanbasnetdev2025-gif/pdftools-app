interface Props {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

const labelSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export default function LoadingSpinner({
  size = "md",
  label,
  fullPage = false,
}: Props) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          ${sizeMap[size]} rounded-full
          border-gray-200 border-t-red-500
          animate-spin
        `}
      />
      {label && (
        <p className={`${labelSizeMap[size]} text-gray-500 font-medium`}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}