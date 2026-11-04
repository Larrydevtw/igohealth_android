// 以假的 App 全域物件測試 www/js/NativeBleAdapter.js 的事件轉換。
// 執行：node iGoHealth/native/cordova-plugin-igh-ble/test/js/adapter.test.js
const fs=require('fs'); const path=require('path'); const assert=require('assert');
const store={BT40P:'[{"DevName":"ETB05","DevAdr":"00:1E:9C:00:11:28"}]'};
global.localStorage=new Proxy(store,{get:(t,k)=>k==='getItem'?(x=>t[x]??null):k==='setItem'?((a,b)=>t[a]=String(b)):t[k],set:(t,k,v)=>(t[k]=v,true)});
let readyCb; global.document={addEventListener:(n,f)=>{readyCb=f}};
global.Log={write(){}}; global.WriteLog={write(){}};
global.$={parseJSON:JSON.parse};
global.DAOFn={Query:(d,sql,cb)=>cb('[{"DeviceModel":"ETB05"},{"DeviceModel":"ETB04"}]')};
global.WiseScripts={Format:{Date_yyyyMMddHHmm:d=>`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}};
global.AppConfig={useNativeBle:true};
const calls=[]; let listener; const acks=[];
global.window={IghBle:{on:f=>listener=f,requestPermissions:()=>Promise.resolve({granted:true}),configure:c=>{calls.push(['configure',c]);return Promise.resolve()},startScan:()=>{calls.push(['startScan']);return Promise.resolve()},stopScan:()=>calls.push(['stopScan']),ack:id=>acks.push(id)}};
const results=[], errors=[]; let initOk;
global.MSCordovaBLE={MySetting:{AutoConnect:true,ForcePair:true,FilterHistoryData:true,initCallBackFn:v=>initOk=v,ResultCallBackFn:s=>results.push(s),ErrorCallBackFn:e=>errors.push(e),ScanCallBackFn:d=>calls.push(['scan',d.name]),ConnectCallBackFn:()=>{}},
  checkHistoryLog:(t,a,v,cb)=>cb(v!=='999'), foundDevices:[], connDevices:[]};
eval(fs.readFileSync(process.argv[2]||path.join(__dirname,'../../../../www/js/NativeBleAdapter.js'),'utf8')+';global.NativeBleAdapter=NativeBleAdapter;');
readyCb();
assert(NativeBleAdapter.active);
MSCordovaBLE.btInitialize();
setTimeout(()=>{
  assert.strictEqual(initOk,true);
  const cfg=calls.find(c=>c[0]==='configure')[1];
  assert.deepStrictEqual(cfg.deviceNames,['ETB05','ETB04']); assert.strictEqual(cfg.forcePair,true);
  assert.deepStrictEqual(cfg.pairedAddresses,['00:1E:9C:00:11:28']);
  assert(calls.some(c=>c[0]==='startScan'));
  const t=new Date(2025,10,5,16,14).getTime();
  listener({type:'scanResult',name:'ETB05',address:'00:1E:9C:00:11:28',rssi:-60});
  listener({type:'reading',id:'a',model:'ETB05',address:'00:1E:9C:00:11:28',kind:'G',value:'576',bgType:0,measuredAt:t});
  listener({type:'reading',id:'a',model:'ETB05',address:'00:1E:9C:00:11:28',kind:'G',value:'576',bgType:0,measuredAt:t,replayed:true});
  listener({type:'reading',id:'b',model:'ETB05',address:'X',kind:'Err',value:'15',bgType:0,measuredAt:t});
  listener({type:'reading',id:'c',model:'ETB05',address:'X',kind:'G',value:'999',bgType:0,measuredAt:t});
  listener({type:'reading',id:'d',model:'ETB04',address:'X',kind:'NoData',value:'',bgType:0,measuredAt:t});
  listener({type:'error',code:'Err004',name:'ETB05',address:'Y'});
  listener({type:'error',code:'Err005',name:'ETB05',address:'Y',message:'Service not found'});
  // 與舊版 log 中實際字串一致：ETB05,00:1E:9C:00:11:28,2025/11/05 16:14,576,0,G
  assert.deepStrictEqual(results,['ETB05,00:1E:9C:00:11:28,2025/11/05 16:14,576,0,G','ETB05,X,2025/11/05 16:14,15,0,Err','']);
  assert.deepStrictEqual(errors,['Err006','Err007','Err004:ETB05']);
  assert.deepStrictEqual(acks,['a','a','b','c','d']);
  assert(calls.some(c=>c[0]==='scan'&&c[1]==='ETB05'));
  console.log('ADAPTER TESTS PASS');
},10);
