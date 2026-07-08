import PDFDocument from 'pdfkit'

export function reportToPDF(report) {
  if (!report) return null

  const doc = new PDFDocument()
  const buffer = []

  doc.on('data', (chunk) => buffer.push(chunk))

  doc.fontSize(20).text('SME Sentiment Analysis Report', { align: 'center' })
  doc.fontSize(10).text(`Period: ${report.period}`, { align: 'center' })
  doc.fontSize(10).text(`Generated: ${report.generatedAt}`, { align: 'center' })
  doc.moveDown()

  doc.fontSize(14).text('Summary', { underline: true })
  doc.fontSize(11).text(`Total Comments: ${report.summary.totalComments}`)
  doc.fontSize(11).text(`Positive: ${report.summary.positive.count} (${report.summary.positive.percent}%)`)
  doc.fontSize(11).text(`Negative: ${report.summary.negative.count} (${report.summary.negative.percent}%)`)
  doc.fontSize(11).text(`Neutral: ${report.summary.neutral.count} (${report.summary.neutral.percent}%)`)
  doc.fontSize(11).text(`Avg Sentiment Score: ${report.summary.avgSentimentScore}`)
  doc.moveDown()

  doc.fontSize(14).text('Trends', { underline: true })
  report.trends.forEach((t) => {
    doc.fontSize(10).text(`${t.bucket}: +${t.positive} -${t.negative} =${t.neutral} (avg: ${t.avgScore})`)
  })
  doc.moveDown()

  doc.fontSize(14).text('Top Comments', { underline: true })
  report.topComments.slice(0, 5).forEach((c, i) => {
    doc.fontSize(10).text(`${i + 1}. [${c.sentiment}] "${c.text.substring(0, 100)}"`, { align: 'left' })
  })

  doc.end()
  return Buffer.concat(buffer)
}
