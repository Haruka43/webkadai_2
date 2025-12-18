import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';

const db = new DB('vending.db');

db.query(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    stock INTEGER,
    image TEXT
  )
`);

const count = db.query('SELECT COUNT(*) FROM products')[0][0];
if (count === 0) {
  console.log('初期データを投入します...');

  // ファイル名（drink1〜12）に合わせて修正しました！
  // ※ drink10だけ jpeg になっていたので合わせています
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'あったか〜いお茶',
    130,
    10,
    'drink1.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ジャスミンティー',
    140,
    8,
    'drink2.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'クラシックコーラ',
    160,
    5,
    'drink3.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'オレンジジュース',
    150,
    12,
    'drink4.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ひやしあめ',
    180,
    3,
    'drink5.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    '三ツ矢サイダー風',
    150,
    15,
    'drink6.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'とろけるピーチ',
    170,
    7,
    'drink7.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'つめた〜いお水',
    110,
    24,
    'drink8.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    '濃厚乳酸菌',
    200,
    4,
    'drink9.png'
  ]);

  // スクショで見たら drink10 だけ jpeg でした
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ブラックコーヒー',
    140,
    10,
    'drink10.jpeg'
  ]);

  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'ミネラルウォーター',
    100,
    20,
    'drink11.png'
  ]);
  db.query('INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)', [
    'マミー風ドリンク',
    160,
    6,
    'drink12.png'
  ]);

  console.log('初期データを入れました！');
}

console.log('サーバーが起動しました！ http://localhost:8000');

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === '/api/products' && req.method === 'GET') {
    const rows = db.query('SELECT * FROM products');
    const products = rows.map(([id, name, price, stock, image]) => ({ id, name, price, stock, image }));
    return new Response(JSON.stringify(products), { headers: { 'content-type': 'application/json' } });
  }

  if (url.pathname === '/api/purchase' && req.method === 'POST') {
    try {
      const body = await req.json();
      const check = db.query('SELECT stock FROM products WHERE id = ?', [body.id]);
      if (check.length === 0) return new Response('Not Found', { status: 404 });
      if (check[0][0] <= 0) return new Response('Sold Out', { status: 400 });
      db.query('UPDATE products SET stock = stock - 1 WHERE id = ?', [body.id]);
      return new Response(JSON.stringify({ status: 'success' }));
    } catch {
      return new Response('Error', { status: 500 });
    }
  }

  if (url.pathname === '/api/restock' && req.method === 'POST') {
    try {
      const body = await req.json();
      db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [body.amount, body.id]);
      return new Response(JSON.stringify({ status: 'success' }));
    } catch {
      return new Response('Error', { status: 500 });
    }
  }

  try {
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = await Deno.readFile(`./public${path}`);
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
