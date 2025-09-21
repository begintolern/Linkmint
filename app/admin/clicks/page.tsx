import { prisma } from "@/lib/db";

export default async function AdminClicksPage({ searchParams }: { searchParams: { page?: string } }) {
  const pageSize = 25;
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    prisma.clickEvent.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true } },
        merchant: { select: { id: true, merchantName: true } },
      },
    }),
    prisma.clickEvent.count(),
  ]);

  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const prev = Math.max(1, page - 1);
  const next = Math.min(maxPage, page + 1);

  return (
    <div style={{ padding: 20 }}>
      <h1>Click Events</h1>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <a href={`?page=${prev}`} style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 8 }}>
          ← Prev
        </a>
        <a href={`?page=${next}`} style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 8 }}>
          Next →
        </a>
        <span style={{ color: "#666", fontSize: 12 }}>
          Page {page} / {maxPage} — {total} total
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Created</th>
            <th>Source</th>
            <th>URL</th>
            <th>Referer</th>
            <th>IP</th>
            <th>User</th>
            <th>Merchant</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.createdAt.toISOString()}</td>
              <td>{c.source}</td>
              <td>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>
                    {c.url}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>
                {c.referer ? (
                  <a href={c.referer} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>
                    {c.referer}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>{c.ip ?? "-"}</td>
              <td>{c.user?.email ?? "-"}</td>
              <td>{c.merchant?.merchantName ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
