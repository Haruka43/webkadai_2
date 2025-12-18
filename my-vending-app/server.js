import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';

// 1. データベースの準備（ファイルがあれば読み込み、なければ作る）
const db = new DB('vending.db');

// テーブルがなければ作る
db.query(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    stock INTEGER
  )
`);

// もし中身が空っぽなら、テスト用の商品を入れる
const count = db.query('SELECT COUNT(*) FROM products')[0][0];
if (count === 0) {
  db.query('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', ['コカ・コーラ', 160, 5]);
  db.query('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', ['綾鷹', 150, 10]);
  db.query('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', ['レッドブル', 210, 3]);
  console.log('初期データをデータベースに入れました！');
}

console.log('サーバーが起動しました！ http://localhost:8000 にアクセスしてください');

// 2. リクエストを受け取る部分
serve(async (req) => {
  const url = new URL(req.url);

  // API: 商品一覧を返す
  if (url.pathname === '/api/products' && req.method === 'GET') {
    const rows = db.query('SELECT * FROM products');
    const products = rows.map(([id, name, price, stock]) => ({ id, name, price, stock }));
    return new Response(JSON.stringify(products), {
      headers: { 'content-type': 'application/json' }
    });
  }

  // API: 購入処理（在庫を減らす）
  if (url.pathname === '/api/purchase' && req.method === 'POST') {
    try {
      const body = await req.json(); // 送られてきたデータ { id: 1 }

      // 在庫チェック
      const check = db.query('SELECT stock FROM products WHERE id = ?', [body.id]);
      if (check.length === 0) return new Response('商品がない', { status: 404 });
      if (check[0][0] <= 0) return new Response('売り切れ', { status: 400 });

      // 在庫を1つ減らす
      db.query('UPDATE products SET stock = stock - 1 WHERE id = ?', [body.id]);
      return new Response(JSON.stringify({ status: 'success' }));
    } catch (e) {
      return new Response('エラー', { status: 500 });
    }
  }

  // HTMLやCSSファイルを返す処理（変更不要）
  try {
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = await Deno.readFile(`./public${path}`);

    // 拡張子に応じたContent-Typeを設定
    const headers = {};
    if (path.endsWith('.html')) headers['content-type'] = 'text/html';
    if (path.endsWith('.css')) headers['content-type'] = 'text/css';
    if (path.endsWith('.js')) headers['content-type'] = 'text/javascript';

    return new Response(file, { headers });
  } catch {
    return new Response('404 Not Found', { status: 404 });
  }
});
