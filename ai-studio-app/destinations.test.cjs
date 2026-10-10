const test=require('node:test'),assert=require('node:assert/strict');
const {places}=require('./public/destinations.js');
const {prepareSelections,preparePhoto}=require('./styling.cjs');
const base={'Kiểu ảnh':'Ảnh toàn thân','Sự kiện':'Chụp ảnh','Phong cách':'Thanh lịch','Màu yêu thích':'xanh mint','Phụ kiện yêu thích':'Không dùng phụ kiện'};
const photo=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(50)]);
test('Every destination sends its actual garment, scene and customization into both Flow prompts',async()=>{
 for(const [key,p]of Object.entries(places))for(const garment of p.garments)for(const scene of p.scenes){
  const selection={...base,'Địa điểm':key,'Loại trang phục':garment,'Bối cảnh':scene,'Chi tiết phong cảnh':'Sương nhẹ, ít người','Ánh sáng':'Hoàng hôn'};
  const result=await preparePhoto.call({helpers:{getBinaryDataBuffer:async()=>photo}},{first:()=>({json:selection,binary:{photo:{}}})});
  assert.equal(result.length,2,`${key}: ${garment}, ${scene}`);
  for(const item of result){assert.equal(item.json.valid,true,item.json.userError);const prompt=item.json.aiBody.contents[0].parts[0].text;
   assert.ok(prompt.includes(garment));assert.ok(prompt.includes(scene));assert.ok(prompt.includes('Sương nhẹ, ít người'));assert.ok(prompt.includes('Hoàng hôn'));
   if(key!=='general'){assert.ok(prompt.includes(p.name));assert.ok(prompt.includes('Destination constraint'));}
  }
 }
});
test('Sa Pa rejects clothes and landscapes from another destination, unknown places and invalid lighting',()=>{
 const selection={...base,'Địa điểm':'laocai','Loại trang phục':'Váy xòe','Bối cảnh':'Bản Cát Cát'};
 const prepare=raw=>prepareSelections({first:()=>({json:raw})});
 assert.equal(prepare(selection)[0].json.input.destination,'Sa Pa');
 for(const wrong of [{'Loại trang phục':'Áo dài'},{'Bối cảnh':'Đại Nội Huế'},{'Địa điểm':'__proto__'},{'Ánh sáng':'unknown'}])assert.throws(()=>prepare({...selection,...wrong}));
});
