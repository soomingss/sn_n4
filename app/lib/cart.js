export function cartQuantity(value){
  const quantity=Number(value);
  return Number.isFinite(quantity)?Math.max(1,Math.floor(quantity)):1;
}

export function restoreCart(saved,products){
  const next={};
  if(!saved||typeof saved!=="object"||Array.isArray(saved))return next;
  const available=new Map(products.filter(p=>p.stock_status!=="low").map(p=>[String(p.id),p]));
  for(const [id,item] of Object.entries(saved)){
    const product=available.get(String(id));
    if(product)next[id]={...product,quantity:cartQuantity(item?.quantity)};
  }
  return next;
}
