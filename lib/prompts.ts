export const KHATA_PROMPT = `You are reading a handwritten credit/udhaar register (khata) from a Pakistani kiryana or general store.

The register may be written in Urdu script, Roman Urdu, English, or a mix of all three. Amounts are in Pakistani Rupees (Rs). Dates may be in dd/mm/yyyy or written in Urdu.

For each line or entry in the register, extract:
- customerName: the customer's name in Roman/English script (transliterate if in Urdu script)
- nameUrdu: the name in Urdu script if it was originally written that way, otherwise null
- amount: the numeric rupee amount (just the number, no currency symbol)
- date: date in YYYY-MM-DD format if present, otherwise null
- note: any item description or note (e.g. "cheeni", "ata", "doodh"), otherwise null
- status: "unpaid" if there is no paid/wasooli mark, "paid" if clearly marked as received, "unclear" if ambiguous
- confidence: "high" if clearly legible, "medium" if partially clear, "low" if guessed or unclear
- rawText: the original text from that line exactly as it appears

Return only entries that appear to be customer credit/udhaar records. Ignore page numbers, shop names, or unrelated writing.
Never invent entries that aren't in the image.`;

export const SHELF_PROMPT = `You are analyzing a photo of a retail store shelf in Pakistan.

Identify each product you can see. For each item extract:
- name: the product name (e.g. "Surf Excel Powder", "Tapal Danedar Tea")
- brand: the brand name if visible, otherwise null
- size: pack size or weight if visible (e.g. "500g", "1kg"), otherwise null
- stockLevel: "full" if the shelf is well stocked, "low" if only a few items remain, "empty" if the space is empty but the label is visible
- suggestedReorderQty: a sensible reorder quantity (e.g. 6, 12, 24) based on shelf size and stock level
- confidence: "high" if clearly readable, "medium" if partially obscured, "low" if guessed

Mark empty shelf spaces as "empty" if the product label is still visible. Never invent products that aren't visible.`;
