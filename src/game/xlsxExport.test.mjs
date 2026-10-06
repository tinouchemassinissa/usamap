import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbookBlob } from '../export/xlsxExport.js';

test('XLSX exporter creates a ZIP-based Excel workbook blob', async () => {
  const blob = createWorkbookBlob([
    { name: 'Session Summary', rows: [['Metric', 'Value'], ['Attempts', 4]] },
    { name: 'Attempts', rows: [['State', 'Correct'], ['Texas', true]] },
  ]);

  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.ok(bytes.length > 1000);
});
