﻿
/**
 處理編輯畫面的多筆資料, 包含資料異動和 "檔案上傳"
   1.產生的資料(變數)包含3個欄位:
     box: box container
     deletes[]: 要刪除的Id array, 只有一個 id欄位(必須使用json格式才能傳到後端 !!)
     rows[]: 表示要異動的資料 array, 欄位為欄位名稱, 其中 :
       _fun : 表示異動種類(來自 data-fun), A(新增), 其他為修改
       _key : 主key值, from data-key, for刪除only
       _fileNo : 欄位對應到要上傳的檔案序號(>=0), -1表示無檔案, -2表示要刪除檔案
 規則:
   1.tr要放一個checkbox欄位 for 刪除資料
   2.tr最多只能有一個上傳檔案欄位(也可以沒有)
   3.tr必須有2個屬性 :
     (a).data-fun(A(新資料),U(有異動檔案),''(無異動檔案))
     (b).data-key(唯一key), 如果為多主key, 則欄位值用 "," 分隔
   4.異動欄位設定屬性 : data-id='xxx', xxx為欄位名稱
   //5.刪除按鈕固定呼叫 : _multi.onClickDeleteRows(_me.divXXX, _me.XXX)
   5.刪除按鈕固定呼叫 : _multi.onClickDeleteRows(_me.multiXXX)
   6.檔案欄位固定內容 : <input type='file' onchange='_multi.onChangeFile(this)'>
   7.在後端要自行處理上傳檔名的問題
   8.刪除多table多筆資料時, 分隔符號為: table(:), row(;), col(,), 後端必須同時配合!!
   9.多筆資料的上傳檔案暫時呼叫 _xp.tdFile(url)
 */
var _multi = {

    //分隔符號, 前後端必須一致
    tableSep: ':',  //table 分隔符號
    rowSep: ';',    //row 分隔符號
    colSep: ',',    //column 分隔符號

    /**
     * @param {string} box 
     * @param {string} checkFid checkbox data-id value
     */
    init: function (box, checkFid, oneRadio) {
        checkFid = checkFid || '_check1';
        if (oneRadio === undefined)
            oneRadio = false;
        return {
            box: box,
            rows: [],
            deletes: [],
            rowNo: 0,
            checkFid: checkFid,
            oneRadio: oneRadio,
        };
    },

    /**
     * @description 修改fun為'U' if need
     */
    onChangeFile: function (me) {
        //檢查檔案大小 50M
        if (me.files[0].size > _fun.maxFileSize) {
            _tool.msg('上傳檔案不可大於50M !');
            me.value = '';
            return;
        }

        var tr = $(me).closest('tr');
        if (tr.data('fun') == '')
            tr.data('fun', 'U');
    },

    //src: 來源資料
    //return: true/false
    onClickDeleteRows: function (src) {
        var find = false;
        if (src.deletes == null)
            src.deletes = [];
        src.box.find('[data-id=' + src.checkFid + ']:checked').each(function (index, item) {
            find = true;
            var check = $(item);
            var tr = check.closest('tr');
            var key = tr.data('key');
            if (key !== '')
                src.deletes[src.deletes.length] = key;
            //刪除資料
            tr.remove();
        });
        return find;
        //_tool.msg('請先選取資料。')
    },

    //增加一筆資料
    addRow: function (src, rowHtml) {
        src.box.append(rowHtml);
    },

    //傳回目前筆數No for add row, 同時累加目前筆數
    addRowNo: function (src) {
        src.rowNo++;
        return src.rowNo - 1;
    },

    //設定筆數位置
    setRowNo: function (src, rowNo) {
        src.rowNo = rowNo;
    },

    //檢查新資料是否有空白的檔案(依程式規則來呼叫)
    //return: 空白檔案的資料序號(base 0), -1表示無
    checkEmptyFileForNew: function (box) {
        box.find('tr').each(function (index, item) {
            var tr = $(item);
            if (tr.data('fun') === 'A') {
                var obj = tr.find(':file');
                if (obj.length === 0 || obj[0].files.length == 0)
                    return index;
            }

            //case of not found
            return -1;
        });
    },

    //傳回要異動的多筆資料(object array)
    getRows: function (src) {
        return src.rows;
    },

    //傳回要刪除的多筆資料(string)
    //return string: row之間以 ';' 區隔(後端必須配合)
    getDeletes: function (src) {
        var deletes = src.deletes;
        return (deletes === null || deletes === undefined)
            ? ''
            : deletes.join(_multi.rowSep);
    },

    /**
     @description 2個功能: 
       1.FormDate 增加上傳檔案
       2.累加多筆資料
     如果多筆資料有上傳檔案, 而且是多主key, 則要在後端自行處理上傳檔案名稱的問題 !!
     注意: radio 有2種情形(true/false):
         
     @param {object} data FormData(在外面宣告), 把上傳檔案加到這個變數裡面
     @param {array} toRows 來源多筆資料, [0]為單筆(已存在), [1]以後為多筆(開始寫入)
     @param src: container
     @param oneRadio: 
       1.false: row有自己的 radio group(default): (此時id & name不同):
         用id 找name, 取name有checked的項目取值, 再寫回 id欄位
       2.true: rows共用一個 radio group: (此時id & name相同):
     //kid: key id欄位名稱, 把key值寫到這個欄位, 如果沒有上傳檔案, 則不需要
     //setRowsFiles: function (data, src, src, kid) {
     //@return 資料筆數
    */
    //addFilesAndRows: function (data, toRows, src) {
    dataAddRows: function (data, toRows, src) {
        //if (oneRadio === undefined)
        //    oneRadio = false;
        var fileLen = data.getAll('files').length;    //目前檔案數
        var rows = [];      //要異動的多筆資料
        var fields = [];    //obj. id, type欄位
        src.box.find('tr').each(function (index, item) {
            //寫入欄位資訊 fields[id,type] (只寫第一次)
            var tr = $(item);
            if (fields.length === 0) {
                //尋找所有 data-id 的欄位
                tr.find("[data-id]").each(function (i2, item2) {
                    var obj2 = $(item2);
                    fields[i2] = {
                        //obj: obj2,
                        id: obj2.data('id'),
                        type: _field.getType(obj2),
                    };
                });
            }

            //檔案加入 formData, 欄位名稱(後端變數名稱)為 files
            var fileNo = -1;    //初始化, -1表示無檔案
            var files = tr.find(':file');
            if (files.length > 0) {
                files = files[0].files;
                if (files.length > 0) {
                    data.append('files', files[0]);
                    fileNo = fileLen;
                    fileLen++;
                }
            }

            //寫入異動資料
            //row為多筆的一筆資料, 保留欄位的名稱加底線
            var row = { _fileNo: fileNo };  //對應要上傳的檔案位置序號, -1表示無檔案
            //if (kid !== undefined && kid != '')
            //    row[kid] = tr.data('key');      //寫入key值
            row._fun = tr.data('fun');          //row fun
            row._key = tr.data('key');          //row key
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var value = '';
                var obj = tr.find('[data-id=' + field.id + ']');
                //考慮多筆的 radio 欄位是否為共用!!
                row[field.id] = (field.type == 'radio') 
                    ? (src.oneRadio)
                        ? _radio.getO(obj, src.box)
                        : _radio.get(obj.attr('name'), src.box)
                    : _field.getByType(obj, field.type, tr);
            }
            rows.push(row);
        });

        //陣列加一
        toRows[toRows.length] = rows;   //寫入外部 rows
        src.rows = rows;    //同時寫入自己的rows !!
        //return rows;
    },

    //把多筆資料顯示到 box(container)
    //rows: array, 
    //box: jquery object
    //rowsToBox: function (rows, box) {
    //}

    /*
    //選取所有checkbox
    //onClickCheckAll: function (tableId, dataFid, status) {
    onClickCheckAll: function (me, dataFid) {
        dataFid = dataFid || '_check0';
        var status = me.checked;
        $(me).closest('table').find('[data-id=' + dataFid + ']:not(:disabled)').prop('checked', status);
    },
    */

    //get field by rowNo and dataId ??
    getField: function (tbody, rowNo, dataId) {
        return tbody.find('tr').eq(rowNo).find('[data-id=' + dataId + ']');
    },

}; //class