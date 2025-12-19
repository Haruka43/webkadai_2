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

      // ★変更点1: ボタンの中に値段を書かず、「購入」にするため、
      // ボタンの上に値段表示用の div を追加しました。
      div.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img">
            ${isSoldOut ? '<div class="sold-out-overlay">売切</div>' : ''}
            
            <div class="product-name">${product.name}</div>
            
            <div class="product-price">${product.price}円</div>

            <button 
                onclick="buy(${product.id}, ${product.price}, '${product.image}')" 
                class="buy-btn ${canBuy ? 'can-buy' : ''}" 
                ${isSoldOut ? 'disabled' : ''}
            >
                ${isSoldOut ? '×' : '購入'}
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
  loadProducts(); // 画面を更新（ボタンを光らせるため）
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
    currentMoney -= price;

    // ★変更点2: 出てきた商品をクリックで消す処理
    const slot = document.getElementById('dropped-product');

    // 中身を空にする
    slot.innerHTML = '';

    // 画像要素を作る
    const img = document.createElement('img');
    img.src = imageSrc;
    img.className = 'drop-animation clickable-item'; // CSSで指マークにするクラスを追加

    // クリックしたら消えるイベントを追加
    img.onclick = function () {
      this.remove();
    };

    // 画面に追加
    slot.appendChild(img);

    loadProducts();
  } else {
    alert('売り切れです');
  }
}

loadProducts();
