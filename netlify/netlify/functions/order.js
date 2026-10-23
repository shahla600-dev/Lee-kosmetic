exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { statusCode: 500, body: "Not configured" };
  let d;
  try { d = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, body: "Bad request" }; }
  const clean = (v, n = 300) => String(v || "").replace(/[\u0000-\u001f]/g, " ").slice(0, n).trim();
  const items = Array.isArray(d.items) ? d.items.slice(0, 30) : [];
  if (!clean(d.name) || !clean(d.phone) || !clean(d.address) || !items.length)
    return { statusCode: 400, body: "Missing data" };
  const cur = clean(d.currency, 10);
  let total = 0;
  const lines = items.map((it) => {
    const q = Math.max(1, Math.min(99, parseInt(it.qty) || 1));
    const p = Math.max(0, Number(it.price) || 0);
    total += q * p;
    return `• ${clean(it.name, 80)} × ${q} = ${(q * p).toLocaleString("en-US")} ${cur}`;
  });
  const text =
    `🛍 طلب جديد\n\n${lines.join("\n")}\n\n` +
    `💰 المجموع النهائي: ${total.toLocaleString("en-US")} ${cur}\n\n` +
    `👤 الاسم: ${clean(d.name, 100)}\n📞 الجوال: ${clean(d.phone, 30)}\n` +
    `📍 المدينة: ${clean(d.city, 80)}\n🏠 العنوان: ${clean(d.address)}\n` +
    `📝 ملاحظات: ${clean(d.notes) || "-"}`;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return { statusCode: r.ok ? 200 : 502, body: r.ok ? "ok" : "telegram error" };
};
