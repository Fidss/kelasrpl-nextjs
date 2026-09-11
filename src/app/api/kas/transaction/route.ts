import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const IMGBB_API_KEY = "a2419e396e72719a75b431c80febc0c4";

function safeNormalizeImgbbUrl(url: string): string {
  if (!url) return "";
  return url.replace(/ibb\.co(\.com)*/g, "ibb.co.com");
}

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

// POST /api/kas/transaction
// Allows bendahara and admin to add an expense or additional income
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "bendahara" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Bendahara Kelas dan Admin." },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let type = "expense";
    let category = "lainnya";
    let title = "";
    let amount = 0;
    let transactionDate = getJakartaDate();
    let description = "";
    let proofFile: File | null = null;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      type = (formData.get("type") as string) || "expense";
      category = (formData.get("category") as string) || "lainnya";
      title = ((formData.get("title") as string) || "").trim();
      amount = parseInt((formData.get("amount") as string) || "0", 10);
      transactionDate = (formData.get("transaction_date") as string) || getJakartaDate();
      description = ((formData.get("description") as string) || "").trim();
      proofFile = formData.get("proof") as File | null;
    } else {
      const body = await req.json();
      type = body.type || "expense";
      category = body.category || "lainnya";
      title = (body.title || "").trim();
      amount = parseInt(String(body.amount || 0), 10);
      transactionDate = body.transaction_date || getJakartaDate();
      description = (body.description || "").trim();
    }

    if (!title) {
      return NextResponse.json(
        { error: "Judul / keperluan transaksi wajib diisi." },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Nominal transaksi harus lebih besar dari 0." },
        { status: 400 }
      );
    }

    if (!["expense", "income"].includes(type)) {
      return NextResponse.json(
        { error: "Tipe transaksi harus 'expense' (pengeluaran) atau 'income' (pemasukan)." },
        { status: 400 }
      );
    }

    let proofUrl: string | null = null;
    let deleteUrl: string | null = null;

    // Upload receipt proof to ImgBB if provided
    if (proofFile && proofFile.size > 0) {
      if (proofFile.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran bukti foto maksimal 15 MB." },
          { status: 400 }
        );
      }

      try {
        const arrayBuffer = await proofFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const imgbbForm = new FormData();
        imgbbForm.append("image", base64Image);
        imgbbForm.append("name", `kas_proof_${Date.now()}`);

        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          {
            method: "POST",
            body: imgbbForm,
          }
        );

        const imgbbData = await imgbbRes.json();
        if (imgbbRes.ok && imgbbData?.data?.url) {
          proofUrl = safeNormalizeImgbbUrl(imgbbData.data.url);
          deleteUrl = imgbbData.data.delete_url ? safeNormalizeImgbbUrl(imgbbData.data.delete_url) : null;
        }
      } catch (imgErr) {
        console.error("Proof image upload error:", imgErr);
      }
    }

    // Insert into kas_transactions
    const result = await sql`
      INSERT INTO kas_transactions (
        type,
        category,
        title,
        amount,
        transaction_date,
        recorded_by_id,
        recorded_by_name,
        description,
        proof_url,
        delete_url,
        created_at,
        updated_at
      ) VALUES (
        ${type},
        ${category},
        ${title},
        ${amount},
        ${transactionDate},
        ${user.id},
        ${user.name},
        ${description || null},
        ${proofUrl},
        ${deleteUrl},
        (NOW() AT TIME ZONE 'Asia/Jakarta'),
        (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
      RETURNING id, type, category, title, amount, transaction_date, recorded_by_name, description, proof_url, created_at
    `;

    const tx = result[0];

    return NextResponse.json({
      success: true,
      message: `${type === "expense" ? "Pengeluaran" : "Pemasukan"} sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat!`,
      data: {
        id: Number(tx.id),
        type: tx.type,
        category: tx.category,
        title: tx.title,
        amount: Number(tx.amount),
        transaction_date: tx.transaction_date,
        recorded_by_name: tx.recorded_by_name,
        description: tx.description,
        proof_url: tx.proof_url,
        created_at: tx.created_at,
      },
    });
  } catch (error: any) {
    console.error("POST /api/kas/transaction error:", error);
    return NextResponse.json(
      { error: "Gagal mencatat transaksi kas." },
      { status: 500 }
    );
  }
}

// DELETE /api/kas/transaction?id=123
// Allows bendahara and admin to delete a transaction
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "bendahara" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Bendahara Kelas dan Admin." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parameter id transaksi wajib dikirimkan." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id, proof_url, delete_url, title, amount FROM kas_transactions WHERE id = ${id} LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    // Try deleting image from ImgBB if delete_url exists
    const tx = existing[0];
    if (tx.delete_url) {
      try {
        await fetch(tx.delete_url, { method: "GET" });
      } catch {}
    }

    await sql`DELETE FROM kas_transactions WHERE id = ${id}`;

    return NextResponse.json({
      success: true,
      message: `Transaksi "${tx.title}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/kas/transaction error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi." },
      { status: 500 }
    );
  }
}
