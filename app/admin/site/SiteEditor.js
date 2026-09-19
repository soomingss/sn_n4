"use client";

import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {IconClipboardText,IconPackage,IconChecklist,IconTruckDelivery,IconLeaf,IconShieldCheck,IconCertificate,IconBuildingWarehouse,IconHeartHandshake,IconBox,IconPackages,IconShoppingCart,IconReceipt,IconFileText,IconClock,IconCalendar,IconMapPin,IconHome,IconBuilding,IconPhone,IconMail,IconMessageCircle,IconUser,IconUsers,IconStar,IconSparkles,IconHeart,IconPlant,IconSeedling,IconFlask,IconMicroscope,IconScale,IconRosetteDiscountCheck,IconCircleCheck,IconCircleNumber1,IconArrowRight,IconRoute,IconCar,IconTruck,IconWorld,IconSearch} from "@tabler/icons-react";

const settingFields = [
  ["company_name","회사명"],["company_name_en","영문 회사명"],["representative_name","대표자"],
  ["business_number","사업자등록번호"],["address","주소"],["phone","전화"],["fax","팩스"],
  ["email","이메일"],["kakao_channel_url","카카오톡 채널"],["map_place_name","지도 장소명"],["map_address","지도 주소"],
];

export default function SiteEditor({settings,pages,history}){
  const router=useRouter();
  const [settingValues,setSettingValues]=useState(Object.fromEntries(settingFields.map(([key])=>[key,settings[key]||""])));
  const [contentValues,setContentValues]=useState(()=>Object.fromEntries(pages.map((page)=>[page.key,Object.fromEntries(page.rows.map((row)=>[row.content_key,{value:row.content_value||"",active:row.is_active!==false}]))])));
  const [historyValues,setHistoryValues]=useState(()=>history.map((item)=>({...item})));
  const [state,setState]=useState({saving:"",message:"",error:false});
  const [activeSection,setActiveSection]=useState(null);

  async function save(payload,key){
    if(state.saving)return;
    setState({saving:key,message:"",error:false});
    try{
      const res=await fetch("/api/admin/site",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
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

    {!activeSection&&<SectionMenu onOpen={setActiveSection}/>}

    {activeSection==="settings"&&<><SectionBack onClick={()=>setActiveSection(null)}/><Block title="회사 기본정보">
      {settingFields.map(([key,label])=><Field key={key} label={label} value={settingValues[key]} onChange={(value)=>setSettingValues({...settingValues,[key]:value})}/>)}
      <SaveButton busy={state.saving==="settings"} onClick={()=>save({type:"settings",values:settingValues},"settings")}/>
    </Block></>}

    {activeSection&&activeSection!=="settings"&&activeSection!=="history"&&<><SectionBack onClick={()=>setActiveSection(null)}/>{pages.filter((page)=>page.key===activeSection).map((page)=><Block key={page.key} title={page.label} action={page.key==="company"?<div style={rowActionsStyle}><AddButton onClick={()=>save({type:"intro_add"},"intro-add")}>+ 회사소개 문단 추가</AddButton><AddButton onClick={()=>save({type:"core_add"},"core-add")}>+ 핵심가치 추가</AddButton></div>:page.key==="order_delivery"?<AddButton onClick={()=>save({type:"delivery_step_add"},"delivery-step-add")}>+ 배송단계 추가</AddButton>:page.key==="location"&&!contentValues.location?.parking_title?<AddButton onClick={()=>save({type:"parking_add"},"parking-add")}>+ 주차안내 추가</AddButton>:null}>
      {Object.entries(contentValues[page.key]||{}).map(([contentKey,item])=>{
        const coreMatch=page.key==="company"&&contentKey.match(/^core_value_(\d+)_title$/);
        const introMatch=page.key==="company"&&contentKey.match(/^intro_paragraph_(\d+)$/);
        const deliveryStepMatch=page.key==="order_delivery"&&contentKey.match(/^delivery_step_(\d+)_title$/);
        const parkingTitle=page.key==="location"&&contentKey==="parking_title";
        const hideParkingChild=page.key==="location"&&(contentKey==="parking_label"||contentKey==="parking_description");
        const hideCoreDescription=page.key==="company"&&/^core_value_\d+_description$/.test(contentKey);
        if(hideCoreDescription||hideParkingChild)return null;
        if(introMatch){
          return <div key={contentKey} style={{padding:"16px 0",borderBottom:"1px solid #eee"}}>
            <Field label={`회사소개 문구 ${introMatch[1]}`} value={item.value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:{...item,value:next}}})}/>
            <div style={groupActionsStyle}><SaveButton compact busy={state.saving===`content:${page.key}:${contentKey}`} onClick={()=>save({type:"content",pageKey:page.key,contentKey,value:item.value},`content:${page.key}:${contentKey}`)}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 회사소개 문단을 삭제할까요?")&&save({type:"intro_delete",contentKey},`intro-delete:${contentKey}`)}>삭제</button></div>
          </div>;
        }
        if(deliveryStepMatch){
          const no=deliveryStepMatch[1], descKey=`delivery_step_${no}_description`, iconKey=`delivery_step_${no}_icon`;
          const desc=contentValues[page.key][descKey]||{value:""}, icon=contentValues[page.key][iconKey]||{value:"order"};
          return <div key={contentKey} style={{padding:"16px 0",borderBottom:"1px solid #eee"}}>
            <div style={labelRowStyle}><b>{`배송단계 ${no}`}</b></div>
            <SelectField label="아이콘" value={icon.value} onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[iconKey]:{...icon,value:next}}})}/>
            <Field label="제목" value={item.value} onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:{...item,value:next}}})}/>
            <Field label="설명" value={desc.value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[descKey]:{...desc,value:next}}})}/>
            <div style={groupActionsStyle}><SaveButton compact busy={state.saving===`delivery-step:${no}`} onClick={()=>save({type:"content_group",items:[{pageKey:page.key,contentKey,value:item.value},{pageKey:page.key,contentKey:descKey,value:desc.value},{pageKey:page.key,contentKey:iconKey,value:icon.value}]},`delivery-step:${no}`)}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 배송단계를 삭제할까요?")&&save({type:"delivery_step_delete",number:no},`delivery-step-delete:${no}`)}>삭제</button></div>
          </div>;
        }
        if(parkingTitle){
          const labelItem=contentValues.location?.parking_label||{value:""};
          const descItem=contentValues.location?.parking_description||{value:""};
          return <div key={contentKey} style={{padding:"16px 0",borderBottom:"1px solid #eee"}}>
            <div style={labelRowStyle}><b>주차 안내</b></div>
            <Field label="제목" value={item.value} onChange={(next)=>setContentValues({...contentValues,location:{...contentValues.location,parking_title:{...item,value:next}}})}/>
            <Field label="구분" value={labelItem.value} onChange={(next)=>setContentValues({...contentValues,location:{...contentValues.location,parking_label:{...labelItem,value:next}}})}/>
            <Field label="내용" value={descItem.value} multiline onChange={(next)=>setContentValues({...contentValues,location:{...contentValues.location,parking_description:{...descItem,value:next}}})}/>
            <div style={groupActionsStyle}><SaveButton compact busy={state.saving==="parking-group"} onClick={()=>save({type:"content_group",items:[{pageKey:"location",contentKey:"parking_title",value:item.value},{pageKey:"location",contentKey:"parking_label",value:labelItem.value},{pageKey:"location",contentKey:"parking_description",value:descItem.value}]},"parking-group")}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("주차 안내를 삭제할까요?")&&save({type:"parking_delete"},"parking-delete")}>삭제</button></div>
          </div>;
        }
        if(coreMatch){
          const no=coreMatch[1], descKey=`core_value_${no}_description`, desc=contentValues[page.key][descKey]||{value:"",active:item.active};
          return <div key={contentKey} style={{padding:"16px 0",borderBottom:"1px solid #eee"}}>
            <div style={labelRowStyle}><b>{`핵심가치 ${no}`}</b></div>
            <Field label="제목" value={item.value} onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:{...item,value:next}}})}/>
            <Field label="설명" value={desc.value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[descKey]:{...desc,value:next}}})}/>
            <div style={groupActionsStyle}><SaveButton compact busy={state.saving===`core-group:${no}`} onClick={()=>save({type:"content_group",items:[{pageKey:page.key,contentKey,value:item.value},{pageKey:page.key,contentKey:descKey,value:desc.value}]},`core-group:${no}`)}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 핵심가치를 삭제할까요?")&&save({type:"core_delete",number:no},`core-delete:${no}`)}>삭제</button></div>
          </div>;
        }
        return <Field key={contentKey} label={contentLabel(page.key,contentKey)} value={item.value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:{...item,value:next}}})} action={<SaveButton compact busy={state.saving===`content:${page.key}:${contentKey}`} onClick={()=>save({type:"content",pageKey:page.key,contentKey,value:item.value},`content:${page.key}:${contentKey}`)}/>}/>;
      })}
    </Block>)}</>}

    {activeSection==="history"&&<><SectionBack onClick={()=>setActiveSection(null)}/><Block title="연혁" action={<AddButton onClick={()=>save({type:"history_add"},"history-add")}>+ 연혁 추가</AddButton>}>
      {historyValues.map((item,index)=><div key={item.id} style={{padding:"14px 0",borderBottom:"1px solid #e7e7e7"}}>
        <div style={labelRowStyle}><b>{`연혁 ${index+1}`}</b></div>
        <Field label="연도" value={item.year} onChange={(value)=>setHistoryValues(historyValues.map((row,i)=>i===index?{...row,year:value}:row))}/>
        <Field label="내용" value={item.content} multiline onChange={(value)=>setHistoryValues(historyValues.map((row,i)=>i===index?{...row,content:value}:row))}/>
        <div style={groupActionsStyle}><SaveButton compact busy={state.saving===`history:${item.id}`} onClick={()=>save({type:"history",id:item.id,year:item.year,content:item.content},`history:${item.id}`)}/><button type="button" style={dangerButtonStyle} onClick={()=>confirm("이 연혁을 삭제할까요?")&&save({type:"history_delete",id:item.id},`history-delete:${item.id}`)}>삭제</button></div>
      </div>)}
    </Block></>}

    <div style={{marginTop:"32px"}}><Link href="/admin" style={backButtonStyle}>← 관리자 업무로 돌아가기</Link></div>
  </>;
}

function SectionMenu({onOpen}){
  const items=[["settings","회사 기본정보","회사명, 연락처, 주소 등"],["home","메인","메인 화면 문구"],["company","회사소개","회사소개 문구와 핵심가치"],["history","연혁","연혁 소개 및 연혁 목록"],["location","오시는 길","지도 안내와 주차 안내"],["order_delivery","주문·배송 안내","배송단계와 배송 안내 문구"]];
  return <div style={sectionGridStyle}>{items.map(([key,title,desc])=><button key={key} type="button" onClick={()=>onOpen(key)} style={sectionCardStyle}><b>{title}</b><span>{desc}</span><em>수정하기 →</em></button>)}</div>;
}
function SectionBack({onClick}){return <button type="button" onClick={onClick} style={sectionBackStyle}>← 화면 목록으로</button>}
function Block({title,children,action=null}){return <section style={{marginTop:"28px",padding:"24px",border:"1px solid #e2e8e2",borderRadius:"12px",background:"#fff"}}><div style={labelRowStyle}><h2 style={{margin:0}}>{title}</h2>{action}</div>{children}</section>}
function AddButton({children,onClick}){return <button type="button" onClick={onClick} style={{padding:"8px 12px",border:"1px solid #315f4e",background:"#fff",color:"#315f4e",borderRadius:"6px"}}>{children}</button>}

function Field({label,value,onChange,multiline=false,action=null}){
  return <div style={{padding:"12px 0",borderBottom:"1px solid #eee"}}>
    <div style={labelRowStyle}><b>{label}</b>{action}</div>
    {multiline?<textarea rows={3} value={value||""} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/>:<input value={value||""} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/>}
  </div>;
}
const iconOptions=[
  ["order","주문서",IconClipboardText],["stock","재고 박스",IconPackage],["check","검수 체크",IconChecklist],["truck","배송 트럭",IconTruckDelivery],
  ["leaf","잎",IconLeaf],["shield","품질·보호",IconShieldCheck],["certificate","인증서",IconCertificate],["warehouse","창고",IconBuildingWarehouse],
  ["handshake","협력",IconHeartHandshake],["box","박스",IconBox],["packages","상품 묶음",IconPackages],["cart","장바구니",IconShoppingCart],
  ["receipt","주문내역",IconReceipt],["file","문서",IconFileText],["clock","시간",IconClock],["calendar","일정",IconCalendar],
  ["map","위치",IconMapPin],["home","홈",IconHome],["building","회사",IconBuilding],["phone","전화",IconPhone],
  ["mail","메일",IconMail],["message","문의",IconMessageCircle],["user","사용자",IconUser],["users","거래처",IconUsers],
  ["star","추천",IconStar],["sparkles","엄선",IconSparkles],["heart","신뢰",IconHeart],["plant","약재·식물",IconPlant],
  ["seedling","새싹",IconSeedling],["flask","검사",IconFlask],["microscope","품질검사",IconMicroscope],["scale","기준",IconScale],
  ["verified","인증",IconRosetteDiscountCheck],["circle-check","확인",IconCircleCheck],["step","단계",IconCircleNumber1],["arrow","진행",IconArrowRight],
  ["route","경로",IconRoute],["car","직접배송",IconCar],["delivery","운송",IconTruck],["world","지역",IconWorld]
];
function SelectField({label,value,onChange}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const selected=iconOptions.find(([key])=>key===(value||"order"))||iconOptions[0];
  const SelectedIcon=selected[2];
  const filtered=iconOptions.filter(([key,name])=>(key+" "+name).toLowerCase().includes(query.toLowerCase()));
  return <div style={{padding:"12px 0",borderBottom:"1px solid #eee"}}>
    <div style={labelRowStyle}><b>{label}</b></div>
    <button type="button" onClick={()=>setOpen(true)} style={iconSelectedStyle}><SelectedIcon size={30} stroke={1.7}/><span>{selected[1]}</span><small>변경</small></button>
    {open&&<div style={modalBackdropStyle} onClick={()=>setOpen(false)}><div style={iconModalStyle} onClick={(e)=>e.stopPropagation()}>
      <div style={labelRowStyle}><h3 style={{margin:0}}>아이콘 선택</h3><button type="button" onClick={()=>setOpen(false)} style={modalCloseStyle}>닫기</button></div>
      <div style={searchWrapStyle}><IconSearch size={18}/><input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="아이콘 이름 검색" style={searchInputStyle}/></div>
      <div style={iconPickerGridStyle}>{filtered.map(([key,name,Icon])=><button key={key} type="button" onClick={()=>{onChange(key);setOpen(false);setQuery("");}} style={{...iconPickerChoiceStyle,...((value||"order")===key?iconChoiceActiveStyle:{})}}><Icon size={27} stroke={1.7}/><span>{name}</span></button>)}</div>
    </div></div>}
  </div>;
}
function SaveButton({busy,onClick,compact=false}){return <button type="button" onClick={onClick} disabled={busy} style={{...saveButtonStyle,padding:compact?"8px 16px":"10px 20px",marginTop:compact?0:"18px"}}>{busy?"저장 중...":"저장"}</button>}
const sectionGridStyle={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:"14px",marginTop:"28px"};
const sectionCardStyle={display:"flex",flexDirection:"column",alignItems:"flex-start",gap:"8px",minHeight:"130px",padding:"22px",border:"1px solid #dfe7e1",borderRadius:"12px",background:"#fff",color:"#263f35",textAlign:"left",font:"inherit",cursor:"pointer"};
const sectionBackStyle={marginTop:"28px",padding:"9px 13px",border:"1px solid #ccd8d0",borderRadius:"7px",background:"#fff",color:"#315f4e",font:"inherit",cursor:"pointer"};
const toggleStyle={display:"flex",alignItems:"center",gap:"6px",fontSize:"13px"};
const rowActionsStyle={display:"flex",alignItems:"center",gap:"10px"};
const groupActionsStyle={display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"10px",paddingTop:"12px"};
const backButtonStyle={display:"flex",width:"100%",boxSizing:"border-box",alignItems:"center",justifyContent:"center",padding:"12px 16px",background:"#315f4e",color:"#fff",textDecoration:"none",fontSize:"12px",fontWeight:600,borderRadius:"6px"};
const saveButtonStyle={border:"1px solid #315f4e",background:"#315f4e",color:"#fff",borderRadius:"6px",fontSize:"13px",fontWeight:600,cursor:"pointer",flexShrink:0};
const dangerButtonStyle={border:"1px solid #e9b9bd",background:"#f8e1e3",color:"#9b4a50",fontSize:"13px",fontWeight:600,padding:"8px 16px",borderRadius:"6px",cursor:"pointer",flexShrink:0};
const labelRowStyle={display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"8px"};
const inputStyle={display:"block",width:"100%",maxWidth:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #ccd5cc",borderRadius:"6px",font:"inherit"};
const iconSelectedStyle={display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"12px 14px",border:"1px solid #ccd5cc",borderRadius:"8px",background:"#fff",color:"#315f4e",font:"inherit",cursor:"pointer"};
const modalBackdropStyle={position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",background:"rgba(20,35,29,.42)"};
const iconModalStyle={width:"min(760px,100%)",maxHeight:"80vh",overflow:"auto",padding:"22px",borderRadius:"14px",background:"#fff",boxShadow:"0 18px 60px rgba(0,0,0,.18)"};
const modalCloseStyle={border:0,background:"transparent",font:"inherit",cursor:"pointer",color:"#52645b"};
const searchWrapStyle={display:"flex",alignItems:"center",gap:"8px",margin:"14px 0",padding:"0 12px",border:"1px solid #ccd5cc",borderRadius:"8px"};
const searchInputStyle={width:"100%",padding:"11px 0",border:0,outline:"none",font:"inherit"};
const iconPickerGridStyle={display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:"8px"};
const iconPickerChoiceStyle={display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"7px",minHeight:"82px",padding:"10px",border:"1px solid #d9e0da",borderRadius:"8px",background:"#fff",color:"#40544b",font:"inherit",fontSize:"12px",cursor:"pointer"};
const iconChoiceActiveStyle={border:"1px solid #315f4e",background:"#eef4f0",color:"#315f4e",fontWeight:600};

const contentLabels={
  home:{hero_eyebrow:"메인 배너 상단 문구",hero_title:"메인 배너 제목",hero_description:"메인 배너 설명",bottom_copy:"메인 하단 문구"},
  company:{intro_title:"회사소개 제목",intro_paragraph_1:"회사소개 문구 1",intro_paragraph_2:"회사소개 문구 2",intro_paragraph_3:"회사소개 문구 3"},
  history:{title:"연혁 제목",description:"연혁 소개 문구"},
  location:{title:"오시는 길 제목",description:"오시는 길 안내 문구",parking_title:"주차 안내 제목",parking_label:"주차 안내 구분",parking_description:"주차 안내 내용"},
  order_delivery:{intro_title:"주문·배송 안내 제목",intro_description:"주문·배송 소개 문구",delivery_description:"배송 안내 설명",direct_delivery_region:"직접 배송 지역",direct_delivery_description:"직접 배송 설명",parcel_region:"택배 배송 지역",parcel_description:"택배 배송 설명",notice_1:"주문 전 확인사항 1",notice_2:"주문 전 확인사항 2"}
};
function contentLabel(pageKey,key){return contentLabels[pageKey]?.[key]||key;}
