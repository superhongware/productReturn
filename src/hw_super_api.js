import {
    Base64
} from 'js-base64';
// import $ from "jquery";
import md5 from "md5";
const base64 = Base64.encode;

export default function hwSuperApi(maindata){
  if(maindata.method===undefined){
    throw "接口缺少method参数";
  }
  let data = {
    nick: 'V5mobile',
    name: 'V5mobile',
    format: 'json',
    timestamp: parseInt(new Date().getTime()/1000).toString(),
  };
  Object.assign(data, maindata);
  data.sign = md5(base64(data.nick) + base64(data.method) + base64(data.timestamp) + base64(data.name) + base64(data.format));
  return data;
}
