import {
    Base64
} from 'js-base64';
import hwSuperApi from './hw_super_api';
import $ from 'jquery';
import QRcode from 'qrcode-js';



mui('.mui-scroll-wrapper').scroll();

var //api地址
    mainurl='',
    //设备当前地址promise
    nowlocationP,
    //订单地址promise
    orderlocationP,
    //店铺地址promise
    addressP,
    storedata = [],
    //每个地址的经纬度
    lng_lat = [],
    //设备当前地址经纬度
    nowlocation = [],
    //收货地址经纬度
    orderlocation = [];

// console.log(Base64.encode(JSON.stringify({orderNumber: "1829554428751832", orgCode: "work", type: "5", code: "0"})));
// eyJvcmRlck51bWJlciI6IkUyMDE2MDQyMjEwMjQ0ODA5ODkxODQxNSIsIm9yZ0NvZGUiOiJ3b3JrIiwidHlwZSI6IjEiLCJjb2RlIjoiY29kZSJ9
// eyJvcmRlck51bWJlciI6IkUyMDE2MDQyMjEwMjQ0ODA5ODkxODQxNSIsIm9yZ0NvZGUiOiJ3b3JrIiwidHlwZSI6IjIiLCJjb2RlIjoiMTIzIn0=

//取url参数
var urlParam = GetUrlParam();

//测试设置默认值
if(location.href.match('localhost')||location.href.match('192.168.')||location.href.match('127.0.0.1')){
  mainurl='http://swapi.sandbox.hongware.com';
  urlParam.action=urlParam.action?urlParam.action:{
    "orderNumber":"E20160422102448098918415",
    "orgCode":"work",
    "type":"1",
    "code":"code",
  };
}
var mmm='JTdCJTIyb3JkZXJOdW1iZXIlMjIlM0ElMjJFMjAxNjA0MjMxNjI0NDEwOTg5NDUwODUlMjIlMkMlMjJvcmdDb2RlJTIyJTNBJTIyd29yayUyMiUyQyUyMnR5cGUlMjIlM0ElMjIxJTIyJTJDJTIyY29kZSUyMiUzQSUyMjAlMjIlN0Q';
console.log(JSON.parse(decodeURIComponent(Base64.decode(mmm))));
//检测地址对不对
if (urlParam.action) {
    urlParam.action = JSON.parse(decodeURIComponent(Base64.decode(urlParam.action)));
} else {
  alert("您打开的地址有误！");
  throw "cw";
}

//type为2的时候才显示地址  否则只要显示二维码页面
if(urlParam.action.type==='2'){
  $('#onlyqrcode').remove();
  setQRcode();
}else{
  $('#storeandqrcode').remove();
  setQRcode();
  throw "不用拉数据";
}


//二维码
function setQRcode(){
  $("#output").html(`<img src='${QRcode.toDataURL(urlParam.action.orderNumber+(urlParam.action.code?','+urlParam.action.code:''), 4)}'>`);
  $("#listNo").html(urlParam.action.orderNumber);
}

let configjson = {
  orgCode:urlParam.action.orgCode,
  store: 'h5',
  op: 'h5'
};

let storesInfo = {
  method: 'V5.mobile.allocate.warehouse.search',
};

let orderInfo = {
  method: 'V5.mobile.order.info.get',
  orderNumber: urlParam.action.orderNumber,
};

//取订单数据
let orderDataP = getjsonp('orderInfoGet', Object.assign(orderInfo, configjson))
.then(dealOrder);
Promise.resolve(orderDataP)
.then(() => {
  //取附近门店信息
  getjsonp('warehouseSearch', Object.assign(storesInfo, configjson))
  .then(dealStores);
});





//我的位置查店地址
$('#nowlocation').bind('touchend', function(e) {
    // console.log(e);
    $('.nowlocationbar').show();
    $('.orderlocationbar').hide();
    nowlocationP = getNowLngLat();
    nowlocationP.then(point => {
            nowlocation = point;
        })
        .catch(data => console.log(['error', data]));
    Promise.all([addressP, nowlocationP])
        .then(() => {
          // console.log(nowlocation);
            setrange(nowlocation);
        });
});
//订单地址查门店地址
$('#orderlocation').bind('touchend', function(e) {
    $('.nowlocationbar').hide();
    $('.orderlocationbar').show();

    // console.log(e);
    Promise.all([addressP, orderlocationP])
        .then(() => {
            setrange(orderlocation);
        });
});

//取url参数
function GetUrlParam() {
  var url = location.search; //获取url中"?"符后的字串
   var theRequest = {};
   if (url.indexOf("?") != -1) {
      var str = url.substr(1);
      var strs = str.split("&");
      for(var i = 0; i < strs.length; i ++) {
         theRequest[strs[i].split("=")[0]]=(strs[i].split("=")[1]);
      }
   }
   return theRequest;
}

//处理订单信息
function dealOrder(data) {
    if (!data.isSuccess) {
        alert('加载订单数据失败，请刷新浏览器重试');
    }
    $('#orderAddress').html(data.order.logisticInfo.address);
    //取订单寄货地址经纬度
    orderlocationP = getAddressLngLat(data.order.logisticInfo.address)
        .then(point => orderlocation = point)
        .catch(data => console.log(['error', data]));
}

//调接口
function getjsonp(url, data) {
    return $.ajax({
        url: mainurl+'/openApi/dyncHongware/mobile/' + url,
        method: 'GET',
        data: hwSuperApi(data),
        dataType: 'jsonp',
        jsonp: 'callBack'
    });
}


//处理门店信息
function dealStores(data) {
    // console.log(data);
    storedata = data.stores;
    var addresses = storedata.map(s => s.address);
    // console.log(addresses);
    addressP = addresses.map(address => getAddressLngLat(address));
    //设置地址经纬度
    addressP.map((p, i) => {
        p.then(point => {
          // console.log(i,point);
            storedata[i].point = point;
        });
    });
    Promise.all(addressP, orderlocationP)
        .then(() => {
            adddom(storedata);
            setrange(orderlocation);
        });

}

//根据开始地点计算全部距离
function setrange(start, callback) {
    var endpoints = storedata.map(s => s.point);
    var rangeP = endpoints.map(end => getDrivingRoute(start, end));
    var num = 0;
    rangeP.map((p, i) => {
        p.then(data => {
          var range="未查到距离";
          if(data){
            storedata[i].range = data.tr[0].cg;
            range = (storedata[i].range / 1000).toFixed(2) + 'km';
          }
            $('.mainrange:eq(' + i + ')').html(range);
        });
    });
}

//传地址取经纬度
function getAddressLngLat(address) {
    return new Promise(function(resolve, reject) {
        var myGeo = new BMap.Geocoder();
        myGeo.getPoint(address, function(point) {
            resolve(point);
        });
    });
}

//浏览器获取当前经纬度
function getNowLngLat() {
    return new Promise(function(resolve, reject) {
        var geolocation = new BMap.Geolocation();
        geolocation.getCurrentPosition(function(r) {
          // console.log(r)
            if (this.getStatus() === 0) {
                resolve(r.point);
            } else {
                reject(this.getStatus());
            }
        }, {
            enableHighAccuracy: true
        });
    });
}

//行车距离
function getDrivingRoute(p1, p2) {
    return new Promise(function(resolve, reject) {
        if(!p2){
          resolve(null);
          return;
        }
        var map = new BMap.Map();
        var start = new BMap.Point(p1.length ? p1[0] : p1.lng, p1.length ? p1[1] : p1.lat);
        var end = new BMap.Point(p2.length ? p2[0] : p2.lng, p2.length ? p2[1] : p2.lat);
        var driving = new BMap.DrivingRoute(map, {
            onSearchComplete: onSearchComplete
        });

        function onSearchComplete(data) {
            resolve(data);
        }
        driving.search(start, end);
    });
}

//渲染页面
function adddom(store) {
    var html = [];
    for (let i = 0; i < store.length; i++) {
        html.push(`<li class="mui-table-view-cell">
        <div class="flexCon">
          <div class="flexOne">${store[i].storeName}</div>
          <span class="fontOrange">
            <span class="mui-icon iconfont icon-ditu1 fontOrange"></span>
            <span class="mainrange"></span>
          </span>
        </div>
        <p class="fontEll">${store[i].address}</p>
      </li>`);
    }
    $('#storelist').html(html);
}
