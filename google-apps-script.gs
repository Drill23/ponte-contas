const SECRET = 'troque-este-codigo-no-script-e-no-app';

function doPost(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  if (SECRET && body.token !== SECRET) {
    return json({ ok: false, error: 'token_invalido' });
  }

  const archive = body.archive || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const savedAt = new Date().toISOString();
  const month = archive.month || '';
  const salary = Number(String(archive.salary || '0').replace(',', '.')) || 0;
  const bills = archive.bills || [];

  const meses = ensureSheet_(ss, 'Meses', [
    'savedAt', 'month', 'salary', 'grossTotal', 'myTotal', 'balance', 'billCount'
  ]);
  const contas = ensureSheet_(ss, 'Contas', [
    'savedAt', 'month', 'billId', 'title', 'amount', 'participants', 'share', 'person'
  ]);

  let gross = 0;
  let myTotal = 0;
  bills.forEach(function (bill) {
    const amount = Number(bill.amount) || 0;
    const participants = bill.participants && bill.participants.length ? bill.participants : ['Eu'];
    const share = amount / participants.length;
    gross += amount;
    participants.forEach(function (person) {
      if (person === 'Eu') myTotal += share;
      contas.appendRow([
        savedAt,
        month,
        bill.id || '',
        bill.title || '',
        amount,
        participants.join(', '),
        share,
        person
      ]);
    });
  });

  meses.appendRow([savedAt, month, salary, gross, myTotal, salary - myTotal, bills.length]);
  return json({ ok: true, savedAt: savedAt, month: month, bills: bills.length });
}

function doGet() {
  return json({ ok: true, app: 'Ponte Contas', message: 'Ponte ativa' });
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
