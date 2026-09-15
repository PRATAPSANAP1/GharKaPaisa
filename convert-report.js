const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Read the markdown file
const markdownPath = path.join(__dirname, 'FOURTH_MONTH_REPORT.md');
const pdfPath = path.join(__dirname, 'FOURTH_MONTH_REPORT.pdf');

console.log('Converting Markdown to PDF...');

// Try using pandoc if available
exec(`pandoc "${markdownPath}" -o "${pdfPath}" --pdf-engine=xelatex -V mainfont="Arial" -V fontsize=11pt -V geometry:margin=1in -V colorlinks=true`, (error, stdout, stderr) => {
  if (error) {
    console.error('Pandoc not available, trying alternative method...');
    
    // Alternative: Use a simple markdown-to-pdf conversion
    const marked = require('marked');
    const PDFDocument = require('pdfkit');
    
    try {
      const markdown = fs.readFileSync(markdownPath, 'utf8');
      const html = marked(markdown);
      
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });
      
      doc.pipe(fs.createWriteStream(pdfPath));
      
      // Add content
      doc.fontSize(16).font('Helvetica-Bold').text('GharKaPaisa - Fourth Month Development Report', { align: 'center' });
      doc.moveDown();
      
      // Simple text rendering (basic implementation)
      const lines = markdown.split('\n');
      let fontSize = 12;
      let isBold = false;
      
      doc.fontSize(fontSize).font('Helvetica');
      
      lines.forEach((line, index) => {
        if (line.startsWith('# ')) {
          doc.fontSize(20).font('Helvetica-Bold').text(line.replace('# ', ''), { align: 'center' });
          doc.moveDown();
          doc.fontSize(fontSize).font('Helvetica');
        } else if (line.startsWith('## ')) {
          doc.fontSize(16).font('Helvetica-Bold').text(line.replace('## ', ''), { align: 'left' });
          doc.moveDown();
          doc.fontSize(fontSize).font('Helvetica');
        } else if (line.startsWith('### ')) {
          doc.fontSize(14).font('Helvetica-Bold').text(line.replace('### ', ''), { align: 'left' });
          doc.moveDown();
          doc.fontSize(fontSize).font('Helvetica');
        } else if (line.startsWith('- **')) {
          doc.fontSize(fontSize).font('Helvetica-Bold').text(line.replace(/- \*\*/g, '• ').replace(/\*\*/g, ''), { align: 'left' });
          doc.moveDown();
          doc.fontSize(fontSize).font('Helvetica');
        } else if (line.startsWith('-')) {
          doc.fontSize(fontSize).font('Helvetica').text(line.replace(/^- /, '• '), { align: 'left' });
          doc.moveDown();
        } else if (line.trim() === '') {
          doc.moveDown();
        } else if (line.startsWith('**')) {
          doc.fontSize(fontSize).font('Helvetica-Bold').text(line.replace(/\*\*/g, ''), { align: 'left' });
          doc.moveDown();
          doc.fontSize(fontSize).font('Helvetica');
        } else {
          doc.fontSize(fontSize).font('Helvetica').text(line, { align: 'left' });
          doc.moveDown();
        }
      });
      
      doc.end();
      
      console.log('PDF generated successfully using PDFKit!');
      console.log('PDF saved to:', pdfPath);
      
    } catch (conversionError) {
      console.error('PDFKit conversion also failed:', conversionError.message);
      console.log('Please install pandoc for best results: https://pandoc.org/installing.html');
    }
  } else {
    console.log('PDF generated successfully using Pandoc!');
    console.log('PDF saved to:', pdfPath);
  }
});