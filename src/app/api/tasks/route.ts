import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

// GET /api/tasks
// Fetch all class tasks / homework
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const subjectFilter = searchParams.get("subject");
    const typeFilter = searchParams.get("type");
    const statusFilter = searchParams.get("status");

    let query = sql`
      SELECT id, title, subject, teacher_name, type, deadline, deadline_time, description, status, created_by_name, created_at, updated_at
      FROM class_tasks
      WHERE 1=1
    `;

    if (subjectFilter) {
      query = sql`${query} AND subject = ${subjectFilter}`;
    }
    if (typeFilter) {
      query = sql`${query} AND type = ${typeFilter}`;
    }
    if (statusFilter) {
      query = sql`${query} AND status = ${statusFilter}`;
    }

    query = sql`${query} ORDER BY status ASC, deadline ASC, id DESC`;

    const rows = await query;
    const today = getJakartaDate();

    const tasks = rows.map((r) => {
      const deadlineStr = r.deadline
        ? typeof r.deadline === "string"
          ? r.deadline
          : r.deadline.toISOString().split("T")[0]
        : today;

      const isOverdue = deadlineStr < today && r.status === "active";

      return {
        id: Number(r.id),
        title: String(r.title),
        subject: String(r.subject),
        teacher_name: r.teacher_name ? String(r.teacher_name) : "-",
        type: String(r.type || "tugas"),
        deadline: deadlineStr,
        deadline_time: r.deadline_time ? String(r.deadline_time) : "23:59",
        description: r.description ? String(r.description) : "",
        status: isOverdue ? "overdue" : String(r.status || "active"),
        created_by_name: r.created_by_name ? String(r.created_by_name) : "Sekretaris",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      };
    });

    const canManage = user.role === "sekertaris" || user.role === "admin";

    return NextResponse.json({
      success: true,
      canManage,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      tasks,
    });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar tugas kelas." },
      { status: 500 }
    );
  }
}

// POST /api/tasks
// Create a new task (Sekretaris & Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "sekertaris" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Sekretaris Kelas dan Admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subject, teacher_name, type, deadline, deadline_time, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul tugas / PR wajib diisi." },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Mata pelajaran wajib dipilih." },
        { status: 400 }
      );
    }

    if (!deadline) {
      return NextResponse.json(
        { error: "Tenggat waktu (deadline) wajib diisi." },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO class_tasks (
        title,
        subject,
        teacher_name,
        type,
        deadline,
        deadline_time,
        description,
        status,
        created_by_id,
        created_by_name,
        created_at,
        updated_at
      ) VALUES (
        ${title.trim()},
        ${subject.trim()},
        ${(teacher_name || "").trim()},
        ${type || "tugas"},
        ${deadline},
        ${deadline_time || "23:59"},
        ${(description || "").trim()},
        'active',
        ${user.id},
        ${user.name},
        (NOW() AT TIME ZONE 'Asia/Jakarta'),
        (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
      RETURNING id, title, subject, teacher_name, type, deadline, deadline_time, description, status, created_by_name, created_at
    `;

    return NextResponse.json({
      success: true,
      message: `Tugas "${title}" berhasil ditambahkan!`,
      data: result[0],
    });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan tugas." },
      { status: 500 }
    );
  }
}

// PUT /api/tasks
// Edit an existing task or update its status (Sekretaris & Admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "sekertaris" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Sekretaris Kelas dan Admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, title, subject, teacher_name, type, deadline, deadline_time, description, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID tugas wajib dikirimkan." },
        { status: 400 }
      );
    }

    const existing = await sql`SELECT id FROM class_tasks WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan." },
        { status: 404 }
      );
    }

    const result = await sql`
      UPDATE class_tasks
      SET
        title = COALESCE(${title ? title.trim() : null}, title),
        subject = COALESCE(${subject ? subject.trim() : null}, subject),
        teacher_name = COALESCE(${teacher_name ? teacher_name.trim() : null}, teacher_name),
        type = COALESCE(${type || null}, type),
        deadline = COALESCE(${deadline || null}, deadline),
        deadline_time = COALESCE(${deadline_time || null}, deadline_time),
        description = COALESCE(${description !== undefined ? description.trim() : null}, description),
        status = COALESCE(${status || null}, status),
        updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
      WHERE id = ${id}
      RETURNING id, title, subject, teacher_name, type, deadline, deadline_time, description, status, updated_at
    `;

    return NextResponse.json({
      success: true,
      message: "Data tugas berhasil diperbarui!",
      data: result[0],
    });
  } catch (error: any) {
    console.error("PUT /api/tasks error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data tugas." },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks?id=123
// Delete a task (Sekretaris & Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "sekertaris" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Sekretaris Kelas dan Admin." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID tugas wajib dikirimkan." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id, title FROM class_tasks WHERE id = ${id} LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan." },
        { status: 404 }
      );
    }

    await sql`DELETE FROM class_tasks WHERE id = ${id}`;

    return NextResponse.json({
      success: true,
      message: `Tugas "${existing[0].title}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/tasks error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus tugas." },
      { status: 500 }
    );
  }
}
