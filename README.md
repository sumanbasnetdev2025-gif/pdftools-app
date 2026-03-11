# PDFMaster 🔴

A full-featured PDF toolkit built with **Next.js 14**, **Tailwind CSS**, and **shadcn/ui**.
Inspired by iLovePDF — merge, split, compress, convert, watermark, sign and more.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 14 (App Router)             |
| Styling     | Tailwind CSS + shadcn/ui            |
| PDF Engine  | pdf-lib (client + server)           |
| PDF Render  | pdfjs-dist (page previews)          |
| File Upload | react-dropzone                      |
| State       | Zustand                             |
| Icons       | lucide-react                        |
| Language    | TypeScript                          |

---

## Getting Started

### 1. Clone and install
```bash
git clone https://github.com/yourname/pdf-master.git
cd pdf-master
npm install
```

### 2. Install all dependencies
```bash
# Core PDF
npm install pdf-lib pdfjs-dist

# File handling
npm install react-dropzone

# State
npm install zustand

# UI & icons
npm install lucide-react clsx tailwind-merge class-variance-authority

# Animations
npm install framer-motion

# File conversion utilities
npm install mammoth xlsx file-saver
npm install @types/file-saver --save-dev

# (Optional) HTML to PDF — requires Puppeteer
npm install puppeteer
```

### 3. Initialize shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog progress badge separator toast tabs tooltip dropdown-menu slider
```

### 4. Environment variables

Create a `.env.local` file:
```env
# Optional: External conversion API key (for PDF-to-Word, PDF-to-Excel)
CONVERSION_API_KEY=your_api_key_here

# Optional: App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure
```
pdf-master/
├── app/
│   ├── layout.tsx              # Root layout with Navbar
│   ├── page.tsx                # Homepage tool grid
│   ├── globals.css             # Global styles + animations
│   ├── (tools)/                # All tool pages
│   │   ├── merge/page.tsx
│   │   ├── split/page.tsx
│   │   ├── compress/page.tsx
│   │   ├── rotate/page.tsx
│   │   ├── watermark/page.tsx
│   │   ├── protect/page.tsx
│   │   ├── unlock/page.tsx
│   │   ├── sign/page.tsx
│   │   ├── organize/page.tsx
│   │   ├── page-numbers/page.tsx
│   │   ├── repair/page.tsx
│   │   ├── html-to-pdf/page.tsx
│   │   └── convert/
│   │       ├── pdf-to-word/page.tsx
│   │       ├── pdf-to-jpg/page.tsx
│   │       ├── pdf-to-excel/page.tsx
│   │       ├── pdf-to-powerpoint/page.tsx
│   │       ├── jpg-to-pdf/page.tsx
│   │       ├── word-to-pdf/page.tsx
│   │       ├── excel-to-pdf/page.tsx
│   │       └── powerpoint-to-pdf/page.tsx
│   └── api/                    # Server-side API routes
│       ├── merge/route.ts
│       ├── split/route.ts
│       ├── compress/route.ts
│       ├── rotate/route.ts
│       ├── watermark/route.ts
│       ├── protect/route.ts
│       ├── unlock/route.ts
│       ├── html-to-pdf/route.ts
│       └── convert/
│           └── pdf-to-word/route.ts
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── MobileMenu.tsx
│   ├── upload/
│   │   ├── DropZone.tsx
│   │   ├── FileCard.tsx
│   │   ├── FileList.tsx
│   │   └── UploadProgress.tsx
│   ├── tools/
│   │   ├── ToolCard.tsx
│   │   ├── ToolGrid.tsx
│   │   ├── ToolHeader.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── ProcessButton.tsx
│   └── shared/
│       ├── DownloadButton.tsx
│       ├── ErrorAlert.tsx
│       └── LoadingSpinner.tsx
├── config/
│   └── tools.ts                # All tool metadata
├── hooks/
│   ├── useFileUpload.ts
│   ├── useFileDownload.ts
│   └── usePDFProcess.ts
├── lib/
│   └── utils/
│       ├── fileValidation.ts
│       ├── fileDownload.ts
│       └── formatBytes.ts
├── store/
│   └── fileStore.ts
├── types/
│   └── index.ts
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## Features

| Tool              | Client-side | Server-side | Status |
|-------------------|-------------|-------------|--------|
| Merge PDF         | ✅          | ✅          | Ready  |
| Split PDF         | ✅          | ✅          | Ready  |
| Compress PDF      | ✅          | ✅          | Ready  |
| Rotate PDF        | ✅          | ✅          | Ready  |
| Watermark PDF     | ✅          | ✅          | Ready  |
| Protect PDF       | ✅          | ⚠️          | Needs encryption lib |
| Unlock PDF        | ✅          | ✅          | Ready  |
| Sign PDF          | ✅          | —           | Ready  |
| Organize PDF      | ✅          | —           | Ready  |
| Page Numbers      | ✅          | —           | Ready  |
| Repair PDF        | ✅          | —           | Ready  |
| JPG to PDF        | ✅          | —           | Ready  |
| PDF to JPG        | ✅          | —           | Ready  |
| HTML to PDF       | —           | ✅          | Needs Puppeteer |
| PDF to Word       | —           | ⚠️          | Needs external API |
| Word to PDF       | —           | ⚠️          | Needs external API |
| PDF to Excel      | —           | ⚠️          | Needs external API |
| Excel to PDF      | —           | ⚠️          | Needs external API |
| PDF to PowerPoint | —           | ⚠️          | Needs external API |
| PowerPoint to PDF | —           | ⚠️          | Needs external API |

---

## Adding External Conversion APIs

For tools marked ⚠️, integrate one of these services:

### Option A — Adobe PDF Services
```bash
npm install @adobe/pdfservices-node-sdk
```
[docs.adobe.com/document-services](https://developer.adobe.com/document-services)

### Option B — Zamzar API
```env
CONVERSION_API_KEY=your_zamzar_key
```
```ts
// In your route.ts
const res = await fetch("https://api.zamzar.com/v1/jobs", {
  method: "POST",
  headers: { Authorization: `Basic ${btoa(process.env.CONVERSION_API_KEY + ":")}` },
  body: formData,
});
```

### Option C — ILovePDF API
[developer.ilovepdf.com](https://developer.ilovepdf.com)

### Option D — Puppeteer (HTML to PDF only)
```bash
npm install puppeteer
```
Then uncomment the Puppeteer code in `app/api/html-to-pdf/route.ts`.

---

## Deployment

### Vercel (recommended)
```bash
npm install -g vercel
vercel deploy
```

Set environment variables in the Vercel dashboard.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Scripts
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run type-check # Run TypeScript check
```

---

## License

MIT © PDFMaster
```

---

## 🎉 Project Complete!

Here's a final summary of every file created:
```
✅ config/tools.ts
✅ types/index.ts
✅ store/fileStore.ts
✅ hooks/useFileUpload.ts
✅ hooks/useFileDownload.ts
✅ hooks/usePDFProcess.ts
✅ lib/utils/formatBytes.ts
✅ lib/utils/fileValidation.ts
✅ lib/utils/fileDownload.ts
✅ components/layout/Navbar.tsx
✅ components/layout/Footer.tsx
✅ components/layout/MobileMenu.tsx
✅ components/upload/DropZone.tsx
✅ components/upload/FileCard.tsx
✅ components/upload/FileList.tsx
✅ components/upload/UploadProgress.tsx
✅ components/shared/DownloadButton.tsx
✅ components/shared/ErrorAlert.tsx
✅ components/shared/LoadingSpinner.tsx
✅ components/tools/ToolCard.tsx
✅ components/tools/ToolGrid.tsx
✅ components/tools/ToolHeader.tsx
✅ components/tools/CategoryFilter.tsx
✅ components/tools/ProcessButton.tsx
✅ app/layout.tsx
✅ app/page.tsx
✅ app/globals.css
✅ app/(tools)/merge/page.tsx
✅ app/(tools)/split/page.tsx
✅ app/(tools)/compress/page.tsx
✅ app/(tools)/rotate/page.tsx
✅ app/(tools)/watermark/page.tsx
✅ app/(tools)/protect/page.tsx
✅ app/(tools)/unlock/page.tsx
✅ app/(tools)/sign/page.tsx
✅ app/(tools)/organize/page.tsx
✅ app/(tools)/page-numbers/page.tsx
✅ app/(tools)/repair/page.tsx
✅ app/(tools)/html-to-pdf/page.tsx
✅ app/(tools)/convert/pdf-to-word/page.tsx
✅ app/(tools)/convert/pdf-to-jpg/page.tsx
✅ app/(tools)/convert/jpg-to-pdf/page.tsx
✅ app/(tools)/convert/word-to-pdf/page.tsx
✅ app/(tools)/convert/pdf-to-excel/page.tsx
✅ app/(tools)/convert/excel-to-pdf/page.tsx
✅ app/(tools)/convert/powerpoint-to-pdf/page.tsx
✅ app/(tools)/convert/pdf-to-powerpoint/page.tsx
✅ app/api/merge/route.ts
✅ app/api/split/route.ts
✅ app/api/compress/route.ts
✅ app/api/rotate/route.ts
✅ app/api/watermark/route.ts
✅ app/api/protect/route.ts
✅ app/api/unlock/route.ts
✅ app/api/convert/pdf-to-word/route.ts
✅ app/api/html-to-pdf/route.ts
✅ tailwind.config.ts
✅ next.config.ts
✅ README.md
