const express = require('express'),
    router = express.Router(),
    bookModel = require('../models/book.M'),
    bookImportModel = require('../models/bookImport.M'),
    bookImportDetailModel = require('../models/bookImportDetail.M'),
    regulationModel = require('../models/regulation.M');
router.post("/", async (req, res) => {
    const regulations = await regulationModel.all();
    let minAfterImportingRegulation = null;
    let minAfterImporting = 0;
    for (let i = 0; i < regulations.length; i++) {
        if (regulations[i].TenQuyDinh === 'Lượng tồn tối thiểu sau khi nhập') {
            minAfterImportingRegulation = regulations[i];
            break;
        }
    }
    if (minAfterImportingRegulation !== null) {
        if (minAfterImportingRegulation.TinhTrangSuDung) {
            minAfterImporting = Number(minAfterImportingRegulation.GiaTri);
        }
    }
    const books = [];
    const amount = Number(req.body.currentAmount);
    let bookId = 0;
    for (let i = 1; i <= amount; i++) {
        const book = {
            Id: bookId,
            TenSach: req.body["nameBook" + i],
            TheLoai: req.body["typeBook" + i],
            TacGia: req.body["authorBook" + i],
            DonGia: Number(req.body["priceBook" + i]),
            LuongTon: Number(req.body["amountBook" + i])
        };
        books.push(book);
    }

    //max phieu nhap sach
    const IDPNS = await bookImportModel.all();
    const bookImportRes = IDPNS.length + 1;

    let bookImport = {
        Id: bookImportRes,
        NgayNhap: req.body.importDate
    }

    //check min after importing
    for (let i = 0; i < books.length; i++) {
        const bookInDB = await bookModel.get(books[i].TenSach, books[i].TacGia);
        if (bookInDB.length) {
            if (bookInDB[0].LuongTon + Number(books[i].LuongTon) < minAfterImporting) {
                return res.render('bookImport', {
                    nav: () => 'navbar',
                    active: { bookImport: true },
                    failedAlert: "Lập phiếu nhập thất bại, do tồn tại sách " + bookInDB[0].TenSach + " có lượng tồn sau khi nhập nhỏ hơn " + minAfterImporting
                });
            }
        }
        else {
            if (Number(books[i].LuongTon) < minAfterImporting) {
                return res.render('bookImport', {
                    nav: () => 'navbar',
                    active: { bookImport: true },
                    failedAlert: "Lập phiếu nhập thất bại, do tồn tại sách " + books[i].TenSach + " có lượng tồn sau khi nhập nhỏ hơn " + minAfterImporting
                });
            }
        }
    };

    books.forEach(async (book) => {
        const bookInDB = await bookModel.get(book.TenSach, book.TacGia);
        if (bookInDB.length) {
            await bookModel.updateRest(bookInDB[0].Id, bookInDB[0].LuongTon + Number(book.LuongTon));
            bookId = bookInDB[0].Id;
        }      
        else{
            //check max id sach
            const IDS = await bookModel.all();
            bookId = IDS.length + 1;
            book.Id = bookId;
            await bookModel.add(book);
        }
        const bookImportDetail = {
            Id: bookId,
            IdPhieuNhapSach: bookImportRes,
            IdSach: bookId,
            SoLuong: book.LuongTon
        }
        await bookImportModel.add(bookImport);
        await bookImportDetailModel.add(bookImportDetail);
    });
    res.render('bookImport', {
        nav: () => 'navbar',
        active: { bookImport: true },
        alert: "Lập phiếu nhập thành công!"
    });
})
router.get('/', async (req, res) => {
    // Chặn, không cho vào trang khi chưa đăng nhập
    if (!req.user) return res.redirect('/');
    const regulations = await regulationModel.all();
    let minImportRegulation = null;
    let minImport = 1;
    for (let i = 0; i < regulations.length; i++) {
        if (regulations[i].TenQuyDinh === 'Lượng nhập tối thiểu') {
            minImportRegulation = regulations[i];
            break;
        }
    }
    if (minImportRegulation !== null) {
        if (minImportRegulation.TinhTrangSuDung) {
            minImport = Number(minImportRegulation.GiaTri);
        }
    }
    res.render('bookImport', {
        nav: () => 'navbar',
        active: { bookImport: true },
        minImport: minImport
    });
});
module.exports = router;