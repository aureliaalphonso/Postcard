import img6522B0D4A4A89D9941Cb4Cba0F4317E01 from "figma:asset/5a49db468c91d7f442070bd7ee97bb4009190f7d.png";
import imgC1Cda94Ae5Ccd9F52388Bc01370770011 from "figma:asset/4413e91ca5c2c745bfddd176b708c998b839f504.png";

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
      <p className="font-['Inria_Serif:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[9px] text-black text-center w-full">Add Image Here</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col h-[60px] items-center justify-center left-1/2 p-[10px] rounded-[2px] top-1/2 w-[110px]">
      <Frame1 />
    </div>
  );
}

function Group() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute contents left-[calc(50%+128.5px)] top-[calc(50%-76.37px)]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[75.253px] left-[calc(50%+128.5px)] top-[calc(50%-76.37px)] w-[55px]" data-name="6522b0d4a4a89d9941cb4cba0f4317e0 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[122.27%] left-[-33.95%] max-w-none top-[-10.91%] w-[167.28%]" src={img6522B0D4A4A89D9941Cb4Cba0F4317E01} />
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute content-stretch flex flex-col h-[61px] items-center justify-center left-[273px] p-[10px] top-[18px] w-[40px]">
      <div className="font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[5px] text-black w-full">
        <p className="leading-[normal] mb-0">Place</p>
        <p className="leading-[normal] mb-0">Stamp</p>
        <p className="leading-[normal]">Here</p>
      </div>
    </div>
  );
}

export default function Card() {
  return (
    <div className="bg-[#f7e2cc] overflow-clip relative rounded-[5px] size-full" data-name="Card 2">
      <Frame />
      <Group />
      <Frame2 />
      <div className="absolute flex h-[67.933px] items-center justify-center left-[272px] top-[45px] w-[68.08px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="flex-none rotate-[56.09deg]">
          <div className="h-[49.272px] relative w-[48.732px]" data-name="c1cda94ae5ccd9f52388bc0137077001 1">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgC1Cda94Ae5Ccd9F52388Bc01370770011} />
          </div>
        </div>
      </div>
    </div>
  );
}