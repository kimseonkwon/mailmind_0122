import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "emails.db");
console.log(`📂 Database path: ${dbPath}`);

const db = new Database(dbPath);

try {
  // recipient 컬럼 확인
  const rows = db.prepare("SELECT id, subject, sender, recipient FROM emails LIMIT 5").all() as Array<{
    id: number;
    subject: string;
    sender: string;
    recipient: string | null;
  }>;
  
  console.log(`\n📧 샘플 이메일 (${rows.length}개):\n`);
  rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`제목: ${row.subject}`);
    console.log(`보낸 사람: ${row.sender}`);
    console.log(`받는 사람: ${row.recipient || '(없음)'}`);
    console.log('---');
  });
  
  // 통계
  const total = db.prepare("SELECT COUNT(*) as count FROM emails").get() as { count: number };
  const withRecipient = db.prepare("SELECT COUNT(*) as count FROM emails WHERE recipient IS NOT NULL AND recipient != ''").get() as { count: number };
  
  console.log(`\n📊 통계:`);
  console.log(`전체 이메일: ${total.count}개`);
  console.log(`받는 사람 있음: ${withRecipient.count}개`);
  console.log(`받는 사람 없음: ${total.count - withRecipient.count}개`);
} catch (error) {
  console.error("❌ Error:", error);
} finally {
  db.close();
}
