import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import prisma from '../config/prisma.js';
import { formatDisplayDate } from '../utils/helpers.js';

class ExportService {
  async exportReportToPDF(reportId: string): Promise<Buffer> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          include: {
            department: true,
            unit: true,
          },
        },
        comments: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(report.title || 'Daily Report', 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDisplayDate(report.date)}`, 20, y);
    y += 8;
    doc.text(`Status: ${report.status.toUpperCase()}`, 20, y);
    y += 8;
    doc.text(`Staff: ${report.user.firstName} ${report.user.lastName}`, 20, y);
    
    if (report.user.department) {
      y += 8;
      doc.text(`Department: ${report.user.department.name}`, 20, y);
    }

    if (report.user.unit) {
      y += 8;
      doc.text(`Unit: ${report.user.unit.name}`, 20, y);
    }

    y += 15;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Content', 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const content = this.extractTextFromContent(report.content);
    const lines = doc.splitTextToSize(content, 170);
    
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    }

    if (report.comments.length > 0) {
      y += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Comments', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      for (const comment of report.comments) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${comment.user.firstName} ${comment.user.lastName}:`, 20, y);
        doc.setFont('helvetica', 'normal');
        y += 5;
        
        const commentLines = doc.splitTextToSize(comment.content, 160);
        for (const line of commentLines) {
          doc.text(line, 25, y);
          y += 5;
        }
        y += 5;
      }
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  async exportReportToDOCX(reportId: string): Promise<Buffer> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          include: {
            department: true,
            unit: true,
          },
        },
        comments: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        text: report.title || 'Daily Report',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    const details = [
      `Date: ${formatDisplayDate(report.date)}`,
      `Status: ${report.status.toUpperCase()}`,
      `Staff: ${report.user.firstName} ${report.user.lastName}`,
    ];

    if (report.user.department) {
      details.push(`Department: ${report.user.department.name}`);
    }
    if (report.user.unit) {
      details.push(`Unit: ${report.user.unit.name}`);
    }

    for (const detail of details) {
      children.push(
        new Paragraph({
          text: detail,
          spacing: { after: 100 },
        })
      );
    }

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        text: 'Report Content',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    const contentText = this.extractTextFromContent(report.content);
    children.push(
      new Paragraph({
        text: contentText,
        spacing: { after: 200 },
      })
    );

    if (report.comments.length > 0) {
      children.push(
        new Paragraph({
          text: 'Comments',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      for (const comment of report.comments) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${comment.user.firstName} ${comment.user.lastName}: `,
                bold: true,
              }),
              new TextRun({
                text: comment.content,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  async exportCompiledReportToPDF(compiledReportId: string): Promise<Buffer> {
    const report = await prisma.compiledReport.findUnique({
      where: { id: compiledReportId },
      include: {
        user: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error('Compiled report not found');
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(report.title, 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${formatDisplayDate(report.dateRangeStart)} - ${formatDisplayDate(report.dateRangeEnd)}`, 20, y);
    y += 8;
    doc.text(`Staff: ${report.user.firstName} ${report.user.lastName}`, 20, y);
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(11);
    const content = this.extractTextFromContent(report.content);
    const lines = doc.splitTextToSize(content, 170);
    
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  async exportCompiledReportToDOCX(compiledReportId: string): Promise<Buffer> {
    const report = await prisma.compiledReport.findUnique({
      where: { id: compiledReportId },
      include: {
        user: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error('Compiled report not found');
    }

    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        text: report.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        text: `Period: ${formatDisplayDate(report.dateRangeStart)} - ${formatDisplayDate(report.dateRangeEnd)}`,
        spacing: { after: 100 },
      })
    );

    children.push(
      new Paragraph({
        text: `Staff: ${report.user.firstName} ${report.user.lastName}`,
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        text: 'Report Content',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    const contentText = this.extractTextFromContent(report.content);
    children.push(
      new Paragraph({
        text: contentText,
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  private extractTextFromContent(content: any): string {
    if (!content) return '';
    
    if (typeof content === 'string') {
      return content.replace(/<[^>]*>/g, '').trim();
    }

    if (content?.content && Array.isArray(content.content)) {
      return content.content
        .map((node: any) => {
          if (node.type === 'text') return node.text || '';
          if (node.content) {
            return node.content.map((child: any) => child.text || '').join('');
          }
          return '';
        })
        .join(' ')
        .trim();
    }

    return '';
  }
}

export const exportService = new ExportService();
