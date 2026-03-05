"use client";
import { useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, FileText } from "lucide-react";
import { tools, categories } from "@/config/tools";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">
              PDF<span className="text-red-500">Master</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-4">

          {/* Auth buttons */}
          <div className="px-5 mb-5 flex gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className="flex-1 text-center py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className="flex-1 text-center py-2 text-sm font-semibold text-white bg-linear-to-r from-red-500 to-rose-500 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Tools by category */}
          {categories
            .filter((c) => c.id !== "all")
            .map((cat) => {
              const catTools = tools.filter((t) => t.category === cat.id);
              return (
                <div key={cat.id} className="mb-2">
                  {/* Category header */}
                  <div className="px-5 py-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {cat.label}
                    </span>
                  </div>

                  {/* Tool links */}
                  {catTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.route}
                      onClick={onClose}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-red-50 group transition-colors"
                    >
                      {/* Mini icon */}
                      <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${tool.linear} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-xs">{tool.emoji}</span>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-red-500 font-medium transition-colors flex-1">
                        {tool.name}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} PDFMaster · Free PDF Tools
          </p>
        </div>
      </div>
    </>
  );
}