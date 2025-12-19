import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';

// --------------------------------------------------
// 1. データベースの準備
// --------------------------------------------------
const db = new DB();

// 商品テーブル
db.query(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    stock INTEGER,
    image TEXT
  )
`);

// ★追加：売上テーブル（いつ、何が、いくらで売れたか）
db.query(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_name TEXT,
    price INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 初期データの登録
const count = db.query('SELECT COUNT(*) FROM products')[0][0];
if (count === 0) {
  console.log('初期データを投入します...');
  // ※ファイル名は現在のあなたの環境に合わせています
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', ['コーラ', 130, 10, 'drink1.png']);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', ['ヤクルト', 140, 8, 'drink2.png']);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'あったか〜いお茶',
    160,
    5,
    'drink3.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', ['コーヒー', 150, 12, 'drink4.png']);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'つめた〜い水',
    180,
    3,
    'drink5.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ジャスミン茶',
    150,
    15,
    'drink6.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ひやしあめ',
    170,
    7,
    'drink7.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'オレンジジュース',
    110,
    24,
    'drink8.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', ['ソーダ', 200, 4, 'drink9.png']);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ネクター',
    140,
    10,
    'drink10.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', ['麦茶', 100, 20, 'drink11.png']);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'なっちゃんオレンジ',
    160,
    6,
    'drink12.png'
  ]);
  console.log('初期データを入れました！');
}

console.log('サーバーが起動しました！ http://localhost:8000');

// --------------------------------------------------
// 2. API処理
// --------------------------------------------------
serve(async (req) => {
  const url = new URL(req.url);

  // ① 商品一覧 (GET)
  if (url.pathname === '/api/products' && req.method === 'GET') {
    const rows = db.query('SELECT * FROM products');
    const products = rows.map(([id, name, price, stock, image]) => ({ id, name, price, stock, image }));
    return new Response(JSON.stringify(products), { headers: { 'content-type': 'application/json' } });
  }

  // ② 購入処理 (POST) ★売上記録を追加
  if (url.pathname === '/api/purchase' && req.method === 'POST') {
    try {
      const body = await req.json();

      // 在庫と価格をチェック
      const check = db.query('SELECT name, price, stock FROM products WHERE id = ?', [body.id]);
      if (check.length === 0) return new Response('Not Found', { status: 404 });

      const [name, price, stock] = check[0];
      if (stock <= 0) return new Response('Sold Out', { status: 400 });

      // トランザクション（在庫を減らして、売上を記録する）
      db.query('UPDATE products SET stock = stock - 1 WHERE id = ?', [body.id]);
      db.query('INSERT INTO sales (product_id, product_name, price) VALUES (?, ?, ?)', [body.id, name, price]);

      return new Response(JSON.stringify({ status: 'success' }));
    } catch (e) {
      console.error(e);
      return new Response('Error', { status: 500 });
    }
  }

  // ③ 在庫補充 (POST)
  if (url.pathname === '/api/restock' && req.method === 'POST') {
    try {
      const body = await req.json();
      db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [body.amount, body.id]);
      return new Response(JSON.stringify({ status: 'success' }));
    } catch {
      return new Response('Error', { status: 500 });
    }
  }

  // ④ ★追加：売上データの取得 (GET)
  if (url.pathname === '/api/sales' && req.method === 'GET') {
    // 総売上金額
    const total = db.query('SELECT SUM(price) FROM sales')[0][0] || 0;
    // 売上履歴（最新10件）
    const history = db.query('SELECT product_name, price, created_at FROM sales ORDER BY id DESC LIMIT 10');

    const data = {
      total: total,
      history: history.map(([name, price, date]) => ({ name, price, date }))
    };
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  }

  // ファイル配信
  try {
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = await Deno.readFile(`.${path}`);
    const headers = {};
    if (path.endsWith('.html')) headers['content-type'] = 'text/html';
    if (path.endsWith('.css')) headers['content-type'] = 'text/css';
    if (path.endsWith('.js')) headers['content-type'] = 'text/javascript';
    if (path.endsWith('.png')) headers['content-type'] = 'image/png';
    if (path.endsWith('.jpg')) headers['content-type'] = 'image/jpeg';
    if (path.endsWith('.jpeg')) headers['content-type'] = 'image/jpeg';
    return new Response(file, { headers });
  } catch {
    return new Response('404 Not Found', { status: 404 });
  }
});
