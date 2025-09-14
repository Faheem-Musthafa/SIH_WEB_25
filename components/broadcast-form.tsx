"use client"

export default function BroadcastForm() {
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <input type="text" name="subject" placeholder="Subject" className="rounded-md border px-3 py-2" required />
      <textarea name="message" placeholder="Plain text message" className="min-h-28 rounded-md border px-3 py-2" required />
      <textarea name="html" placeholder="Optional HTML message" className="min-h-28 rounded-md border px-3 py-2" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min={1} max={500} name="chunkSize" placeholder="Chunk size (default 50)" className="rounded-md border px-3 py-2" />
        <input type="number" min={0} name="delayMs" placeholder="Delay ms between batches" className="rounded-md border px-3 py-2" />
      </div>
      <button
        onClick={async (e) => {
          const form = (e.currentTarget as HTMLButtonElement).closest("form")!
          const subject = (form.elements.namedItem("subject") as HTMLInputElement).value
          const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value
          const html = (form.elements.namedItem("html") as HTMLTextAreaElement).value || undefined
          const chunkSizeRaw = (form.elements.namedItem("chunkSize") as HTMLInputElement).value
          const delayMsRaw = (form.elements.namedItem("delayMs") as HTMLInputElement).value
          const chunkSize = chunkSizeRaw ? Number(chunkSizeRaw) : undefined
          const delayMs = delayMsRaw ? Number(delayMsRaw) : undefined
          const r = await fetch("/api/dashboard/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, message, html, chunkSize, delayMs }),
          })
          if (r.ok) {
            const j = await r.json().catch(() => ({}))
            alert(
              `Broadcast sent\n` +
                `Recipients: ${j.totalRecipients ?? '-'}\n` +
                `Batches: ${j.batches ?? '-'}\n` +
                `Accepted: ${j.accepted ?? '-'}\n` +
                `Rejected: ${j.rejected ?? '-'}\n` +
                `Failed batches: ${j.failedBatches ?? '-'}${j.errors?.length ? `\nErrors: ${j.errors.join('; ')}` : ''}`
            )
          }
          else {
            const j = await r.json().catch(() => ({}))
            alert(j.error || "Failed to send")
          }
        }}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Send Email
      </button>
    </form>
  )
}
