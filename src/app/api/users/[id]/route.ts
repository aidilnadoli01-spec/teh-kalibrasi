import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Basic protection: only admins should delete
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    // Don't allow deleting the current logged in user
    if (userId === (session.user as any).id) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
    }

    // Check if user has orders
    const orders: any = await query('SELECT id FROM orders WHERE user_id = ?', [userId]);
    if (orders && orders.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete user with existing orders. Delete or un-link orders first.' 
      }, { status: 400 });
    }

    await query('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const { name, email, password, role } = await request.json();

    if (!name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ambil data user lama dari database untuk memvalidasi email tidak berubah
    const existingUsers: any = await query('SELECT email FROM users WHERE id = ?', [userId]);
    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    const existingUser = existingUsers[0];

    // Validasi backend utama: email tidak boleh diubah
    if (email && email !== existingUser.email) {
      return NextResponse.json({ error: 'Email tidak dapat diubah setelah akun dibuat' }, { status: 400 });
    }

    // Update query hanya menyertakan name dan role, tanpa kolom email sama sekali demi keamanan tambahan
    let sql = 'UPDATE users SET name = ?, role = ?';
    let values = [name, role];

    if (password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += ', password_hash = ?';
      values.push(hashedPassword);
    }

    sql += ' WHERE id = ?';
    values.push(userId);

    await query(sql, values);

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
