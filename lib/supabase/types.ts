export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "enterprise";
  files_processed: number;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface FileHistory {
  id: string;
  user_id: string;
  tool_used: string;
  input_filename: string;
  output_filename: string | null;
  input_size_bytes: number;
  output_size_bytes: number | null;
  status: "completed" | "failed" | "processing";
  error_message: string | null;
  created_at: string;
}

export interface SavedFile {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  tool_used: string | null;
  is_starred: boolean;
  created_at: string;
}