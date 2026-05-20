import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail, otpVerificationTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser: any = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP code and expiry (5 minutes)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);
    // Format to MySQL DATETIME format YYYY-MM-DD HH:MM:SS
    const formattedExpiry = otpExpiredAt.toISOString().slice(0, 19).replace('T', ' ');

    const result = await query(
      'INSERT INTO users (name, email, password_hash, is_verified, otp_code, otp_expired_at, otp_attempt) VALUES (?, ?, ?, 0, ?, ?, 0)',
      [name, email, hashedPassword, otpCode, formattedExpiry]
    );

    // Send OTP email
    const emailHtml = otpVerificationTemplate(otpCode);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verifikasi Akun Tehkalibrasi - Kode OTP',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.warn('Failed to send registration OTP email:', emailResult.reason);
    }

    return NextResponse.json(
      { 
        message: 'User registered successfully. OTP has been sent to your email.', 
        id: (result as any).insertId,
        email: email
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 });
  }
}
