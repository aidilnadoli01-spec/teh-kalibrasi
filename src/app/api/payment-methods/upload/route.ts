import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Max 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `payment-${timestamp}.${ext}`;

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public/payments');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return relative path for serving
    const imagePath = `/payments/${filename}`;

    return NextResponse.json(
      { 
        success: true,
        imagePath,
        filename
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Payment upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload payment image: ' + error.message },
      { status: 500 }
    );
  }
}
