const db = require('./db');
const tbName = 'ChiTietHoaDon';
class InvoiceDetailModel {
    async add(invoiceDetail) {
        const res = await db.add(tbName, invoiceDetail);
        return res;
    }
    async getById (id) {
        const condition = `WHERE "IdHoaDon" = ${id}`;
        const res = await db.loadCondition(tbName, 'IdHoaDon', condition);
        return res;
    }
}
module.exports = new InvoiceDetailModel;