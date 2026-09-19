"use client";

import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";

const settingFields = [
  ["company_name","회사명"],["company_name_en","영문 회사명"],["representative_name","대표자"],
  ["business_number","사업자등록번호"],["address","주소"],["phone","전화"],["fax","팩스"],
  ["email","이메일"],["kakao_channel_url","카카오톡 채널"],["map_place_name","지도 장소명"],["map_address","지도 주소"],
];

export default function SiteEditor({settings,pages,history}){
  const router=useRouter();
  const [settingValues,setSettingValues]=useState(Object.fromEntries(settingFields.map(([key])=>[key,settings[key]||""])));
  const toAdminText=(value)=>String(value||"").replaceAll("{company_name}","[회사명]");
  const toStoredText=(value)=>String(value||"").replaceAll("[회사명]","{company_name}");
  const [contentValues,setContentValues]=useState(()=>Object.fromEntries(pages.map((page)=>[page.key,Object.fromEntries(page.rows.map((row)=>[row.content_key,{value:toAdminText(row.content_value),active:row.is_active!==false}]))])));
  const [historyValues,setHistoryValues]=useState(()=>history.map((item)=>({...item})));
  const [state,setState]=useState({saving:"",message:"",error:false});

  async function save(payload,key){
    if(state.saving)return;
    setState({saving:key,message:"",error:false});
    try{
      const res=await fetch("/api/admin/site",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload?.type==="content"?{...payload,value:toStoredText(payload.value)}:payload)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.message||"저장하지 못했습니다.");
      setState({saving:"",message:"저장되었습니다.",error:false});
      router.refresh();
    }catch(error){
      setState({saving:"",message:error.message||"저장하지 못했습니다.",error:true});
    }
  }

  return <>
    {state.message&&<div className={state.error?"loginError":"signupSuccess"} style={{marginBottom:"20px"}}>{state.message}</div>}

    <Block title="회사 기본정보">
      {settingFields.map(([key,label])=><Field key={key} label={label} value={settingValues[key]} onChange={(value)=>setSettingValues({...settingValues,[key]:value})}/>)}
      <SaveButton busy={state.saving==="settings"} onClick={()=>save({type:"settings",values:settingValues},"settings")}/>
    </Block>

    {pages.map((page)=><Block key={page.key} title={page.label} action={page.key==="company"?<AddButton onClick={()=>save({type:"core_add"},"core-add")}>+ 핵심가치 추가</AddButton>:page.key==="location"&&!contentValues.location?.parking_title?<AddButton onClick={()=>save({type:"parking_add"},"parking-add")}>+ 주차안내 추가</AddButton>:null}>
      {Object.entries(contentValues[page.key]||{}).map(([contentKey,item])=>{
        const coreMatch=page.key==="company"&&contentKey.match(/^core_value_(\d+)_title$/);
        const parkingTitle=page.key==="location"&&contentKey==="parking_title";
        const hideParkingChild=page.key==="location"&&(contentKey==="parking_label"||contentKey==="parking_description");
        const hideCoreDescription=page.key==="company"&&/^core_value_\d+_description$/.test(contentKey);
        if(hideCoreDescription||hideParkingChild)return null;
        if(parkingTitle){
          const labelItem=contentValues.location?.parking_label||{value:""};
          const descItem=contentValues.location?.parking_description||{value:""};
          return <div key={contentKey} style={{padding:"16px 0",borderBottom:"1px solid #eee"}}>
            <div style={labelRowStyle}><b>주차 안내</b></div>
            <Field label="제목" value={item.value} onChange={(next)=>setContentValues({...contentValues,location:{...contentValues.location,parking_title:{...item,value:next}}})} action={<SaveButton compact busy={state.saving==="content:location:parking_title"} onClick={()=>save({type:"content",pageKey:"location",contentKey:"parking_title",value:item.value},"content:location:parking_title")}/>}/>
            <Field label="구분" value={labelItem.value} onChange={(next)=>setContentValues({...contentValues,location:{...contentValues.location,parking_label:{...labelItem,value:next}}})} action={<SaveButton compact busy={state.saving==="content:location:parking_label"} onClick={()=>save({type:"content",pageKey:"location",contentKey:"parking_label",value:labelItem.value},"content:location:parking_label")}/>}/>
            <Field label="내용" value={descItem.value} multiline onChange={(next)=>setContentValues({...contentValues,location:{...contentValues.location,parking_description:{...descItem,value:next}}})} action={<div style={rowActionsStyle}><SaveButton compact busy={state.saving==="content:location:parking_description"} onClick={()=>save({type:"content",pageKey:"location",contentKey:"parking_description",value:descItem.value},"content:location:parking_description")}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("주차 안내를 삭제할까요?")&&save({type:"parking_delete"},"parking-delete")}>삭제</button></div>}/>
          </div>;
        }
        if(coreMatch){
          const no=coreMatch[1], descKey=`core_value_${no}_description`, desc=contentValues[page.key][descKey]||{value:"",active:item.active};
          return <div key={contentKey} style={{padding:"16px 0",borderBottom:"1px solid #eee"}}>
            <div style={labelRowStyle}><b>{`핵심가치 ${no}`}</b></div>
            <Field label="제목" value={item.value} onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:{...item,value:next}}})} action={<SaveButton compact busy={state.saving===`content:${page.key}:${contentKey}`} onClick={()=>save({type:"content",pageKey:page.key,contentKey,value:item.value},`content:${page.key}:${contentKey}`)}/>}/>
            <Field label="설명" value={desc.value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[descKey]:{...desc,value:next}}})} action={<div style={rowActionsStyle}><SaveButton compact busy={state.saving===`content:${page.key}:${descKey}`} onClick={()=>save({type:"content",pageKey:page.key,contentKey:descKey,value:desc.value},`content:${page.key}:${descKey}`)}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 핵심가치를 삭제할까요?")&&save({type:"core_delete",number:no},`core-delete:${no}`)}>삭제</button></div>}/>
          </div>;
        }
        return <Field key={contentKey} label={contentLabel(page.key,contentKey)} value={item.value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:{...item,value:next}}})} action={<SaveButton compact busy={state.saving===`content:${page.key}:${contentKey}`} onClick={()=>save({type:"content",pageKey:page.key,contentKey,value:item.value},`content:${page.key}:${contentKey}`)}/>}/>;
      })}
    </Block>)}

    <Block title="연혁" action={<AddButton onClick={()=>save({type:"history_add"},"history-add")}>+ 연혁 추가</AddButton>}>
      {historyValues.map((item,index)=><div key={item.id} style={{padding:"14px 0",borderBottom:"1px solid #e7e7e7"}}>
        <div style={labelRowStyle}>
          <b>{`연혁 ${index+1}`}</b>
          <button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 연혁을 삭제할까요?")&&save({type:"history_delete",id:item.id},`history-delete:${item.id}`)}>삭제</button>
        </div>
        <Field label="연도" value={item.year} onChange={(value)=>setHistoryValues(historyValues.map((row,i)=>i===index?{...row,year:value}:row))}/>
        <Field label="내용" value={item.content} multiline onChange={(value)=>setHistoryValues(historyValues.map((row,i)=>i===index?{...row,content:value}:row))} action={<div style={rowActionsStyle}><SaveButton compact busy={state.saving===`history:${item.id}`} onClick={()=>save({type:"history",id:item.id,year:item.year,content:item.content},`history:${item.id}`)}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 연혁을 삭제할까요?")&&save({type:"history_delete",id:item.id},`history-delete:${item.id}`)}>삭제</button></div>}/>
      </div>)}
    </Block>

    <div style={{marginTop:"32px"}}><Link href="/admin" style={backButtonStyle}>← 관리자 업무로 돌아가기</Link></div>
  </>;
}

function Block({title,children,action=null}){return <section style={{marginTop:"28px",padding:"24px",border:"1px solid #e2e8e2",borderRadius:"12px",background:"#fff"}}><div style={labelRowStyle}><h2 style={{margin:0}}>{title}</h2>{action}</div>{children}</section>}
function AddButton({children,onClick}){return <button type="button" onClick={onClick} style={{padding:"8px 12px",border:"1px solid #315f4e",background:"#fff",color:"#315f4e",borderRadius:"6px"}}>{children}</button>}

function Field({label,value,onChange,multiline=false,action=null}){
  return <div style={{padding:"12px 0",borderBottom:"1px solid #eee"}}>
    <div style={labelRowStyle}><b>{label}</b>{action}</div>
    {multiline?<textarea rows={3} value={value||""} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/>:<input value={value||""} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/>}
  </div>;
}
function SaveButton({busy,onClick,compact=false}){return <button type="button" onClick={onClick} disabled={busy} style={{...saveButtonStyle,padding:compact?"8px 16px":"10px 20px",marginTop:compact?0:"18px"}}>{busy?"저장 중...":"저장"}</button>}
const toggleStyle={display:"flex",alignItems:"center",gap:"6px",fontSize:"13px"};
const rowActionsStyle={display:"flex",alignItems:"center",gap:"10px"};
const backButtonStyle={display:"flex",width:"100%",boxSizing:"border-box",alignItems:"center",justifyContent:"center",padding:"12px 16px",background:"#315f4e",color:"#fff",textDecoration:"none",fontSize:"12px",fontWeight:600,borderRadius:"6px"};
const saveButtonStyle={border:"1px solid #315f4e",background:"#315f4e",color:"#fff",borderRadius:"6px",fontSize:"13px",fontWeight:600,cursor:"pointer",flexShrink:0};
const dangerButtonStyle={border:"1px solid #e9b9bd",background:"#f8e1e3",color:"#9b4a50",fontSize:"13px",fontWeight:600,padding:"8px 16px",borderRadius:"6px",cursor:"pointer",flexShrink:0};
const labelRowStyle={display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"8px"};
const inputStyle={display:"block",width:"100%",maxWidth:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #ccd5cc",borderRadius:"6px",font:"inherit"};

const contentLabels={
  home:{hero_eyebrow:"메인 배너 상단 문구",hero_title:"메인 배너 제목",hero_description:"메인 배너 설명",bottom_copy:"메인 하단 문구"},
  company:{intro_title:"회사소개 제목",intro_paragraph_1:"회사소개 문구 1",intro_paragraph_2:"회사소개 문구 2",intro_paragraph_3:"회사소개 문구 3"},
  history:{title:"연혁 제목",description:"연혁 소개 문구"},
  location:{title:"오시는 길 제목",description:"오시는 길 안내 문구",parking_title:"주차 안내 제목",parking_label:"주차 안내 구분",parking_description:"주차 안내 내용"},
  order_delivery:{intro_title:"주문·배송 안내 제목",intro_description:"주문·배송 소개 문구",delivery_description:"배송 안내 설명",direct_delivery_region:"직접 배송 지역",direct_delivery_description:"직접 배송 설명",parcel_region:"택배 배송 지역",parcel_description:"택배 배송 설명",notice_1:"주문 전 확인사항 1",notice_2:"주문 전 확인사항 2"}
};
function contentLabel(pageKey,key){return contentLabels[pageKey]?.[key]||key;}
