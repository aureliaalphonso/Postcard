import img6522B0D4A4A89D9941Cb4Cba0F4317E01 from "figma:asset/5a49db468c91d7f442070bd7ee97bb4009190f7d.png";

function Frame2() {
  return (
    <div className="absolute content-stretch flex h-[34px] items-center left-[15px] p-[10px] top-[206px] w-[301px]">
      <p className="font-['Italianno:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[16px] text-black whitespace-nowrap">Signature</p>
    </div>
  );
}

function Frame() {
  return <div className="absolute h-[110px] left-[16px] top-[87px] w-[301px]" />;
}

function Frame1() {
  return (
    <div className="absolute content-stretch flex h-[51px] items-start left-[16px] p-[10px] top-[36px] w-[240px]">
      <p className="font-['Caveat:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[9px] text-black whitespace-nowrap">Add Text Here</p>
    </div>
  );
}

function Text() {
  return (
    <div className="absolute contents left-[16px] top-[36px]" data-name="Text">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Group() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute contents left-[calc(50%+124.5px)] top-[calc(50%-80.37px)]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[75.253px] left-[calc(50%+124.5px)] top-[calc(50%-80.37px)] w-[55px]" data-name="6522b0d4a4a89d9941cb4cba0f4317e0 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[122.27%] left-[-33.95%] max-w-none top-[-10.91%] w-[167.28%]" src={img6522B0D4A4A89D9941Cb4Cba0F4317E01} />
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute content-stretch flex flex-col h-[61px] items-center justify-center left-[269px] p-[10px] top-[14px] w-[40px]">
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
    <div className="bg-[#f6ece2] overflow-clip relative rounded-[5px] size-full" data-name="Card 1">
      <p className="absolute font-['Inria_Serif:Bold',sans-serif] leading-[normal] left-[15px] not-italic text-[14px] text-black top-[14px] whitespace-nowrap">POSTCARD</p>
      <Frame2 />
      <Text />
      <Group />
      <Frame3 />
    </div>
  );
}