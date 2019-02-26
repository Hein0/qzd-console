var pageMethod = {
    // 电商采购渠道字典
    channel: {
        '1': true, // 苏宁易购
        '2': true,// 天猫旗舰店
        '3': true,// 国美商城
        '4': true,// 京东商城
        '5': true,// 1号店
        '6': true, // 亚马逊
        '8': true // 当当网
    },

    // 缓存
    cache: {},

    // 页面初始化
    init: function () {
        // 初始化时间选择
        pageMethod.initDateSelect();

        // 初始化表单验证
        pageMethod.initFormValidate();
        
        //初始化省份
        pageMethod.getProvince()
    },

    // 时间选择初始化
    initDateSelect: function () {
        var $collections = $('.common-date-wrap');

        $collections.each(function (index, ele) {
            var $parent = $(ele),
                $input = $parent.find('input'),
                $first = null,
                $last = null;

            if ($input.length > 1) {
                $first = $input.eq(0);
                $last = $input.eq(1);

                $first.on('focus', function () {
                    var id = $last.attr('id');
                    WdatePicker({ maxDate: '#F{$dp.$D(\'' + id + '\')||\'%y-%M-%d\'}' });
                })

                $last.on('focus', function () {
                    var id = $first.attr('id');
                    WdatePicker({ minDate: '#F{$dp.$D(\'' + id + '\')}', maxDate: '%y-%M-%d' });
                })
            } else {
                $first = $input.eq(0);

                $first.on('focus', function () {
                    WdatePicker({ maxDate: '%y-%M-%d' });
                })
            }
        })
    },

    // 表单验证初始化
    initFormValidate: function () {
        var $collections = $('.common-form-wrap');

        $collections
            .on('blur', 'input,select', function (e) {
                var $self = $(this),
                    $parent = $self.parent(),
                    type = $self.attr('data-check'),
                    checkList = [];

                if (type && !$self.prop('disabled')) {
                    checkList = type.split(',');

                    $.each(checkList, function (index, ele) {
                        return checkInput[ele] && checkInput[ele]($self, $parent);
                    });
                }

            });
    },

    // 获取表单所有数据
    getFormValue: function ($form) {
        var $collections = $form.find('input,select'),
            result = {};

        $collections.each(function (index, ele) {
            var $self = $(ele),
                name = $self.attr('name');

            !$self.prop('disabled') && name && ($self.val() !== '') && (result[name] = $self.val());
        });

        return result;
    },

    // 重置表单所有数据
    resetFormValue: function ($form) {
        $form.find('input,select,textarea').val('').removeClass('error');
    },

    // 查询结果
    searchResult: function (obj) {
        // 获取表单所有数据值
        var data = pageMethod.getFormValue($('#pageSearchForm')),
            type = $('#tradeStatus').find('.btn-primary').attr('data-key');

        data['tradeStatu'] = type;

        data['pageNum'] = (obj && obj.curr) || 1 // 默认第1页
        data['pageSize'] = (obj && obj.pageSize) || 20 // 默认一页20条数据

        $.post(base + 'trade/getInventedTradeList.do', data, function (res) {
            if (res.status == '0' && res.data) {

                if (res.data.length) {
                    pageMethod.cache.listCache = res.data;
                    $('#searchResultTable').html(doT.template($('#searchResultTableTmp').html())(res));
                } else {
                    $('#searchResultTable').html('');
                }

                // 设置分页
                setPagination({
                    elem: $('#pagination'),
                    totalCount: res.dataCount,
                    curr: data['pageNum'],
                    callback: function (obj) {
                        pageMethod.searchResult(obj);
                    }
                });
            } else if (res.status == '9999') {
                // 未登录
                window.top.location.href = '../../login.html';
            } else {
            	$('#searchResultTable').empty();
            	$('#pagination').hide()
            	$.Huimodalalert(res.message, 2000);
            }
        })
    },

	//获取省
	getProvince: function (){
		$.post(base + 'adminAddress/getArea.do',{level:1},function (res) {
			var opt = '';
			$.each(res.data, function(index,item) {
				opt += '<option value=" '+ item.code +' ">'+ item.name +'</option>'
			});
			
			$('.provinceName').append($(opt))
		})
	},
	
	//获取市
	getCity: function (Id){
		$.post(base + 'adminAddress/getArea.do',{parentId:Id},function (res) {
			var opt = '';
			$.each(res.data, function(index,item) {
				opt += '<option value=" '+ item.code +' ">'+ item.name +'</option>'
			});
			
			$('.cityName').append($(opt))
		})
	},
	
    // 获取公共字典表数据
    getCommonDict: function ($list) {
        var dict = {},
            data = $list.map(function (index, ele) {
                var $ele = $(ele);
                dict[$ele.attr('data-key')] = $ele;
                return $ele.attr('data-key');
            }).get().join(',');

        $.get(base + 'dictionary/getInfo.do', {
            type: data
        }, function (res) {
            // 渲染
            res.data && $.each(res.data, function (key, value) {
                var html = '<option value="">',
                    $ele = dict[key],
                    title = $ele.attr('data-tit');

                if (title) {
                    html += title + '</option>';
                } else {
                    html += '全部</option>';
                }

                value && $.each(value, function (key, value) {
                    html += '<option value="' + key + '">' + value + '</option>';
                });

                $ele.html(html);
            });
        });
    },

    // 格式化当前时间
    // return 2010-05-05 05:05:05
    formatNowTime: function () {
        var helper = function (val) {
            return +val < 10 ? ('0' + val) : val
        },
            time = new Date(),
            result = '';

        result += time.getFullYear() + '-' + (helper(time.getMonth() + 1)) + '-' + helper(time.getDate()) + ' ' + helper(time.getHours()) + ':' + helper(time.getMinutes()) + ':' + helper(time.getSeconds());

        return result;
    }

}

// 表单输入验证
var checkInput = {
    // 验证非空
    empty: function ($self, $parent) {
        var val = $self.val(),
            title = $parent.find('.title').text();

        if (val == '') {
            $self.addClass('error');
            $.Huimodalalert(title + '不能为空', 2000);
            return false;
        }

        $self.removeClass('error');
    },

    // 验证值必须为数字
    number: function ($self, $parent) {
        var $collections = $parent.find('input'),
            length = $collections.length,
            val = +$self.val(),
            index = 0,
            compare;

        if (val === 0) {
            $self.val('');
        }

        if (isNaN(val)) {
            $self.addClass('error');
            $.Huimodalalert('请填写一个数字值', 2000);
            return false;
        }

        if (val < 0) {
            $self.addClass('error');
            $.Huimodalalert('数字值应为正数', 2000);
            return false;
        }

        if (length > 1) {
            if ($self.get(0) == $collections.get(0)) {
                compare = +$collections.eq(1).val();
                compare = isNaN(compare) ? 0 : compare;
                if (val && compare && val > compare) {
                    $self.addClass('error');
                    $.Huimodalalert('最小值应小于最大值', 2000);
                    return false;
                }
            } else {
                compare = +$collections.eq(0).val();
                compare = isNaN(compare) ? 0 : compare;
                if (val && compare && val < compare) {
                    $self.addClass('error');
                    $.Huimodalalert('最大值应大于最小值', 2000);
                    return false;
                }
            }
        }

        $self.removeClass('error');
    },

    // 验证值必须为手机号格式
    phone: function ($self, $parent) {
        var phoneReg = /^1[3|4|5|7|8][0-9]{9}$/,
            val = $self.val();

        if (val && !(phoneReg.test(val))) {
            $self.addClass('error');
            $.Huimodalalert('手机号码格式错误', 2000);
            return false;
        }

        $self.removeClass('error');
    }
}

$(function () {

    pageMethod.init();

    // 获取公共下拉列表数据
    pageMethod.getCommonDict($('.common-slide-list'));

    // 点击查询按钮
    $('#screeBtn').click(function () {
        pageMethod.searchResult();
    })
	
    // 点击重置按钮
    $('#resetBtn').on('click', function () {
        pageMethod.resetFormValue($('#pageSearchForm'));
    })
	
	//根据省份获取市
	$('.provinceName').on('change',function () {
		var parentid = $(this).val();
		pageMethod.getCity(parentid)
	})
	
	// 订单状态点击切换
    $('#tradeStatus').on('click', 'span', function () {
        // 切换选中按钮样式
        $(this).addClass('btn-primary').siblings().removeClass('btn-primary').addClass('btn-default');

        // 清空查询条件
        pageMethod.resetFormValue($('#pageSearchForm'));

        // 查询结果
        pageMethod.searchResult();
    })
	
	//初始化实体商品虚拟商品按钮
	$('.unreal-btn').css('border-bottom','2px solid blue')
	
    // 订单列表中进行下单、发货操作
    $('#searchResultTable')
        .on('click', '.order-detail', function () {
            // 详情
            var $self = $(this),
                index = $self.closest('tr').index();

            $self.attr('data-href', 'view/order/virtualOrderDetail.html?tradeId=' + pageMethod.cache.listCache[index].tradeId);
            $self.attr('data-title', '虚拟商品订单详情');

            Hui_admin_tab($self.get());
        })

    // 导出购物订单列表
    $('#createExcel').click(function () {
        var data = pageMethod.getFormValue($('#pageSearchForm')),
            url = '';

        url = base + 'trade/exportInventedTradeList.do?fileName=虚拟商品订单详情_' + pageMethod.formatNowTime().slice(0, 10);

        $.each(data, function (key, value) {
            url += '&' + key + '=' + value;
        })

        location.href = url;
    })

    pageMethod.searchResult();

})