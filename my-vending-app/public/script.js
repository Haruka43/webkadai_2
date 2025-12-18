// 画面が開いたら商品を読み込む
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('通信エラー');
    const products = await response.json();

    const container = document.getElementById('product-list');
    container.innerHTML = ''; // 「読み込み中...」を消す

    products.forEach((product) => {
      // 在庫があるかチェック
      const isSoldOut = product.stock <= 0;

      const div = document.createElement('div');
      div.className = 'product-item';
      div.innerHTML = `
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price}円</p>
                <p class="stock ${isSoldOut ? 'red' : ''}">
                    ${isSoldOut ? '売切' : 'あと ' + product.stock + ' 個'}
                </p>
            </div>
            <button onclick="buy(${product.id})" ${isSoldOut ? 'disabled' : ''}>
                ${isSoldOut ? '×' : '購入'}
            </button>
          `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    document.getElementById('product-list').innerHTML = '<p>サーバーと通信できませんでした😢</p>';
  }
}

// 購入ボタンが押されたら
async function buy(id) {
  if (!confirm('購入しますか？')) return;

  const res = await fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  });

  if (res.ok) {
    alert('ガシャン！購入しました！');
    loadProducts(); // 画面を更新して在庫を減らす
  } else {
    alert('エラー：売り切れかシステムエラーです');
  }
}

// 最初に1回実行
loadProducts();
