import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "emails.db");
console.log(`📂 Database path: ${dbPath}`);

const db = new Database(dbPath);

try {
  // recipient 컬럼 추가
  db.prepare("ALTER TABLE emails ADD COLUMN recipient TEXT DEFAULT ''").run();
  console.log("✅ recipient 컬럼이 추가되었습니다.");
} catch (error: any) {
  if (error.message?.includes("duplicate column name")) {
    console.log("ℹ️  recipient 컬럼이 이미 존재합니다.");
  } else {
    console.error("❌ Error:", error);
  }
} finally {
  db.close();
}
