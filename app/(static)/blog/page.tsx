import Link from "next/link";

const posts = [
  {
    slug: "how-to-compress-pdf",
    title: "How to Compress a PDF Without Losing Quality",
    excerpt: "Learn the best techniques to reduce PDF file size while keeping your images and text sharp.",
    category: "Tutorial",
    date: "March 1, 2025",
    readTime: "3 min read",
    emoji: "🗜️",
  },
  {
    slug: "pdf-to-word-guide",
    title: "The Complete Guide to Converting PDF to Word",
    excerpt: "Everything you need to know about converting PDFs to editable Word documents accurately.",
    category: "Guide",
    date: "Feb 20, 2025",
    readTime: "5 min read",
    emoji: "📝",
  },
  {
    slug: "protect-pdf-passwords",
    title: "How to Password Protect Your PDF Files",
    excerpt: "Keep your sensitive documents secure by adding password protection to your PDFs.",
    category: "Security",
    date: "Feb 10, 2025",
    readTime: "4 min read",
    emoji: "🔒",
  },
  {
    slug: "merge-pdf-tips",
    title: "5 Tips for Merging PDFs Like a Pro",
    excerpt: "Discover the best practices for combining multiple PDF files into one clean document.",
    category: "Tips",
    date: "Jan 28, 2025",
    readTime: "3 min read",
    emoji: "🔗",
  },
  {
    slug: "ocr-explained",
    title: "What is OCR and How Does It Work?",
    excerpt: "A beginner's guide to Optical Character Recognition and how to extract text from scanned PDFs.",
    category: "Education",
    date: "Jan 15, 2025",
    readTime: "6 min read",
    emoji: "🔍",
  },
  {
    slug: "pdf-accessibility",
    title: "Making Your PDFs Accessible to Everyone",
    excerpt: "Best practices for creating accessible PDF documents that work for all users.",
    category: "Accessibility",
    date: "Jan 5, 2025",
    readTime: "4 min read",
    emoji: "♿",
  },
];

const categories = ["All", "Tutorial", "Guide", "Tips", "Security", "Education"];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-rose-50 border-b border-red-100">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">PDFMaster Blog</h1>
          <p className="text-lg text-gray-500 mt-3">
            Tips, tutorials, and guides for working with PDF files
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                cat === "All"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-red-200 hover:shadow-md transition-all"
            >
              <div className="bg-gradient-to-br from-red-50 to-rose-50 h-32 flex items-center justify-center text-5xl">
                {post.emoji}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h2 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <p className="text-xs text-gray-400 mt-3">{post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}