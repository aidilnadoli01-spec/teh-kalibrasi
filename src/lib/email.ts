import nodemailer from 'nodemailer';

// =======================
// Configure transporter
// Using Gmail SMTP — user must set env vars in .env.local
// =======================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD, // Gmail App Password (not regular password)
  },
});

// =======================
// Email Templates
// =======================

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tehkalibrasi</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 1px solid #1f1f1f; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #10b981; }
    .logo span { color: #ffffff; }
    .card { background: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 30px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 30px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .badge-green { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    .badge-yellow { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .badge-blue { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    .badge-purple { background: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }
    .price { font-size: 28px; font-weight: 800; color: #10b981; }
    .label { color: #6b7280; font-size: 13px; margin-bottom: 4px; }
    .value { color: #ffffff; font-weight: 600; margin-bottom: 12px; }
    .divider { border: none; border-top: 1px solid #1f1f1f; margin: 20px 0; }
    .footer { text-align: center; padding-top: 20px; color: #4b5563; font-size: 12px; line-height: 1.6; }
    .btn { display: inline-block; padding: 12px 28px; background: #10b981; color: #000000; font-weight: 700; text-decoration: none; border-radius: 8px; margin-top: 16px; }
    h2 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
    p { margin: 0 0 8px; color: #9ca3af; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; border-bottom: 1px solid #1f1f1f; vertical-align: top; }
    td:last-child { text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Teh<span>kalibrasi</span></div>
      <p style="color:#6b7280; font-size:13px; margin-top:6px;">The Art of Precise Brewing</p>
    </div>
    ${content}
    <div class="footer">
      <p>© 2025 Tehkalibrasi. Jakarta, Indonesia.</p>
      <p>Calibrating your tea experience, one cup at a time.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ---- Order Confirmation ----
export function orderConfirmationTemplate(order: {
  id: number;
  customer_name: string;
  total_price: number;
  payment_method: string;
  items: { product_name: string; quantity: number; price: number }[];
}) {
  const methodLabel: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    ewallet: 'E-Wallet',
    cod: 'Cash on Delivery',
  };

  const itemsHTML = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.product_name} × ${item.quantity}</td>
        <td>Rp ${Number(item.price * item.quantity).toLocaleString('id-ID')}</td>
      </tr>`
    )
    .join('');

  return baseTemplate(`
    <div class="card">
      <span class="badge badge-green">Order Confirmed</span>
      <h2 style="margin-top:16px;">Terima kasih, ${order.customer_name}!</h2>
      <p>Pesananmu telah kami terima dan sedang diproses. Berikut ringkasan pesananmu:</p>
    </div>

    <div class="card">
      <p class="label">Order ID</p>
      <p class="value">#${order.id}</p>
      <p class="label">Metode Pembayaran</p>
      <p class="value">${methodLabel[order.payment_method] || order.payment_method}</p>
      <hr class="divider"/>
      <table>${itemsHTML}</table>
      <hr class="divider"/>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#6b7280;">Total</span>
        <span class="price">Rp ${Number(order.total_price).toLocaleString('id-ID')}</span>
      </div>
    </div>

    <div class="card" style="text-align:center;">
      <p>Lacak status pesananmu kapan saja di halaman Track Order.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/track-order" class="btn">Track Pesanan</a>
    </div>
  `);
}

// ---- Payment Verified ----
export function paymentVerifiedTemplate(order: {
  id: number;
  customer_name: string;
  total_price: number;
}) {
  return baseTemplate(`
    <div class="card">
      <span class="badge badge-green">✓ Pembayaran Terverifikasi</span>
      <h2 style="margin-top:16px;">Pembayaranmu sudah dikonfirmasi!</h2>
      <p>Hei ${order.customer_name}, pembayaran untuk pesanan <strong>#${order.id}</strong> senilai <strong>Rp ${Number(order.total_price).toLocaleString('id-ID')}</strong> telah berhasil diverifikasi.</p>
    </div>
    <div class="card">
      <p>Pesananmu sekarang akan segera kami siapkan dan dikirimkan. Kamu akan menerima notifikasi lagi saat paket dalam perjalanan.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/track-order" class="btn">Lihat Status Pesanan</a>
    </div>
  `);
}

// ---- Order Shipped ----
export function orderShippedTemplate(order: {
  id: number;
  customer_name: string;
  customer_address: string;
}) {
  return baseTemplate(`
    <div class="card">
      <span class="badge badge-purple">📦 Pesanan Dikirim</span>
      <h2 style="margin-top:16px;">Paketmu dalam perjalanan!</h2>
      <p>Hei ${order.customer_name}, pesanan <strong>#${order.id}</strong> sudah dalam perjalanan menuju alamatmu.</p>
    </div>
    <div class="card">
      <p class="label">Alamat Pengiriman</p>
      <p class="value">${order.customer_address}</p>
      <hr class="divider"/>
      <p>Harap siapkan diri untuk menerima paket. Jika ada masalah pengiriman, segera hubungi kami.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/track-order" class="btn">Track Pesanan</a>
    </div>
  `);
}

// ---- Order Delivered ----
export function orderDeliveredTemplate(order: {
  id: number;
  customer_name: string;
}) {
  return baseTemplate(`
    <div class="card">
      <span class="badge badge-green">✅ Pesanan Diterima</span>
      <h2 style="margin-top:16px;">Pesananmu sudah sampai!</h2>
      <p>Hei ${order.customer_name}, pesanan <strong>#${order.id}</strong> telah berhasil dikirimkan. Semoga kamu menikmati tehmu! 🍵</p>
    </div>
    <div class="card" style="text-align:center;">
      <p>Bagikan pengalamanmu dan bantu orang lain menemukan teh terbaik mereka dengan meninggalkan ulasan.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/products" class="btn">Tulis Ulasan</a>
    </div>
  `);
}

// =======================
// Send Email Helper
// =======================
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
    console.warn('[Email] EMAIL_FROM or EMAIL_PASSWORD not configured. Skipping email send.');
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Tehkalibrasi" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email] Failed to send:', error.message);
    return { success: false, reason: error.message };
  }
}
