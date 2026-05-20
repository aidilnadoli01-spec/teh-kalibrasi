async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/products/7', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Product 7 Updated',
        description: 'Test description',
        price: 15000.00,
        image_url: '/uploads/lemon-tea.jpg',
        stock: 20,
        category_id: null
      })
    });
    
    console.log('Status Code:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

run();
