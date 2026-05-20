import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail, otpVerificationTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    // Get user
    const users: any = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = users[0];

    // If already verified
    if (user.is_verified === 1) {
      return NextResponse.json({ message: 'Email sudah terverifikasi. Silakan login.' });
    }

    const now = new Date();

    // Cooldown check (60 seconds)
    // OTP is valid for 5 minutes, so if remaining time is > 4 minutes (240 seconds),
    // it means it was requested less than 60 seconds ago.
    if (user.otp_expired_at) {
      const expiry = new Date(user.otp_expired_at);
      const diffMs = expiry.getTime() - now.getTime();
      const diffSec = Math.ceil(diffMs / 1000);
      
      // If remaining time is greater than 4 minutes (240s), cooldown is active
      if (diffSec > 240) {
        const waitSec = Math.ceil(diffSec - 240);
        return NextResponse.json(
          { error: `Tunggu ${waitSec} detik lagi sebelum mengirim ulang OTP.` },
          { status: 429 }
        );
      }
    }

    // Generate new OTP and expiry (5 minutes)
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const newExpiryStr = newExpiry.toISOString().slice(0, 19).replace('T', ' ');

    // Update database
    await query(
      'UPDATE users SET otp_code = ?, otp_expired_at = ?, otp_attempt = 0 WHERE email = ?',
      [newOtp, newExpiryStr, email]
    );

    // Send email
    const emailHtml = otpVerificationTemplate(newOtp);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verifikasi Akun Tehkalibrasi - Kode OTP Baru',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.warn('Failed to resend OTP email:', emailResult.reason);
      return NextResponse.json({ error: 'Gagal mengirim email OTP. Silakan coba sesaat lagi.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP baru berhasil dikirim ke email Anda.',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat mengirim ulang OTP' }, { status: 500 });
  }
}
