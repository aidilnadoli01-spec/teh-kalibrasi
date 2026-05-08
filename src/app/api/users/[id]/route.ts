import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Basic protection: only admins should delete
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const { name, email, password, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser: any = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: 'Email already taken by another user' }, { status: 400 });
    }

    let sql = 'UPDATE users SET name = ?, email = ?, role = ?';
    let values = [name, email, role];

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
