let currentMoney = 0; // 自販機に入っているお金

// 画面が開いたら商品を読み込む
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    products.forEach((product) => {
      const isSoldOut = product.stock <= 0;
      // お金が足りているかチェック
      const canBuy = !isSoldOut && currentMoney >= product.price;

      const div = document.createElement('div');
      div.className = 'product-item';

      div.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img">
            ${isSoldOut ? '<div class="sold-out-overlay">売切</div>' : ''}
            <div style="font-size:0.7rem; font-weight:bold;">${product.price}円</div>
            
            <button 
                onclick="buy(${product.id}, ${product.price}, '${product.image}')" 
                class="buy-btn ${canBuy ? 'can-buy' : ''}" 
                ${isSoldOut ? 'disabled' : ''}
            >
                ${isSoldOut ? '×' : product.price}
            </button>
          `;
      container.appendChild(div);
    });

    // 金額表示を更新
    document.getElementById('money-display').innerText = currentMoney;
  } catch (e) {
    console.error(e);
  }
}

// お金を入れる処理
function insertCoin(amount) {
  currentMoney += amount;
  // 画面を再描画（ボタンを光らせるため）
  loadProducts();
}

// おつり（リセット）
function returnMoney() {
  if (currentMoney > 0) {
    alert('チャリン♪ ' + currentMoney + '円のおつりです');
    currentMoney = 0;
    loadProducts();
  }
}

// 購入処理
async function buy(id, price, imageSrc) {
  // お金チェック
  if (currentMoney < price) {
    alert('お金が足りません！');
    return;
  }

  const res = await fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  });

  if (res.ok) {
    // 1. お金を減らす
    currentMoney -= price;

    // 2. 「ガコン！」と落ちてくるアニメーション
    const slot = document.getElementById('dropped-product');
    slot.innerHTML = `<img src="${imageSrc}" class="drop-animation">`;

    // 3. 画面更新
    loadProducts();
  } else {
    alert('売り切れです');
  }
}

loadProducts();
