export type ToolCategory = "all" | "organize" | "optimize" | "convert" | "edit" | "security";

export interface Tool {
  linear: any;
  id: string;
  name: string;
  description: string;
  route: string;
  category: ToolCategory;
  gradient: string;
  iconBg: string;
  emoji: string;
}

export const tools: Tool[] = [
  // Organize
  { id: "merge", name: "Merge PDF", description: "Combine PDFs in the order you want with the easiest PDF merger available.", route: "/merge", category: "organize", gradient: "from-red-500 to-orange-500", iconBg: "bg-red-50", emoji: "🔀" },
  { id: "split", name: "Split PDF", description: "Separate one page or a whole set for easy conversion into independent PDF files.", route: "/split", category: "organize", gradient: "from-orange-500 to-yellow-500", iconBg: "bg-orange-50", emoji: "✂️" },
  { id: "organize", name: "Organize PDF", description: "Sort pages of your PDF file however you like. Delete or add PDF pages.", route: "/organize", category: "organize", gradient: "from-yellow-500 to-lime-500", iconBg: "bg-yellow-50", emoji: "📋" },
  { id: "crop", name: "Crop PDF", description: "Crop the margins of PDF documents or select specific areas.", route: "/crop", category: "organize", gradient: "from-lime-500 to-green-500", iconBg: "bg-lime-50", emoji: "🔲" },

  // Optimize
  { id: "compress", name: "Compress PDF", description: "Reduce file size while optimizing for maximal PDF quality.", route: "/compress", category: "optimize", gradient: "from-green-500 to-teal-500", iconBg: "bg-green-50", emoji: "📦" },
  { id: "repair", name: "Repair PDF", description: "Repair a damaged PDF and recover data from corrupt PDF files.", route: "/repair", category: "optimize", gradient: "from-teal-500 to-cyan-500", iconBg: "bg-teal-50", emoji: "🔧" },
  { id: "ocr", name: "OCR PDF", description: "Easily convert scanned PDF into searchable and selectable documents.", route: "/ocr", category: "optimize", gradient: "from-cyan-500 to-blue-500", iconBg: "bg-cyan-50", emoji: "🔍" },
  { id: "page-numbers", name: "Page Numbers", description: "Add page numbers into PDFs with ease. Choose your positions and typography.", route: "/page-numbers", category: "optimize", gradient: "from-blue-500 to-indigo-500", iconBg: "bg-blue-50", emoji: "🔢" },

  // Convert
  { id: "pdf-to-word", name: "PDF to Word", description: "Easily convert your PDF files into easy to edit DOC and DOCX documents.", route: "/convert/pdf-to-word", category: "convert", gradient: "from-blue-600 to-blue-400", iconBg: "bg-blue-50", emoji: "📝" },
  { id: "pdf-to-powerpoint", name: "PDF to PowerPoint", description: "Turn your PDF files into easy to edit PPT and PPTX slideshows.", route: "/convert/pdf-to-powerpoint", category: "convert", gradient: "from-orange-600 to-red-400", iconBg: "bg-orange-50", emoji: "📊" },
  { id: "pdf-to-excel", name: "PDF to Excel", description: "Pull data straight from PDFs into Excel spreadsheets in seconds.", route: "/convert/pdf-to-excel", category: "convert", gradient: "from-green-600 to-emerald-400", iconBg: "bg-green-50", emoji: "📈" },
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert each PDF page into a JPG or extract all images from a PDF.", route: "/convert/pdf-to-jpg", category: "convert", gradient: "from-yellow-500 to-orange-400", iconBg: "bg-yellow-50", emoji: "🖼️" },
  { id: "word-to-pdf", name: "Word to PDF", description: "Make DOC and DOCX files easy to read by converting them to PDF.", route: "/convert/word-to-pdf", category: "convert", gradient: "from-indigo-600 to-blue-400", iconBg: "bg-indigo-50", emoji: "📄" },
  { id: "powerpoint-to-pdf", name: "PowerPoint to PDF", description: "Make PPT and PPTX slideshows easy to view by converting them to PDF.", route: "/convert/powerpoint-to-pdf", category: "convert", gradient: "from-red-600 to-orange-400", iconBg: "bg-red-50", emoji: "🎯" },
  { id: "excel-to-pdf", name: "Excel to PDF", description: "Make EXCEL spreadsheets easy to read by converting them to PDF.", route: "/convert/excel-to-pdf", category: "convert", gradient: "from-emerald-600 to-green-400", iconBg: "bg-emerald-50", emoji: "📉" },
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.", route: "/convert/jpg-to-pdf", category: "convert", gradient: "from-pink-500 to-rose-400", iconBg: "bg-pink-50", emoji: "🗃️" },
  { id: "html-to-pdf", name: "HTML to PDF", description: "Convert webpages in HTML to PDF. Copy and paste the URL of the page.", route: "/html-to-pdf", category: "convert", gradient: "from-violet-500 to-purple-400", iconBg: "bg-violet-50", emoji: "🌐" },

  // Edit
  { id: "edit", name: "Edit PDF", description: "Add text, images, shapes or freehand annotations to a PDF document.", route: "/edit", category: "edit", gradient: "from-purple-500 to-violet-500", iconBg: "bg-purple-50", emoji: "✏️" },
  { id: "rotate", name: "Rotate PDF", description: "Rotate your PDFs the way you need them. Rotate multiple PDFs at once!", route: "/rotate", category: "edit", gradient: "from-fuchsia-500 to-pink-500", iconBg: "bg-fuchsia-50", emoji: "🔄" },
  { id: "watermark", name: "Watermark PDF", description: "Stamp an image or text over your PDF. Choose typography and position.", route: "/watermark", category: "edit", gradient: "from-rose-500 to-red-500", iconBg: "bg-rose-50", emoji: "💧" },
  { id: "sign", name: "Sign PDF", description: "Sign yourself or request electronic signatures from others.", route: "/sign", category: "edit", gradient: "from-sky-500 to-blue-500", iconBg: "bg-sky-50", emoji: "✍️" },
  { id: "compare", name: "Compare PDF", description: "Show a side-by-side comparison and easily spot changes between versions.", route: "/compare", category: "edit", gradient: "from-amber-500 to-yellow-500", iconBg: "bg-amber-50", emoji: "⚖️" },
  { id: "redact", name: "Redact PDF", description: "Permanently remove sensitive information and graphics from a PDF.", route: "/redact", category: "edit", gradient: "from-gray-700 to-gray-500", iconBg: "bg-gray-100", emoji: "🖊️" },
  { id: "translate", name: "Translate PDF", description: "Easily translate PDF files powered by AI. Keep fonts, layout, and formatting.", route: "/translate", category: "edit", gradient: "from-teal-500 to-emerald-500", iconBg: "bg-teal-50", emoji: "🌍" },
  { id: "scan-to-pdf", name: "Scan to PDF", description: "Capture document scans from your mobile and send them to your browser.", route: "/scan-to-pdf", category: "edit", gradient: "from-indigo-500 to-blue-500", iconBg: "bg-indigo-50", emoji: "📷" },

  // Security
  { id: "unlock", name: "Unlock PDF", description: "Remove PDF password security, giving you freedom to use your PDFs.", route: "/unlock", category: "security", gradient: "from-green-600 to-teal-500", iconBg: "bg-green-50", emoji: "🔓" },
  { id: "protect", name: "Protect PDF", description: "Protect PDF files with a password. Encrypt documents to prevent unauthorized access.", route: "/protect", category: "security", gradient: "from-red-600 to-rose-500", iconBg: "bg-red-50", emoji: "🔒" },
];

export const categories = [
  { id: "all", label: "All Tools" },
  { id: "organize", label: "Organize PDF" },
  { id: "optimize", label: "Optimize PDF" },
  { id: "convert", label: "Convert PDF" },
  { id: "edit", label: "Edit PDF" },
  { id: "security", label: "PDF Security" },
] as const;