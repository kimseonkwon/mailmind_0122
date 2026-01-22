import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "emails.db");
console.log(`📂 Database path: ${dbPath}`);

const db = new Database(dbPath);

try {
  // calendar_events 테이블의 모든 데이터 삭제
  const result = db.prepare("DELETE FROM calendar_events").run();
  console.log(`✅ ${result.changes}개의 일정을 삭제했습니다.`);
  
  // 확인
  const count = db.prepare("SELECT COUNT(*) as count FROM calendar_events").get() as { count: number };
  console.log(`📊 현재 일정 개수: ${count.count}`);
} catch (error) {
  console.error("❌ Error:", error);
} finally {
  db.close();
}
