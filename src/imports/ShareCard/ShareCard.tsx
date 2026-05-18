import svgPaths from "./svg-mvw9q9d92w";
import imgRectangle2 from "./184099e36c4916c223dbd2f3c3a9346712ef834a.png";
import imgRectangle1 from "./7bdaf0ee133e793c32025551c88f8862d0bf3403.png";

function Card() {
  return (
    <div className="absolute contents left-[48px] top-[183px]" data-name="Card">
      <div className="absolute flex h-[247.748px] items-center justify-center left-[67.92px] top-[183px] w-[308.082px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-[-163.49deg]">
          <div className="h-[178.874px] relative rounded-[4px] shadow-[4px_4px_35px_0px_rgba(0,0,0,0.25)] w-[268.312px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[4px] size-full" src={imgRectangle2} />
          </div>
        </div>
      </div>
      <div className="absolute h-[178.874px] left-[48px] rounded-[4px] shadow-[4px_4px_35px_0px_rgba(0,0,0,0.25)] top-[277px] w-[268.312px]">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[4px] size-full" src={imgRectangle1} />
      </div>
    </div>
  );
}

function TablerArrowBack() {
  return (
    <div className="relative size-[24px]" data-name="tabler:arrow-back">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tabler:arrow-back">
          <path d={svgPaths.pa54dbc0} id="Vector" stroke="var(--stroke-0, #7E7E7E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex gap-[7px] items-center left-[calc(50%+2px)] top-[501px]">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-180">
          <TablerArrowBack />
        </div>
      </div>
      <p className="font-['Instrument_Serif:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e7e7e] text-[14px] whitespace-nowrap">Click to flip</p>
    </div>
  );
}

function Back() {
  return (
    <div className="absolute left-[15px] size-[24px] top-[99px]" data-name="Back">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Back">
          <path d={svgPaths.p1d219580} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="-translate-x-1/2 absolute bg-black content-stretch flex flex-col h-[46px] items-center justify-center left-1/2 p-[10px] rounded-[10px] top-[620px] w-[334px]" data-name="Button">
      <p className="font-['Instrument_Serif:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[20px] text-center text-white whitespace-nowrap">Continue</p>
    </div>
  );
}

export default function ShareCard() {
  return (
    <div className="bg-white relative size-full" data-name="Share - Card">
      <Card />
      <p className="absolute font-['Instrument_Serif:Regular',sans-serif] leading-[normal] left-[33px] not-italic text-[40px] text-black top-[29px] whitespace-nowrap">POSTCARD</p>
      <p className="absolute font-['Instrument_Serif:Regular',sans-serif] leading-[normal] left-[39px] not-italic text-[14px] text-black top-[589px] whitespace-nowrap">Create your own postcard!</p>
      <Frame />
      <p className="absolute font-['Instrument_Serif:Regular',sans-serif] leading-[normal] left-[calc(50%-16px)] not-italic text-[20px] text-black top-[97px] whitespace-nowrap">Title</p>
      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex items-end justify-center left-1/2 pb-[20px] pt-[10px] w-[402px]" data-name="Made by">
        <div aria-hidden="true" className="absolute border-[#d9d9d9] border-solid border-t-[0.5px] inset-0 pointer-events-none" />
        <p className="font-['Instrument_Serif:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#939393] text-[10px] whitespace-nowrap">{`Designed & build by @aurealphonso `}</p>
      </div>
      <Back />
      <Button />
    </div>
  );
}