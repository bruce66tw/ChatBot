﻿
//使用jQuery繼承&擴充屬性
//checkbox(使用 html checkbox)
var _check = $.extend({}, _0input, {

    //override
    //傳回value, 不是狀態 !!, 如果無選取, 則傳回空字串
    getO: function (obj) {
        //return obj.val();
        return obj.is(':checked') ? obj.val() : '';
    },

    //override
    //set checked or not
    setO: function (obj, value) {
        //obj.val(value);
        var status = (value == "1" || value == "True" || value == true);
        obj.prop('checked', status);
    },

    //override
    //set status by object, obj可為複數
    setStatusO: function (obj, status) {
        obj.prop('disabled', !status);
    },
    
    //是否選取
    checked: function (id, box) {
        return _check.checkedO(_obj.get(id, box));
    },
    checkedD: function (dataId, box) {
        return _check.checkedO(_obj.getD(dataId, box));
    },
    checkedF: function (filter, box) {
        return _check.checkedO(_obj.getF(filter, box));
    },
    checkedO: function (obj) {
        //檢查:after虛擬類別是否存在
        //return (_check.getO(obj) == 1);
        return obj.is(':checked');
        //return (obj.next().find(':after').length > 0);
    },

    /**
     for 多筆資料only(data-id)
     產生 checkbox html 內容, 與後端 XgCheckHelper 一致
     @param {string} fid (optional)id/data-id 
     @param {string} label (optional)show label 
     @param {bool} checked default false, 是否勾選
     @param {string} value (optional) 如果null則為1
     @param {bool} editable default true, 是否可編輯
     @param {string} boxClass (optional) boxClass
     @param {string} extClass (optional) extClass
     @param {string} extProp (optional) extProp
     @return {string} html string.
    */
    //render: function (isId, id, label, checked, editable, value, onClickFn) {
    render: function (rowNo, fid, value, checked, label, editable, extClass, extProp) {
        //default
        label = label || '';
        //boxClass = boxClass || '';
        extClass = extClass || '';
        extProp = extProp || '';
        //value = value || '';
        if (label == '')
            label = '&nbsp;';
        if (_str.isEmpty(value))
            value = 1;

        //attr
        var attr = _helper.getBaseProp(rowNo, fid, value, 'checkbox', false, editable, extProp);
        if (checked)
            attr += ' checked';
        if (attr != '')
            attr = ' ' + attr;
        /*
        var attr = (extProp == '') ? '' : ' ' + extProp;
        attr += " data-id='" + fid + "'";
        attr += " value='" + value + "'";        
        if (editable !== undefined && !editable)
            attr += ' disabled';    //disabled='disabled'
        */

        var html = "" +
            "<label class='xg-check {0}'>" +
            "   <input{1}>{2}" +
            "   <span></span>" +
            "</label>";

        return _str.format(html, extClass, attr, label);
    },

    //傳回有選取的欄位(使用data-id)值的字串陣列
    getCheckedValues: function (dataId, box) {
        var rows = [];
        _obj.getF('[data-id=' + dataId + ']:checked', box).each(function (i) {
            rows[i] = this.value;
        });
        return rows;
    },

}); //class