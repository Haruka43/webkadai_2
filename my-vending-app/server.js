import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
// ★これを使います！記事で紹介されている「ファイルを自動で配信する機能」
import { serveDir } from 'https://deno.land/std@0.140.0/http/file_server.ts';

// --------------------------------------------------
// 1. データベース設定（メモリモードでエラー回避）
// --------------------------------------------------
const db = new DB();

// テーブル作成
db.query(
  `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price INTEGER, stock INTEGER, image TEXT)`
);
db.query(
  `CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, product_name TEXT, price INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

// 初期データ投入
const count = db.query('SELECT COUNT(*) FROM products')[0][0];
if (count === 0) {
  const items = [
    ['あったか〜いお茶', 130, 10, 'drink1.png'],
    ['ジャスミンティー', 140, 8, 'drink2.png'],
    ['クラシックコーラ', 160, 5, 'drink3.png'],
    ['オレンジジュース', 150, 12, 'drink4.png'],
    ['ひやしあめ', 180, 3, 'drink5.png'],
    ['三ツ矢サイダー風', 150, 15, 'drink6.png'],
    ['とろけるピーチ', 170, 7, 'drink7.png'],
    ['つめた〜いお水', 110, 24, 'drink8.png'],
    ['濃厚乳酸菌', 200, 4, 'drink9.png'],
    ['ブラックコーヒー', 140, 10, 'drink10.jpeg'],
    ['ミネラルウォーター', 100, 20, 'drink11.png'],
    ['マミー風ドリンク', 160, 6, 'drink12.png']
  ];
  for (const item of items) db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', item);
}

// --------------------------------------------------
// 2. サーバー処理
// --------------------------------------------------
serve(async (req) => {
  const url = new URL(req.url);

  // --- API処理（ここまでの自販機の動き） ---

  // 商品一覧
  if (url.pathname === '/api/products' && req.method === 'GET') {
    const rows = db.query('SELECT * FROM products');
    const data = rows.map((r) => ({ id: r[0], name: r[1], price: r[2], stock: r[3], image: r[4] }));
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  }

  // 購入
  if (url.pathname === '/api/purchase' && req.method === 'POST') {
    try {
      const body = await req.json();
      const check = db.query('SELECT name, price, stock FROM products WHERE id = ?', [body.id]);
      if (!check.length || check[0][2] <= 0) return new Response('Error', { status: 400 });

      db.query('UPDATE products SET stock = stock - 1 WHERE id = ?', [body.id]);
      db.query('INSERT INTO sales (product_id, product_name, price) VALUES (?, ?, ?)', [
        body.id,
        check[0][0],
        check[0][1]
      ]);
      return new Response(JSON.stringify({ status: 'success' }));
    } catch {
      return new Response('Error', { status: 500 });
    }
  }

  // 補充
  if (url.pathname === '/api/restock' && req.method === 'POST') {
    const body = await req.json();
    db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [body.amount, body.id]);
    return new Response(JSON.stringify({ status: 'success' }));
  }

  // 売上確認
  if (url.pathname === '/api/sales' && req.method === 'GET') {
    const total = db.query('SELECT SUM(price) FROM sales')[0][0] || 0;
    const history = db.query('SELECT product_name, price, created_at FROM sales ORDER BY id DESC LIMIT 10');
    return new Response(
      JSON.stringify({ total, history: history.map((h) => ({ name: h[0], price: h[1], date: h[2] })) }),
      { headers: { 'content-type': 'application/json' } }
    );
  }

  // --- ★ここが記事の内容！ ---
  // API以外のURLに来たら、自動でファイルを探して返してくれる便利な機能
  // これなら「パスが違う」というミスが起きません
  return serveDir(req, {
    fsRoot: '.', // 今の場所にあるファイルを探す
    urlRoot: '', // URLそのまま
    enableCors: true // スマホ等からも見れるように許可
  });
});
