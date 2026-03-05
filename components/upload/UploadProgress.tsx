interface Props {
  progress: number; // 0–100
  label?: string;
}

export default function UploadProgress({ progress, label = "Processing..." }: Props) {
  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-red-500">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-red-500 to-rose-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress === 100 && (
        <p className="text-xs text-green-500 font-medium mt-2 text-center">
          ✓ Done! Preparing your download...
        </p>
      )}
    </div>
  );
}