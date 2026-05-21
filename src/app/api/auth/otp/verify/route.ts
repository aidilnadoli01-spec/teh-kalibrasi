import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email dan kode OTP wajib diisi' }, { status: 400 });
    }

    // Get user from main users table first to see if already verified
    const users: any = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users && users.length > 0) {
      return NextResponse.json({ message: 'Email sudah terverifikasi sebelumnya. Silakan login.' });
    }

    // Get user from pending_users table
    const pending: any = await query('SELECT * FROM pending_users WHERE email = ?', [email]);
    if (!pending || pending.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = pending[0];

    // Check attempts limit (max 5)
    if (user.otp_attempt >= 5) {
      return NextResponse.json(
        { error: 'Batas percobaan verifikasi telah melebihi batas. Silakan kirim ulang OTP baru.' },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (user.otp_code !== otp) {
      // Increment attempt counter
      await query('UPDATE pending_users SET otp_attempt = otp_attempt + 1 WHERE email = ?', [email]);
      const remaining = 5 - (user.otp_attempt + 1);
      
      let errorMsg = 'Kode OTP yang Anda masukkan salah.';
      if (remaining > 0) {
        errorMsg += ` Sisa percobaan: ${remaining} kali.`;
      } else {
        errorMsg += ' Sisa percobaan habis. Silakan kirim ulang OTP baru.';
      }
      
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    const expiry = new Date(user.otp_expired_at);
    if (now > expiry) {
      return NextResponse.json(
        { error: 'Kode OTP telah kedaluwarsa. Silakan kirim ulang OTP baru.' },
        { status: 400 }
      );
    }

    // Verify user: insert into users and delete from pending_users
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Insert into users
    await query(
      'INSERT INTO users (name, email, password_hash, role, is_verified, email_verified_at) VALUES (?, ?, ?, \'customer\', 1, ?)',
      [user.name, user.email, user.password_hash, nowStr]
    );

    // Delete from pending_users
    await query('DELETE FROM pending_users WHERE email = ?', [email]);

    return NextResponse.json({
      success: true,
      message: 'Email Anda berhasil diverifikasi. Silakan login.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memproses verifikasi' }, { status: 500 });
  }
}
