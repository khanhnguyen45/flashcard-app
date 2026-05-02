import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.json');

export function getDb() {
  if (!fs.existsSync(dbPath)) {
    const initialData = { 
      activeVocab: [
        { en: "Apple", vi: "Quả táo" },
        { en: "Banana", vi: "Quả chuối" },
        { en: "Cat", vi: "Con mèo" },
        { en: "Dog", vi: "Con chó" },
        { en: "Elephant", vi: "Con voi" }
      ], 
      scores: [] 
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData));
    return initialData;
  }
  const raw = fs.readFileSync(dbPath);
  return JSON.parse(raw);
}

export function saveDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
