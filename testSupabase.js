import { createClient } from "@supabase/supabase-js";

// Supabase project details
const supabaseUrl = "https://fizdezvlnkfiotcxkxad.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpemRlenZsbmtmaW90Y3hreGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Nzk5NzksImV4cCI6MjA3NzA1NTk3OX0.9h49FvPS3Kd32qGSvY_kkBgq1MNy0FppD3pOCDaZ5eA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Starting Supabase test...");

  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("Supabase connected, fetched data:", data);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();
